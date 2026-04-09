// @vitest-environment node
/**
 * Integration test for the export pipeline.
 *
 * Scope: stubs the DB (Prisma) so the test runs without network access,
 * then asserts that a valid JSON file is produced with the correct envelope
 * structure, neutral types, and redacted columns.
 */
import fs from 'fs';
import os from 'os';
import path from 'path';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ---------------------------------------------------------------------------
// Prisma mock — must be hoisted before any import that uses ../db.js
// ---------------------------------------------------------------------------
vi.mock('../../server/db.js', () => {
  const mockPrisma = {
    $queryRawUnsafe: vi.fn(),
  };
  return { default: mockPrisma };
});

// ---------------------------------------------------------------------------
// Import AFTER mocks are registered
// ---------------------------------------------------------------------------
import prisma from '../../server/db.js';
import { serializeDatabase } from '../../server/export/serializer.js';

// ---------------------------------------------------------------------------
// Fixture data that mimics the 4 real tables (information_schema + rows)
// ---------------------------------------------------------------------------
const TABLES_RESULT = [
  { table_name: 'exercises' },
  { table_name: 'plan_exercises' },
  { table_name: 'plans' },
  { table_name: 'users' },
];

const COLUMNS = {
  exercises: [
    { column_name: 'id',       data_type: 'bigint',  is_nullable: 'NO',  constraint_type: 'PRIMARY KEY' },
    { column_name: 'name',     data_type: 'text',    is_nullable: 'NO',  constraint_type: '' },
    { column_name: 'video_url',data_type: 'text',    is_nullable: 'NO',  constraint_type: '' },
  ],
  plan_exercises: [
    { column_name: 'id',            data_type: 'integer', is_nullable: 'NO',  constraint_type: 'PRIMARY KEY' },
    { column_name: 'plan_id',       data_type: 'bigint',  is_nullable: 'NO',  constraint_type: '' },
    { column_name: 'exercise_order',data_type: 'integer', is_nullable: 'NO',  constraint_type: '' },
    { column_name: 'done',          data_type: 'boolean', is_nullable: 'NO',  constraint_type: '' },
    { column_name: 'completed_at',  data_type: 'timestamp without time zone', is_nullable: 'YES', constraint_type: '' },
    { column_name: 'weight_kg',     data_type: 'text',    is_nullable: 'NO',  constraint_type: '' },
  ],
  plans: [
    { column_name: 'id',         data_type: 'bigint',   is_nullable: 'NO',  constraint_type: 'PRIMARY KEY' },
    { column_name: 'user_id',    data_type: 'bigint',   is_nullable: 'NO',  constraint_type: '' },
    { column_name: 'title',      data_type: 'text',     is_nullable: 'NO',  constraint_type: '' },
    { column_name: 'created_at', data_type: 'timestamp without time zone', is_nullable: 'NO', constraint_type: '' },
  ],
  users: [
    { column_name: 'id',        data_type: 'bigint',  is_nullable: 'NO',  constraint_type: 'PRIMARY KEY' },
    { column_name: 'username',  data_type: 'text',    is_nullable: 'NO',  constraint_type: '' },
    { column_name: 'password',  data_type: 'text',    is_nullable: 'NO',  constraint_type: '' }, // must be excluded
    { column_name: 'role',      data_type: 'text',    is_nullable: 'NO',  constraint_type: '' },
    { column_name: 'is_active', data_type: 'boolean', is_nullable: 'NO',  constraint_type: '' },
  ],
};

const ROWS = {
  exercises: [
    { id: BigInt('1710000000001'), name: 'Push-up', video_url: '' },
  ],
  plan_exercises: [
    {
      id: 1,
      plan_id: BigInt('1710000000002'),
      exercise_order: 0,
      done: false,
      completed_at: null,
      weight_kg: '80',
    },
  ],
  plans: [
    {
      id: BigInt('1710000000002'),
      user_id: BigInt('1710000000003'),
      title: 'Day 1',
      created_at: new Date('2026-04-09T22:00:00.000Z'),
    },
  ],
  users: [
    {
      id: BigInt('1710000000003'),
      username: 'coach1',
      password: '$2b$10$SHOULDNOTAPPEAR',
      role: 'admin',
      is_active: true,
    },
  ],
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
let tmpDir;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'gym-export-test-'));
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
  vi.restoreAllMocks();
});

