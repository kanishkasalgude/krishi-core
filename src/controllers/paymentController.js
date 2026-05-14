const storage = require('../utils/storage');

const PAYMENTS_FILE = 'payments.json';

async function getAllPayments(req, res, next) {
  try {
    const data = await storage.readCollection(PAYMENTS_FILE);
    const { status } = req.query;
    if (status) {
      const filtered = data.filter(p => p.status === status);
      return res.json({ success: true, count: filtered.length, data: filtered });
    }
    res.json({ success: true, count: data.length, data });
  } catch (err) {
    next(err);
  }
}

async function getPaymentByClaim(req, res, next) {
  try {
    const data = await storage.readCollection(PAYMENTS_FILE);
    const payment = data.find(p => p.claimId === req.params.claimId);
    if (!payment) {
      return res.status(404).json({ success: false, error: 'Payment record not found' });
    }
    res.json({ success: true, data: payment });
  } catch (err) {
    next(err);
  }
}

module.exports = { getAllPayments, getPaymentByClaim };
