// ── BUG-09: All error responses now include success:false for frontend consistency ──
function errorHandler(err, req, res, _next) {
  console.error(`[ERROR] ${err.message}`);
  if (process.env.NODE_ENV !== 'production') {
    console.error(err.stack);
  }

  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ success: false, error: 'File too large. Maximum size is 10MB.' });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(413).json({ success: false, error: 'Too many files. Maximum is 10 files.' });
    }
    return res.status(400).json({ success: false, error: err.message });
  }

  if (err.message && err.message.startsWith('Unsupported file type')) {
    return res.status(400).json({ success: false, error: err.message });
  }

  const statusCode = err.statusCode || 500;
  const message = err.statusCode ? err.message : 'Internal server error';

  res.status(statusCode).json({ success: false, error: message });
}

function notFound(req, res) {
  res.status(404).json({ success: false, error: `Route ${req.method} ${req.originalUrl} not found` });
}

module.exports = { errorHandler, notFound };
