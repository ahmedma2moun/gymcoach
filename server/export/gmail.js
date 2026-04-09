import nodemailer from 'nodemailer';
import { config } from './config.js';

// ---------------------------------------------------------------------------
// Reusable transporter — Gmail SMTP with an App Password.
// Generate the App Password at:
//   Google Account → Security → 2-Step Verification → App passwords
// ---------------------------------------------------------------------------
function buildTransporter() {
  console.log('[gmail] buildTransporter — user:', config.gmail.user || '(not set)');
  console.log('[gmail] buildTransporter — appPassword set:', !!config.gmail.appPassword);
  console.log('[gmail] buildTransporter — recipients:', config.gmail.recipients);

  if (!config.gmail.user || !config.gmail.appPassword) {
    throw new Error(
      'Gmail credentials are not configured. Set GMAIL_USER and GMAIL_APP_PASSWORD.',
    );
  }
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: config.gmail.user,
      pass: config.gmail.appPassword,
    },
  });
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function buildSuccessHtml({ date, rowCount, tableCount, sizeBytes, attachmentNote }) {
  const noteHtml = attachmentNote
    ? `<p style="color:#888"><em>${attachmentNote}</em></p>`
    : '';
  return `<!DOCTYPE html>
<html>
<body style="font-family:Arial,sans-serif;color:#222;max-width:600px">
  <h2 style="color:#2d7d46">AntigravityGym Daily Export — ${date}</h2>
  <table border="1" cellpadding="8" cellspacing="0" style="border-collapse:collapse;width:100%">
    <tr><td><strong>Export date (Cairo)</strong></td><td>${date}</td></tr>
    <tr><td><strong>Tables exported</strong></td><td>${tableCount}</td></tr>
    <tr><td><strong>Total rows</strong></td><td>${rowCount.toLocaleString()}</td></tr>
    <tr><td><strong>File size</strong></td><td>${formatBytes(sizeBytes)}</td></tr>
  </table>
  ${noteHtml}
</body>
</html>`;
}

function buildFailureHtml({ date, error }) {
  return `<!DOCTYPE html>
<html>
<body style="font-family:Arial,sans-serif;color:#222;max-width:600px">
  <h2 style="color:#c0392b">&#9888; AntigravityGym Export FAILED — ${date}</h2>
  <p><strong>Error:</strong> ${error.message}</p>
  <pre style="background:#f8f8f8;padding:12px;overflow:auto">${error.stack ?? ''}</pre>
</body>
</html>`;
}

// ---------------------------------------------------------------------------
// Send a success notification with the export file attached (if under limit).
// ---------------------------------------------------------------------------
export async function sendExportNotification({
  date,
  rowCount,
  tableCount,
  sizeBytes,
  filePath,
  fileName,
  gzipped,
}) {
  const transporter = buildTransporter();
  const maxBytes = config.gmail.maxAttachmentSizeMb * 1024 * 1024;
  const attach = sizeBytes <= maxBytes;
  const mimeType = gzipped ? 'application/gzip' : 'application/json';
  const attachmentNote = attach
    ? null
    : `File (${formatBytes(sizeBytes)}) exceeds the ${config.gmail.maxAttachmentSizeMb} MB attachment limit and was not attached.`;

  const subject = config.gmail.subjectTemplate.replace('{date}', date);

  console.log('[gmail] sendExportNotification — subject:', subject);
  console.log('[gmail] sendExportNotification — to:', config.gmail.recipients.join(', '));
  console.log('[gmail] sendExportNotification — attach file:', attach, '| size:', formatBytes(sizeBytes));

  try {
    const info = await transporter.sendMail({
      from: config.gmail.user,
      to: config.gmail.recipients.join(', '),
      subject,
      html: buildSuccessHtml({ date, rowCount, tableCount, sizeBytes, attachmentNote }),
      attachments: attach
        ? [{ filename: fileName, path: filePath, contentType: mimeType }]
        : [],
    });
    console.log('[gmail] sendExportNotification — sent OK, messageId:', info.messageId);
  } catch (err) {
    console.error('[gmail] sendExportNotification — FAILED:', err.message);
    console.error('[gmail] sendExportNotification — error code:', err.code);
    console.error('[gmail] sendExportNotification — response:', err.response);
    throw err;
  }
}

// ---------------------------------------------------------------------------
// Send an alert email when the export job throws an unrecoverable error.
// ---------------------------------------------------------------------------
export async function sendAlertEmail({ date, error }) {
  const transporter = buildTransporter();

  console.log('[gmail] sendAlertEmail — date:', date, '| error:', error.message);

  try {
    const info = await transporter.sendMail({
      from: config.gmail.user,
      to: config.gmail.recipients.join(', '),
      subject: `ALERT: AntigravityGym Export Failed — ${date}`,
      html: buildFailureHtml({ date, error }),
    });
    console.log('[gmail] sendAlertEmail — sent OK, messageId:', info.messageId);
  } catch (err) {
    console.error('[gmail] sendAlertEmail — FAILED:', err.message);
    console.error('[gmail] sendAlertEmail — error code:', err.code);
    console.error('[gmail] sendAlertEmail — response:', err.response);
    throw err;
  }
}
