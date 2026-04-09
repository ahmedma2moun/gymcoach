import fs from 'fs';
import path from 'path';
import zlib from 'zlib';
import { pipeline } from 'stream/promises';
import prisma from '../db.js';
import { config } from './config.js';

// ---------------------------------------------------------------------------
// Type mapping: PostgreSQL data_type → database-agnostic neutral type
// ---------------------------------------------------------------------------
export function pgTypeToNeutral(pgType) {
  const t = (pgType || '').toLowerCase();
  if (['bigint', 'int8', 'bigserial'].includes(t)) return 'long';
  if (['integer', 'int', 'int4', 'serial', 'smallint', 'int2', 'smallserial'].includes(t))
    return 'int';
  if (['numeric', 'decimal'].includes(t)) return 'decimal';
  if (['real', 'float4', 'double precision', 'float8'].includes(t)) return 'decimal';
  if (['boolean', 'bool'].includes(t)) return 'bool';
  if (['uuid'].includes(t)) return 'guid';
  if (
    [
      'timestamp without time zone',
      'timestamp with time zone',
      'timestamptz',
      'timestamp',
      'date',
    ].includes(t)
  )
    return 'datetime';
  if (['bytea'].includes(t)) return 'bytes';
  if (['json', 'jsonb'].includes(t)) return 'json';
  return 'string';
}

// ---------------------------------------------------------------------------
// Value serialization: JS value → JSON-safe neutral-typed value
// ---------------------------------------------------------------------------
export function serializeValue(value, neutralType) {
  if (value === null || value === undefined) return null;

  switch (neutralType) {
    case 'datetime':
      // Always emit UTC ISO-8601 with Z suffix
      if (value instanceof Date) return value.toISOString();
      return new Date(value).toISOString();

    case 'bytes':
      if (Buffer.isBuffer(value)) return value.toString('base64');
      return Buffer.from(value).toString('base64');

    case 'decimal':
      // Preserve full precision — serialize as string
      return value.toString();

    case 'long':
      // BigInt overflows JSON number range at >2^53; always stringify
      if (typeof value === 'bigint') return value.toString();
      return value;

    case 'json':
      // Already a JS object from Prisma — return as-is (JSON.stringify handles it)
      return value;

    default:
      return value;
  }
}

// ---------------------------------------------------------------------------
// Cairo time helpers
// Africa/Cairo is UTC+2 permanently (DST abolished in 2011)
// ---------------------------------------------------------------------------
export function getCairoNow() {
  const now = new Date();
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Africa/Cairo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
  const parts = Object.fromEntries(fmt.formatToParts(now).map(p => [p.type, p.value]));
  const iso = `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}:${parts.second}+02:00`;
  const fileStamp = `${parts.year}${parts.month}${parts.day}-${parts.hour}${parts.minute}`;
  return { iso, fileStamp, date: `${parts.year}-${parts.month}-${parts.day}` };
}

export function buildFileName(cairo) {
  return `gym-export-${cairo.fileStamp}.json`;
}

// ---------------------------------------------------------------------------
// Schema discovery via information_schema (database-agnostic metadata)
// ---------------------------------------------------------------------------
async function discoverTables() {
  const tableRows = await prisma.$queryRawUnsafe(`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
      AND table_name NOT IN ('_prisma_migrations')
    ORDER BY table_name
  `);

  const tables = [];
  for (const { table_name } of tableRows) {
    const colRows = await prisma.$queryRawUnsafe(
      `
      SELECT
        c.column_name,
        c.data_type,
        c.is_nullable,
        COALESCE((
          SELECT 'PRIMARY KEY'
          FROM information_schema.key_column_usage kcu
          JOIN information_schema.table_constraints tc
            ON  tc.constraint_name = kcu.constraint_name
            AND tc.table_schema    = kcu.table_schema
            AND tc.table_name      = kcu.table_name
          WHERE kcu.table_schema = 'public'
            AND kcu.table_name   = $1
            AND kcu.column_name  = c.column_name
            AND tc.constraint_type = 'PRIMARY KEY'
          LIMIT 1
        ), '') AS constraint_type
      FROM information_schema.columns c
      WHERE c.table_schema = 'public'
        AND c.table_name   = $1
      ORDER BY c.ordinal_position
      `,
      table_name,
    );

    const excluded = config.excludeColumns[table_name] || [];
    const columns = colRows
      .filter(c => !excluded.includes(c.column_name))
      .map(c => ({
        name: c.column_name,
        type: pgTypeToNeutral(c.data_type),
        nullable: c.is_nullable === 'YES',
      }));

    const primaryKey = colRows
      .filter(c => c.constraint_type === 'PRIMARY KEY')
      .map(c => c.column_name);

    // Names of columns to SELECT (excludes sensitive ones)
    const selectNames = columns.map(c => c.name);

    tables.push({ name: table_name, primaryKey, columns, selectNames });
  }
  return tables;
}

