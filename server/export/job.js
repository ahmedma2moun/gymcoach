import fs from 'fs';
import path from 'path';
import { config } from './config.js';
import { serializeDatabase, getCairoNow, buildFileName, maybeGzip } from './serializer.js';
import { sendExportNotification, sendAlertEmail } from './gmail.js';

// ---------------------------------------------------------------------------
// Structured logger — emits JSON lines to stdout/stderr so logs are
// parseable in Vercel's log viewer and any log aggregator.
// ---------------------------------------------------------------------------
function makeLogger(correlationId) {
  const base = () => ({ ts: new Date().toISOString(), correlationId });
  return {
    info: (msg, data = {}) =>
      console.log(JSON.stringify({ ...base(), level: 'info', msg, ...data })),
    warn: (msg, data = {}) =>
      console.warn(JSON.stringify({ ...base(), level: 'warn', msg, ...data })),
    error: (msg, err, data = {}) =>
      console.error(
        JSON.stringify({
          ...base(),
          level: 'error',
          msg,
          error: err?.message,
          stack: err?.stack,
          ...data,
        }),
      ),
  };
}

// ---------------------------------------------------------------------------
// Exponential-backoff retry for transient network errors.
// ---------------------------------------------------------------------------
async function withRetry(fn, { retries = 3, baseDelayMs = 1000, label = 'op', log } = {}) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      const status = err.status ?? err.responseCode;
      const isTransient =
        status === 429 ||
        status === 'ECONNRESET' ||
        status === 'ETIMEDOUT' ||
        (typeof status === 'number' && status >= 500 && status < 600);

      if (attempt === retries || !isTransient) throw err;

      const delay = baseDelayMs * 2 ** attempt;
      log?.warn(`${label} failed — retrying`, {
        attempt: attempt + 1,
        maxAttempts: retries + 1,
        delayMs: delay,
        error: err.message,
      });
      await new Promise(r => setTimeout(r, delay));
    }
  }
}

// ---------------------------------------------------------------------------
// Main export job
// ---------------------------------------------------------------------------
export async function runExportJob({ correlationId = Date.now().toString(36) } = {}) {
  const log = makeLogger(correlationId);
  const jobStart = Date.now();
  const cairoNow = getCairoNow();
  const fileName = buildFileName(cairoNow);
  const filePath = path.join(config.outputDir, fileName);

  log.info('export job started', { cairoDate: cairoNow.date, fileName });

  let finalPath = null;

  try {
    // --- 1. Ensure output directory ---
    fs.mkdirSync(config.outputDir, { recursive: true });

    // --- 2. Serialize database to JSON file ---
    log.info('serializing database', { outputPath: filePath });
    const { rowCount, tableCount } = await serializeDatabase(filePath);
    log.info('serialization complete', { rowCount, tableCount, durationMs: Date.now() - jobStart });

    // --- 3. Gzip if file exceeds threshold ---
    const { finalPath: fp, gzipped, sizeBytes } = await maybeGzip(filePath, config.gzipThresholdMb);
    finalPath = fp;
    const finalName = path.basename(finalPath);
    log.info('file ready', { finalName, gzipped, sizeMb: (sizeBytes / 1024 / 1024).toFixed(2) });

    // --- 4. Send email with file attached ---
    const gmailEnabled = config.gmail.recipients.length > 0;
    if (gmailEnabled) {
      await withRetry(
        () =>
          sendExportNotification({
            date: cairoNow.date,
            rowCount,
            tableCount,
            sizeBytes,
            filePath: finalPath,
            fileName: finalName,
            gzipped,
          }),
        { label: 'gmail.send', log },
      );
      log.info('notification email sent');
    }

    // --- 5. Cleanup local temp file ---
    try { fs.unlinkSync(finalPath); } catch { /* non-fatal */ }

    const result = {
      success: true,
      date: cairoNow.date,
      rowCount,
      tableCount,
      sizeBytes,
      gzipped,
      durationMs: Date.now() - jobStart,
    };
    log.info('export job completed', result);
    return result;
  } catch (err) {
    log.error('export job failed', err, { durationMs: Date.now() - jobStart });

    // --- Alert email on failure ---
    if (config.gmail.recipients.length > 0) {
      try {
        await sendAlertEmail({ date: cairoNow.date, error: err });
      } catch (alertErr) {
        log.error('failed to send alert email', alertErr);
      }
    }

    // Cleanup partial temp file
    try {
      if (finalPath && fs.existsSync(finalPath)) fs.unlinkSync(finalPath);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    } catch { /* ignore */ }

    throw err;
  }
}
