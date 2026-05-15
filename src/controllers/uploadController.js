async function uploadFiles(req, res, next) {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, error: 'No files uploaded' });
    }

    const getSubPath = (mime) => {
      if (mime.startsWith('image/')) return '/uploads/images';
      if (mime.startsWith('video/')) return '/uploads/videos';
      return '/uploads/documents';
    };
    const files = req.files.map(f => ({
      originalName: f.originalname,
      filename: f.filename,
      path: `${getSubPath(f.mimetype)}/${f.filename}`,
      size: f.size,
      mimetype: f.mimetype,
    }));

    const firstFile = files[0] || {};
    res.status(201).json({ 
      success: true, 
      count: files.length, 
      data: files,
      url: firstFile.path,
      fileName: firstFile.filename,
      path: firstFile.path,
      uploadedAt: new Date().toISOString(),
      message: 'Files uploaded successfully'
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { uploadFiles };
