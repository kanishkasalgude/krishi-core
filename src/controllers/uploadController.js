async function uploadFiles(req, res, next) {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, error: 'No files uploaded' });
    }

    const files = req.files.map(f => ({
      originalName: f.originalname,
      filename: f.filename,
      path: `/uploads/${f.filename}`,
      size: f.size,
      mimetype: f.mimetype,
    }));

    res.status(201).json({ success: true, count: files.length, data: files });
  } catch (err) {
    next(err);
  }
}

module.exports = { uploadFiles };
