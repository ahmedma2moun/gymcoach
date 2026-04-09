import 'dotenv/config';

/**
 * All export-job configuration read from environment variables.
 * Set these in .env locally or Vercel Environment Variables in production.
 *
 * Required for Gmail:
 *   GMAIL_USER          — the Gmail address that sends the email
 *   GMAIL_APP_PASSWORD  — the 16-char App Password from Google Account → Security → App passwords
 *   GMAIL_RECIPIENTS    — comma-separated list of recipient addresses
 *
 * Required for the trigger endpoint:
 *   CRON_SECRET             — set automatically by Vercel for cron calls
 *   EXPORT_TRIGGER_SECRET   — optional extra secret for manual HTTP triggers
 */
export const config = {
  outputDir: process.env.EXPORT_OUTPUT_DIR || '/tmp/exports',
  gzipThresholdMb: Number(process.env.EXPORT_GZIP_THRESHOLD_MB ?? 50),
  sourceSystem: process.env.EXPORT_SOURCE_SYSTEM || 'AntigravityGym',
  schemaVersion: '1.0.0',

  // Columns stripped from every export (never ship bcrypt hashes)
  excludeColumns: {
    users: ['password'],
  },

  gmail: {
    user: process.env.GMAIL_USER || '',
    appPassword: process.env.GMAIL_APP_PASSWORD || '',
    recipients: (process.env.GMAIL_RECIPIENTS || '').split(',').filter(Boolean),
    subjectTemplate:
      process.env.GMAIL_SUBJECT_TEMPLATE || 'AntigravityGym Daily Export — {date}',
    maxAttachmentSizeMb: Number(process.env.GMAIL_MAX_ATTACHMENT_MB ?? 24),
  },
};
