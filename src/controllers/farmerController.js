const farmerRegistry = require('../services/farmerRegistry');
const storage = require('../utils/storage');

async function getAllFarmers(req, res, next) {
  try {
    const farmers = farmerRegistry.getAllFarmers();
    const { village, taluka, district } = req.query;
    let filtered = farmers;
    if (village) filtered = filtered.filter(f => f.village === village);
    if (taluka) filtered = filtered.filter(f => f.taluka === taluka);
    if (district) filtered = filtered.filter(f => f.district === district);
    res.json({ success: true, count: filtered.length, data: filtered });
  } catch (err) {
    next(err);
  }
}

async function getFarmerById(req, res, next) {
  try {
    const farmer = farmerRegistry.getFarmerDetails(req.params.id);
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
    const farmer = farmerRegistry.findFarmerById(id);
    if (!farmer) {
      return res.status(404).json({ success: false, error: 'Farmer not found' });
    }
    const claims = await storage.query('claims.json', c => c.farmerId === id);
    res.json({ success: true, count: claims.length, data: claims });
  } catch (err) {
    next(err);
  }
}

async function getFarmerSurveys(req, res, next) {
  try {
    const { id } = req.params;
    const farmer = farmerRegistry.findFarmerById(id);
    if (!farmer) {
      return res.status(404).json({ success: false, error: 'Farmer not found' });
    }
    const surveys = await storage.query('surveys.json', s => s.farmerId === id);
    res.json({ success: true, count: surveys.length, data: surveys });
  } catch (err) {
    next(err);
  }
}

module.exports = { getAllFarmers, getFarmerById, getFarmerClaims, getFarmerSurveys };
