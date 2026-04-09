/**
 * Manual CLI trigger for the daily export job.
 *
 * Usage:
 *   node server/scripts/runExport.js
 *
 * Or via npm:
 *   npm run export
 *
 * All configuration is read from .env (or environment variables).
 * This runs the exact same code path as the Vercel cron trigger.
 */
import 'dotenv/config';
import { runExportJob } from '../export/job.js';

const correlationId = 'manual-' + Date.now().toString(36);
console.log(`[runExport] Starting export job (correlationId=${correlationId}) …`);

try {
  const result = await runExportJob({ correlationId });
  if (result.skipped) {
    console.log('[runExport] Job skipped:', result.reason);
  } else {
    console.log('[runExport] Job completed successfully:');
    console.log(`  Date:       ${result.date}`);
    console.log(`  Tables:     ${result.tableCount}`);
    console.log(`  Rows:       ${result.rowCount.toLocaleString()}`);
    console.log(`  Size:       ${(result.sizeBytes / 1024 / 1024).toFixed(2)} MB${result.gzipped ? ' (gzipped)' : ''}`);
    console.log(`  Drive ID:   ${result.driveFileId ?? '(upload skipped)'}`);
    console.log(`  Drive link: ${result.driveLink ?? '(upload skipped)'}`);
    console.log(`  Duration:   ${result.durationMs} ms`);
  }
  process.exit(0);
} catch (err) {
  console.error('[runExport] Job failed:', err.message);
  process.exit(1);
}
