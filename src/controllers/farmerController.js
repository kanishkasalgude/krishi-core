const storage = require('../utils/storage');

const FARMERS_FILE = 'farmers.json';

async function getAllFarmers(req, res, next) {
  try {
    const farmers = await storage.readCollection(FARMERS_FILE);
    res.json({ success: true, count: farmers.length, data: farmers });
  } catch (err) {
    next(err);
  }
}

async function getFarmerById(req, res, next) {
  try {
    const farmers = await storage.readCollection(FARMERS_FILE);
    const farmer = farmers.find(f => f.farmerId === req.params.id);
    if (!farmer) {
      return res.status(404).json({ success: false, error: 'Farmer not found' });
    }
    res.json({ success: true, data: farmer });
  } catch (err) {
    next(err);
  }
}

async function getFarmerClaims(req, res, next) {
  try {
    const { id } = req.params;
    const claims = await storage.query('claims.json', c => c.farmerId === id);
    res.json({ success: true, count: claims.length, data: claims });
  } catch (err) {
    next(err);
  }
}

module.exports = { getAllFarmers, getFarmerById, getFarmerClaims };