// Build the mock implementation for prisma.$queryRawUnsafe
function setupPrismaMock() {
  prisma.$queryRawUnsafe.mockImplementation(async (sql, ...params) => {
    // Tables query
    if (sql.includes('information_schema.tables')) return TABLES_RESULT;

    // Columns query — $1 = table_name
    if (sql.includes('information_schema.columns')) {
      const table = params[0];
      return COLUMNS[table] ?? [];
    }

    // COUNT query
    if (sql.includes('COUNT(*)')) {
      const match = sql.match(/FROM "(\w+)"/);
      const table = match?.[1];
      const rows = ROWS[table] ?? [];
      return [{ count: rows.length }];
    }

    // Row SELECT
    const match = sql.match(/FROM "(\w+)"/);
    const table = match?.[1];
    return ROWS[table] ?? [];
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('serializeDatabase integration', () => {
  it('produces a valid JSON file with the correct envelope', async () => {
    setupPrismaMock();
    const filePath = path.join(tmpDir, 'export.json');

    await serializeDatabase(filePath);

    expect(fs.existsSync(filePath)).toBe(true);
    const raw = fs.readFileSync(filePath, 'utf8');
    const doc = JSON.parse(raw); // must not throw

    expect(doc).toHaveProperty('exportMetadata');
    expect(doc).toHaveProperty('tables');
    expect(Array.isArray(doc.tables)).toBe(true);
  });

  it('exportMetadata contains all required fields', async () => {
    setupPrismaMock();
    const filePath = path.join(tmpDir, 'export.json');

    await serializeDatabase(filePath);

    const { exportMetadata } = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    expect(exportMetadata).toHaveProperty('exportedAtUtc');
    expect(exportMetadata).toHaveProperty('exportedAtCairo');
    expect(exportMetadata).toHaveProperty('sourceSystem');
    expect(exportMetadata).toHaveProperty('schemaVersion');
    expect(exportMetadata).toHaveProperty('tableCount', 4);
    expect(exportMetadata).toHaveProperty('rowCount', 4); // 1+1+1+1
  });

  it('exportedAtUtc ends with Z (UTC)', async () => {
    setupPrismaMock();
    const filePath = path.join(tmpDir, 'export.json');
    await serializeDatabase(filePath);
    const { exportMetadata } = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    expect(exportMetadata.exportedAtUtc).toMatch(/Z$/);
  });

  it('exportedAtCairo ends with +02:00', async () => {
    setupPrismaMock();
    const filePath = path.join(tmpDir, 'export.json');
    await serializeDatabase(filePath);
    const { exportMetadata } = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    expect(exportMetadata.exportedAtCairo).toMatch(/\+02:00$/);
  });

  it('each table has name, primaryKey, columns, rows arrays', async () => {
    setupPrismaMock();
    const filePath = path.join(tmpDir, 'export.json');
    await serializeDatabase(filePath);
    const { tables } = JSON.parse(fs.readFileSync(filePath, 'utf8'));

    for (const t of tables) {
      expect(t).toHaveProperty('name');
      expect(t).toHaveProperty('primaryKey');
      expect(Array.isArray(t.primaryKey)).toBe(true);
      expect(t).toHaveProperty('columns');
      expect(Array.isArray(t.columns)).toBe(true);
      expect(t).toHaveProperty('rows');
      expect(Array.isArray(t.rows)).toBe(true);
    }
  });

  it('redacts the password column from the users table', async () => {
    setupPrismaMock();
    const filePath = path.join(tmpDir, 'export.json');
    await serializeDatabase(filePath);

    const { tables } = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const usersTable = tables.find(t => t.name === 'users');

    // Column metadata must not list password
    const colNames = usersTable.columns.map(c => c.name);
    expect(colNames).not.toContain('password');

    // Row data must not contain password
    for (const row of usersTable.rows) {
      expect(row).not.toHaveProperty('password');
    }
  });

  it('serializes BigInt IDs as strings (safe for JSON)', async () => {
    setupPrismaMock();
    const filePath = path.join(tmpDir, 'export.json');
    await serializeDatabase(filePath);

    const { tables } = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const exercises = tables.find(t => t.name === 'exercises');
    const [row] = exercises.rows;

    // Must be a string, not a number (BigInt > 2^53 loses precision as JSON number)
    expect(typeof row.id).toBe('string');
    expect(row.id).toBe('1710000000001');
  });

  it('serializes Date columns as UTC ISO-8601 strings ending in Z', async () => {
    setupPrismaMock();
    const filePath = path.join(tmpDir, 'export.json');
    await serializeDatabase(filePath);

    const { tables } = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const plans = tables.find(t => t.name === 'plans');
    const [row] = plans.rows;

    expect(row.created_at).toBe('2026-04-09T22:00:00.000Z');
  });

  it('preserves explicit null values', async () => {
    setupPrismaMock();
    const filePath = path.join(tmpDir, 'export.json');
    await serializeDatabase(filePath);

    const { tables } = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const pe = tables.find(t => t.name === 'plan_exercises');
    const [row] = pe.rows;

    expect(row.completed_at).toBeNull();
  });

  it('handles empty tables gracefully', async () => {
    prisma.$queryRawUnsafe.mockImplementation(async (sql, ...params) => {
      if (sql.includes('information_schema.tables')) return [{ table_name: 'exercises' }];
      if (sql.includes('information_schema.columns')) return COLUMNS.exercises;
      if (sql.includes('COUNT(*)')) return [{ count: 0 }];
      return []; // no rows
    });

    const filePath = path.join(tmpDir, 'empty.json');
    await serializeDatabase(filePath);

    const { tables } = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    expect(tables[0].rows).toEqual([]);
  });

  it('returns correct rowCount and tableCount', async () => {
    setupPrismaMock();
    const filePath = path.join(tmpDir, 'export.json');
    const result = await serializeDatabase(filePath);

    expect(result.rowCount).toBe(4);
    expect(result.tableCount).toBe(4);
  });

  it('produces valid JSON even with multiple tables', async () => {
    setupPrismaMock();
    const filePath = path.join(tmpDir, 'multi.json');
    await serializeDatabase(filePath);

    // If JSON.parse succeeds without throwing, the file is well-formed
    const doc = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    expect(doc.tables).toHaveLength(4);
  });
});
