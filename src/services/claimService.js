const { v4: uuidv4 } = require('uuid');
const storage = require('../utils/storage');
const aiService = require('./aiService');

const CLAIMS_FILE = 'claims.json';

function makeId() {
  const num = Math.floor(Math.random() * 900) + 100;
  return `CLM-${num}`;
}

async function getAllClaims(statusFilter) {
  const claims = await storage.readCollection(CLAIMS_FILE);
  if (statusFilter) {
    return claims.filter(c => c.status === statusFilter);
  }
  return claims.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

async function getClaimById(id) {
  return storage.findById(CLAIMS_FILE, id);
}

async function createClaim(data) {
  const analysis = aiService.analyzeClaim(data);

  const claim = {
    id: makeId(),
    farmerId: data.farmerId,
    farmerName: data.farmerName || '',
    cropType: data.cropType,
    claimType: data.claimType,
    village: data.village,
    district: data.district || '',
    state: data.state || '',
    geoCoordinates: data.geoCoordinates || { lat: 0, lng: 0 },
    lossAreaAcres: parseFloat(data.lossAreaAcres) || 0,
    description: data.description || '',
    status: 'pending',
    ...analysis,
    images: data.images || [],
    videos: data.videos || [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  return storage.addItem(CLAIMS_FILE, claim);
}

async function updateClaimStatus(id, status, officerRemark) {
  const validStatuses = ['pending', 'approved', 'rejected'];
  if (!validStatuses.includes(status)) {
    throw new Error(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
  }

  const updates = { status };
  if (officerRemark) {
    updates.officerRemark = officerRemark;
  }

  return storage.updateItem(CLAIMS_FILE, id, updates);
}

async function getClaimsByFarmer(farmerId) {
  return storage.query(CLAIMS_FILE, c => c.farmerId === farmerId);
}

module.exports = {
  getAllClaims,
  getClaimById,
  createClaim,
  updateClaimStatus,
  getClaimsByFarmer,
};
