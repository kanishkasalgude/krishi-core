const { v4: uuidv4 } = require('uuid');
const storage = require('../utils/storage');
const aiService = require('./aiService');

const CLAIMS_FILE = 'claims.json';

const WORKFLOW_STAGES = [
  'Submitted',
  'Geo Verified',
  'AI Verification Pending',
  'Officer Review',
  'Approved',
  'Rejected',
  'Payment Initiated',
  'DBT Completed',
];

function makeId() {
  const short = uuidv4().replace(/-/g, '').slice(0, 8).toUpperCase();
  return `CLM-${short}`;
}

const REQUIRED_FIELDS = ['farmerId', 'cropType', 'claimType', 'village'];
function validateClaimData(data) {
  const missing = REQUIRED_FIELDS.filter((f) => !data[f] || String(data[f]).trim() === '');
  if (missing.length > 0) {
    const err = new Error(`Missing required fields: ${missing.join(', ')}`);
    err.statusCode = 400;
    throw err;
  }
}

async function getAllClaims(statusFilter) {
  const claims = await storage.readCollection(CLAIMS_FILE);
  const sorted = claims.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  if (statusFilter) {
    return sorted.filter(c => c.status === statusFilter);
  }
  return sorted;
}

async function getClaimById(id) {
  return storage.findById(CLAIMS_FILE, id);
}

async function createClaim(data) {
  validateClaimData(data);

  const analysis = aiService.analyzeClaim(data);
  const newId = makeId();

  const claim = {
    id: newId,
    claimId: newId,
    farmerId: data.farmerId,
    farmerName: data.farmerName || '',
    cropType: data.cropType,
    claimType: data.claimType,
    surveyNumber: data.surveyNumber || '',
    landParcelId: data.landParcelId || '',
    village: data.village,
    taluka: data.taluka || '',
    district: data.district || '',
    state: data.state || '',
    geoCoordinates: data.geoCoordinates || { lat: 0, lng: 0 },
    lossAreaAcres: parseFloat(data.lossAreaAcres) || 0,
    weatherEvent: data.weatherEvent || '',
    eventSeverity: data.eventSeverity || '',
    description: data.description || '',
    status: 'pending',
    workflowStage: 'Submitted',
    confidenceScore: analysis.confidenceScore,
    geoVerified: analysis.geoVerified,
    rainfallMatched: analysis.rainfallMatched,
    duplicateRisk: analysis.duplicateRisk,
    aiRemarks: analysis.aiRemarks,
    assignedOfficer: '',
    reviewRemarks: [],
    reviewTimestamp: null,
    evidenceCount: (data.images ? data.images.length : 0) + (data.videos ? data.videos.length : 0),
    images: data.images || [],
    videos: data.videos || [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  return storage.addItem(CLAIMS_FILE, claim);
}

async function updateClaimStatus(id, status, officerRemark, workflowStage, assignedOfficer) {
  const validStatuses = ['pending', 'approved', 'rejected'];
  if (!validStatuses.includes(status)) {
    throw new Error(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
  }

  const updates = { status };
  if (officerRemark) {
    const newRemark = {
      stage: workflowStage || 'Officer Review',
      remark: officerRemark,
      timestamp: new Date().toISOString(),
    };
    updates.officerRemark = officerRemark;

    const existing = await getClaimById(id);
    const remarks = existing && existing.reviewRemarks ? [...existing.reviewRemarks, newRemark] : [newRemark];
    updates.reviewRemarks = remarks;
    updates.reviewTimestamp = new Date().toISOString();
  }
  if (workflowStage) {
    if (!WORKFLOW_STAGES.includes(workflowStage)) {
      throw new Error(`Invalid workflow stage. Must be one of: ${WORKFLOW_STAGES.join(', ')}`);
    }
    updates.workflowStage = workflowStage;
  }
  if (assignedOfficer) {
    updates.assignedOfficer = assignedOfficer;
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
  WORKFLOW_STAGES,
};