// ---------------------------------------------------------------------------
// Streaming JSON writer — writes directly to a WriteStream, never in memory
// ---------------------------------------------------------------------------
function writeToStream(ws, chunk) {
  return new Promise((resolve, reject) => {
    const ok = ws.write(chunk);
    if (!ok) {
      ws.once('drain', resolve);
      ws.once('error', reject);
    } else {
      resolve();
    }
  });
}

function closeStream(ws) {
  return new Promise((resolve, reject) => {
    ws.end();
    ws.once('finish', resolve);
    ws.once('error', reject);
  });
}

export async function serializeDatabase(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });

  const tables = await discoverTables();

  // Pre-count rows per table for metadata (cheap COUNT(*) queries)
  let totalRows = 0;
  for (const t of tables) {
    const [{ count }] = await prisma.$queryRawUnsafe(
      `SELECT COUNT(*)::int AS count FROM "${t.name}"`,
    );
    t.rowCount = Number(count);
    totalRows += t.rowCount;
  }

  const cairoNow = getCairoNow();
  const ws = fs.createWriteStream(filePath, { encoding: 'utf8' });

  // --- Envelope open ---
  const metadata = {
    exportedAtUtc: new Date().toISOString(),
    exportedAtCairo: cairoNow.iso,
    sourceSystem: config.sourceSystem,
    schemaVersion: config.schemaVersion,
    tableCount: tables.length,
    rowCount: totalRows,
  };
  await writeToStream(ws, `{"exportMetadata":${JSON.stringify(metadata)},"tables":[`);

  // --- Tables ---
  for (let ti = 0; ti < tables.length; ti++) {
    const t = tables[ti];

    // Table header (columns metadata)
    await writeToStream(
      ws,
      `{"name":${JSON.stringify(t.name)},"primaryKey":${JSON.stringify(t.primaryKey)},"columns":${JSON.stringify(t.columns)},"rows":[`,
    );

    // Fetch rows — quoted identifiers guard against reserved-word names
    const colList = t.selectNames.map(n => `"${n}"`).join(', ');
    const rows = await prisma.$queryRawUnsafe(`SELECT ${colList} FROM "${t.name}"`);

    for (let ri = 0; ri < rows.length; ri++) {
      const row = rows[ri];
      const serialized = {};
      for (const col of t.columns) {
        serialized[col.name] = serializeValue(row[col.name], col.type);
      }
      const comma = ri < rows.length - 1 ? ',' : '';
      await writeToStream(ws, JSON.stringify(serialized) + comma);
    }

    const tableSep = ti < tables.length - 1 ? '},' : '}';
    await writeToStream(ws, `]${tableSep}`);
  }

  // --- Envelope close ---
  await writeToStream(ws, ']}');
  await closeStream(ws);

  return { filePath, rowCount: totalRows, tableCount: tables.length };
}

// ---------------------------------------------------------------------------
// Optional gzip: compress if file exceeds threshold, remove original
// ---------------------------------------------------------------------------
export async function maybeGzip(filePath, thresholdMb) {
  const stats = fs.statSync(filePath);
  const sizeMb = stats.size / (1024 * 1024);

  if (sizeMb < thresholdMb) {
    return { finalPath: filePath, gzipped: false, sizeBytes: stats.size };
  }

  const gzPath = filePath + '.gz';
  await pipeline(
    fs.createReadStream(filePath),
    zlib.createGzip({ level: zlib.constants.Z_BEST_COMPRESSION }),
    fs.createWriteStream(gzPath),
  );
  fs.unlinkSync(filePath);

  return { finalPath: gzPath, gzipped: true, sizeBytes: fs.statSync(gzPath).size };
}
