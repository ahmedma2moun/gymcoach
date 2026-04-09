// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { pgTypeToNeutral, serializeValue, getCairoNow, buildFileName } from '../../server/export/serializer.js';

// ---------------------------------------------------------------------------
// pgTypeToNeutral
// ---------------------------------------------------------------------------
describe('pgTypeToNeutral', () => {
  it.each([
    ['bigint',                        'long'],
    ['int8',                          'long'],
    ['bigserial',                     'long'],
    ['integer',                       'int'],
    ['int',                           'int'],
    ['int4',                          'int'],
    ['serial',                        'int'],
    ['smallint',                      'int'],
    ['smallserial',                   'int'],
    ['numeric',                       'decimal'],
    ['decimal',                       'decimal'],
    ['real',                          'decimal'],
    ['double precision',              'decimal'],
    ['float8',                        'decimal'],
    ['boolean',                       'bool'],
    ['bool',                          'bool'],
    ['uuid',                          'guid'],
    ['timestamp without time zone',   'datetime'],
    ['timestamp with time zone',      'datetime'],
    ['timestamptz',                   'datetime'],
    ['timestamp',                     'datetime'],
    ['date',                          'datetime'],
    ['bytea',                         'bytes'],
    ['json',                          'json'],
    ['jsonb',                         'json'],
    ['text',                          'string'],
    ['varchar',                       'string'],
    ['character varying',             'string'],
    ['unknown_type',                  'string'],
  ])('maps %s → %s', (pgType, expected) => {
    expect(pgTypeToNeutral(pgType)).toBe(expected);
  });

  it('is case-insensitive', () => {
    expect(pgTypeToNeutral('BIGINT')).toBe('long');
    expect(pgTypeToNeutral('Boolean')).toBe('bool');
  });

  it('handles null/undefined gracefully', () => {
    expect(pgTypeToNeutral(null)).toBe('string');
    expect(pgTypeToNeutral(undefined)).toBe('string');
  });
});

// ---------------------------------------------------------------------------
// serializeValue
// ---------------------------------------------------------------------------
describe('serializeValue', () => {
  // Nulls are always preserved
  it('returns null for null', () => {
    expect(serializeValue(null, 'string')).toBeNull();
    expect(serializeValue(null, 'datetime')).toBeNull();
    expect(serializeValue(null, 'long')).toBeNull();
  });

  it('returns null for undefined', () => {
    expect(serializeValue(undefined, 'string')).toBeNull();
  });

  // Datetime → UTC ISO-8601 with Z
  describe('datetime', () => {
    it('serializes a Date object to UTC ISO string', () => {
      const d = new Date('2026-04-09T22:00:00.000Z');
      expect(serializeValue(d, 'datetime')).toBe('2026-04-09T22:00:00.000Z');
    });

    it('serializes a date string to UTC ISO string', () => {
      const result = serializeValue('2026-04-09T22:00:00Z', 'datetime');
      expect(result).toMatch(/Z$/);
    });

    it('always ends with Z (UTC)', () => {
      const result = serializeValue(new Date(), 'datetime');
      expect(result).toMatch(/Z$/);
    });
  });

  // Binary → base64
  describe('bytes', () => {
    it('encodes a Buffer to base64', () => {
      const buf = Buffer.from('hello');
      expect(serializeValue(buf, 'bytes')).toBe('aGVsbG8=');
    });

    it('encodes a Uint8Array to base64', () => {
      const arr = new Uint8Array([0x68, 0x69]); // "hi"
      expect(serializeValue(arr, 'bytes')).toBe('aGk=');
    });
  });

  // Decimal → string for full precision
  describe('decimal', () => {
    it('serializes a number as string', () => {
      expect(serializeValue(1.23456789, 'decimal')).toBe('1.23456789');
    });

    it('preserves precision of large decimal strings', () => {
      // Prisma returns numeric as a string from pg
      expect(serializeValue('99999999999999.123456', 'decimal')).toBe('99999999999999.123456');
    });
  });

  // Long (BigInt) → string
  describe('long', () => {
    it('serializes BigInt as string', () => {
      expect(serializeValue(BigInt('9007199254740993'), 'long')).toBe('9007199254740993');
    });

    it('passes through a regular number', () => {
      expect(serializeValue(42, 'long')).toBe(42);
    });
  });

  // Bool → boolean
  describe('bool', () => {
    it('passes true through unchanged', () => {
      expect(serializeValue(true, 'bool')).toBe(true);
    });

    it('passes false through unchanged', () => {
      expect(serializeValue(false, 'bool')).toBe(false);
    });
  });

  // String passthrough
  describe('string', () => {
    it('passes strings through unchanged', () => {
      expect(serializeValue('hello', 'string')).toBe('hello');
    });

    it('passes empty string through', () => {
      expect(serializeValue('', 'string')).toBe('');
    });
  });

  // JSON passthrough
  describe('json', () => {
    it('passes object through unchanged', () => {
      const obj = { a: 1, b: 'two' };
      expect(serializeValue(obj, 'json')).toEqual(obj);
    });

    it('passes array through unchanged', () => {
      const arr = [1, 2, 3];
      expect(serializeValue(arr, 'json')).toEqual(arr);
    });
  });
});

// ---------------------------------------------------------------------------
// getCairoNow
// ---------------------------------------------------------------------------
describe('getCairoNow', () => {
  it('returns an iso string with +02:00 offset (Cairo is always UTC+2)', () => {
    const { iso } = getCairoNow();
    expect(iso).toMatch(/\+02:00$/);
  });

  it('returns a valid date string', () => {
    const { date } = getCairoNow();
    expect(date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('returns a fileStamp of yyyyMMdd-HHmm format', () => {
    const { fileStamp } = getCairoNow();
    expect(fileStamp).toMatch(/^\d{8}-\d{4}$/);
  });

  it('iso string is parseable by Date', () => {
    const { iso } = getCairoNow();
    expect(isNaN(new Date(iso).getTime())).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// buildFileName
// ---------------------------------------------------------------------------
describe('buildFileName', () => {
  it('uses the fileStamp from getCairoNow', () => {
    const cairo = { fileStamp: '20260410-0000' };
    expect(buildFileName(cairo)).toBe('gym-export-20260410-0000.json');
  });
});
