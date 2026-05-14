const storage = require('../utils/storage');

const KYC_FILE = 'kyc.json';

async function getAllKyc(req, res, next) {
  try {
    const data = await storage.readCollection(KYC_FILE);
    const { status } = req.query;
    if (status) {
      const filtered = data.filter(k => k.status === status);
      return res.json({ success: true, count: filtered.length, data: filtered });
    }
    res.json({ success: true, count: data.length, data });
  } catch (err) {
    next(err);
  }
}

async function getKycByFarmer(req, res, next) {
  try {
    const data = await storage.readCollection(KYC_FILE);
    const record = data.find(k => k.farmerId === req.params.farmerId);
    if (!record) {
      return res.status(404).json({ success: false, error: 'KYC record not found' });
    }
    res.json({ success: true, data: record });
  } catch (err) {
    next(err);
  }
}

module.exports = { getAllKyc, getKycByFarmer };
