const claimService = require('../services/claimService');

async function getAllClaims(req, res, next) {
  try {
    const { status } = req.query;
    const claims = await claimService.getAllClaims(status);
    res.json({ success: true, count: claims.length, data: claims });
  } catch (err) {
    next(err);
  }
}

async function getClaimById(req, res, next) {
  try {
    const claim = await claimService.getClaimById(req.params.id);
    if (!claim) {
      return res.status(404).json({ success: false, error: 'Claim not found' });
    }
    res.json({ success: true, data: claim });
  } catch (err) {
    next(err);
  }
}

async function createClaim(req, res, next) {
  try {
    const files = req.files || [];
    const images = files
      .filter(f => f.mimetype.startsWith('image/'))
      .map(f => `/uploads/${f.filename}`);
    const videos = files
      .filter(f => f.mimetype.startsWith('video/'))
      .map(f => `/uploads/${f.filename}`);

    const claimData = {
      ...req.body,
      images,
      videos,
    };

    const claim = await claimService.createClaim(claimData);
    res.status(201).json({ success: true, data: claim });
  } catch (err) {
    next(err);
  }
}

async function updateClaimStatus(req, res, next) {
  try {
    const { id } = req.params;
    const { status, officerRemark } = req.body;

    if (!status) {
      return res.status(400).json({ success: false, error: 'Status is required' });
    }

    const updated = await claimService.updateClaimStatus(id, status, officerRemark);
    if (!updated) {
      return res.status(404).json({ success: false, error: 'Claim not found' });
    }

    res.json({ success: true, data: updated });
  } catch (err) {
    if (err.message && err.message.startsWith('Invalid status')) {
      return res.status(400).json({ success: false, error: err.message });
    }
    next(err);
  }
}

async function getClaimsSummary(req, res, next) {
  try {
    const claims = await claimService.getAllClaims();
    const summary = {
      total: claims.length,
      pending: claims.filter(c => c.status === 'pending').length,
      approved: claims.filter(c => c.status === 'approved').length,
      rejected: claims.filter(c => c.status === 'rejected').length,
    };
    res.json({ success: true, data: summary });
  } catch (err) {
    next(err);
  }
}

module.exports = { getAllClaims, getClaimById, createClaim, updateClaimStatus, getClaimsSummary };
