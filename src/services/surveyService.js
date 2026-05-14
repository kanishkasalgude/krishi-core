const { v4: uuidv4 } = require('uuid');
const storage = require('../utils/storage');
const farmerRegistry = require('./farmerRegistry');
const aiService = require('./aiService');
const reportService = require('./reportService');

const SURVEYS_FILE = 'surveys.json';

const SURVEY_WORKFLOW_STAGES = [
  'Survey Submitted',
  'Pending Sahayak Verification',
  'Geo Verification Complete',
  'Escalated to Circle Officer',
  'Re-Survey Requested',
  'Verification Completed',
];

function makeReportId() {
  const short = uuidv4().replace(/-/g, '').slice(0, 8).toUpperCase();
  return `SRV-${short}`;
}

function validateSurveyData(data) {
  const required = ['farmerId', 'cropType', 'damageType', 'village', 'landParcelId'];
  const missing = required.filter(f => !data[f] || String(data[f]).trim() === '');
  if (missing.length > 0) {
    const err = new Error(`Missing required fields: ${missing.join(', ')}`);
    err.statusCode = 400;
    throw err;
  }
  const farmer = farmerRegistry.findFarmerById(data.farmerId);
  if (!farmer) {
    const err = new Error(`Farmer ID '${data.farmerId}' not found in Agristack registry`);
    err.statusCode = 404;
    throw err;
  }
  return farmer;
}

function getSeverityLevel(analysis) {
  if (analysis.confidenceScore >= 85 && analysis.geoVerified && analysis.rainfallMatched) return 'Critical';
  if (analysis.confidenceScore >= 70) return 'High';
  if (analysis.confidenceScore >= 50) return 'Moderate';
  return 'Low';
}

async function submitSurvey(data, files = []) {
  const farmer = validateSurveyData(data);
  const farmerDetails = farmerRegistry.getFarmerDetails(data.farmerId);

  const analysis = aiService.analyzeClaim({ cropType: data.cropType, village: data.village });

  const images = files
    .filter(f => f.mimetype.startsWith('image/'))
    .map(f => `/uploads/images/${f.filename}`);
  const videos = files
    .filter(f => f.mimetype.startsWith('video/'))
    .map(f => `/uploads/videos/${f.filename}`);

  const reportId = makeReportId();

  const survey = {
    id: reportId,
    reportId,
    farmerId: data.farmerId,
    farmerName: farmerDetails.name,
    farmerDetails: {
      mobile: farmerDetails.mobile,
      aadhaarMasked: farmerDetails.aadhaarMasked,
      gender: farmerDetails.gender,
      age: farmerDetails.age,
      district: farmerDetails.district,
      taluka: farmerDetails.taluka,
      village: farmerDetails.village,
      khasraNumber: farmerDetails.khasraNumber,
      gatNumber: farmerDetails.gatNumber,
      landHoldingHa: farmerDetails.landHoldingHa,
      landType: farmerDetails.landType,
      soilType: farmerDetails.soilType,
      irrigationSource: farmerDetails.irrigationSource,
      primaryCrop: farmerDetails.primaryCrop,
      secondaryCrop: farmerDetails.secondaryCrop,
      pmKisanBeneficiary: farmerDetails.pmKisanBeneficiary,
      pmfbyEnrolled: farmerDetails.pmfbyEnrolled,
      ndviBaseline: farmerDetails.ndviBaseline,
      ndviCurrent: farmerDetails.ndviCurrent,
      ndviDropPct: farmerDetails.ndviDropPct,
      lastDamageScorePct: farmerDetails.lastDamageScorePct,
      lastClaimStatus: farmerDetails.lastClaimStatus,
    },
    landParcelDetails: {
      landParcelId: data.landParcelId,
      khasraNumber: farmerDetails.khasraNumber,
      gatNumber: farmerDetails.gatNumber,
      landHoldingHa: farmerDetails.landHoldingHa,
      landType: farmerDetails.landType,
      soilType: farmerDetails.soilType,
      irrigationSource: farmerDetails.irrigationSource,
      plotCentroidLat: farmerDetails.plotCentroidLat,
      plotCentroidLon: farmerDetails.plotCentroidLon,
      plotBoundaryRadiusM: farmerDetails.plotBoundaryRadiusM,
    },
    cropType: data.cropType,
    damageType: data.damageType,
    village: data.village,
    taluka: farmerDetails.taluka,
    district: farmerDetails.district,
    state: farmerDetails.state,
    geoCoordinates: data.geoCoordinates || { lat: 0, lng: 0 },
    description: data.description || '',
    remarks: data.remarks || '',
    images,
    videos,
    evidenceCount: images.length + videos.length,
    status: 'pending',
    workflowStage: 'Pending Sahayak Verification',
    severity: getSeverityLevel(analysis),
    confidenceScore: analysis.confidenceScore,
    geoVerified: analysis.geoVerified,
    rainfallMatched: analysis.rainfallMatched,
    duplicateRisk: analysis.duplicateRisk,
    aiRemarks: analysis.aiRemarks,
    weatherEvent: analysis.rainfallMatched ? 'Weather Anomaly Detected' : 'No Weather Anomaly',
    weatherLinkage: null,
    assignedOfficer: '',
    reviewRemarks: [],
    reviewTimestamp: null,
    grievanceLinkage: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const saved = await storage.addItem(SURVEYS_FILE, survey);
  if (!saved || !saved.id) return survey;

  let finalSurvey = saved;

  try {
    const weatherLinkage = await resolveWeatherLinkage(farmerDetails);
    if (weatherLinkage) {
      const updated = await storage.updateItem(SURVEYS_FILE, saved.id, {
        weatherLinkage,
        updatedAt: new Date().toISOString(),
      });
      if (updated) finalSurvey = updated;
    }
  } catch {
    // Weather linkage is non-critical; return survey as-is
  }

  try {
    const grievances = await getGrievanceLinkage(finalSurvey.reportId || finalSurvey.id);
    await reportService.createReport(finalSurvey, grievances);
  } catch {
    // Report persistence is non-critical
  }

  return finalSurvey;
}

async function resolveWeatherLinkage(farmerDetails) {
  try {
    const weatherData = await storage.readCollection('weather.json');
    const villageWeather = weatherData
      .filter(w => w.village.toLowerCase() === (farmerDetails.village || '').toLowerCase())
      .sort((a, b) => new Date(b.date) - new Date(a.date));
    if (villageWeather.length > 0) {
      return villageWeather.slice(0, 3);
    }
    return null;
  } catch {
    return null;
  }
}

async function getAllSurveys(filters = {}) {
  let surveys = await storage.readCollection(SURVEYS_FILE);
  surveys.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  if (filters.status) {
    surveys = surveys.filter(s => s.status === filters.status);
  }
  if (filters.workflowStage) {
    surveys = surveys.filter(s => s.workflowStage === filters.workflowStage);
  }
  if (filters.farmerId) {
    surveys = surveys.filter(s => s.farmerId === filters.farmerId);
  }
  if (filters.village) {
    surveys = surveys.filter(s => s.village === filters.village);
  }
  return surveys;
}

async function getSurveyById(id) {
  return storage.findById(SURVEYS_FILE, id);
}

async function getSahayakQueue() {
  let surveys = await storage.readCollection(SURVEYS_FILE);
  return surveys
    .filter(s => s.workflowStage === 'Pending Sahayak Verification' || s.workflowStage === 'Re-Survey Requested')
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

async function getDashboardSummary() {
  const surveys = await storage.readCollection(SURVEYS_FILE);
  const total = surveys.length;
  const pendingVerification = surveys.filter(s => s.workflowStage === 'Pending Sahayak Verification').length;
  const surveySubmitted = surveys.filter(s => s.workflowStage === 'Survey Submitted').length;
  const geoComplete = surveys.filter(s => s.workflowStage === 'Geo Verification Complete').length;
  const escalated = surveys.filter(s => s.workflowStage === 'Escalated to Circle Officer').length;
  const resurvey = surveys.filter(s => s.workflowStage === 'Re-Survey Requested').length;
  const completed = surveys.filter(s => s.workflowStage === 'Verification Completed').length;

  const severityBreakdown = {};
  for (const s of surveys) {
    const sev = s.severity || 'Unknown';
    severityBreakdown[sev] = (severityBreakdown[sev] || 0) + 1;
  }

  return {
    total,
    pendingVerification,
    surveySubmitted,
    geoComplete,
    escalated,
    resurvey,
    completed,
    severityBreakdown,
  };
}

async function performSahayakAction(id, action, payload = {}) {
  const survey = await getSurveyById(id);
  if (!survey) {
    const err = new Error('Survey not found');
    err.statusCode = 404;
    throw err;
  }

  const validActions = ['verify', 'add_remarks', 'request_resurvey', 'escalate', 'approve'];
  if (!validActions.includes(action)) {
    const err = new Error(`Invalid action. Must be one of: ${validActions.join(', ')}`);
    err.statusCode = 400;
    throw err;
  }

  const updates = { updatedAt: new Date().toISOString() };

  const newRemark = {
    action,
    stage: survey.workflowStage,
    remark: payload.remark || '',
    officerName: payload.officerName || 'Sahayak Officer',
    timestamp: new Date().toISOString(),
  };
  const existingRemarks = survey.reviewRemarks || [];
  updates.reviewRemarks = [...existingRemarks, newRemark];
  updates.reviewTimestamp = new Date().toISOString();

  switch (action) {
    case 'verify':
      updates.status = 'verified';
      updates.workflowStage = 'Geo Verification Complete';
      if (payload.assignedOfficer) updates.assignedOfficer = payload.assignedOfficer;
      break;
    case 'add_remarks':
      break;
    case 'request_resurvey':
      updates.status = 'resurvey_requested';
      updates.workflowStage = 'Re-Survey Requested';
      break;
    case 'escalate':
      updates.status = 'escalated';
      updates.workflowStage = 'Escalated to Circle Officer';
      if (payload.assignedOfficer) updates.assignedOfficer = payload.assignedOfficer;
      break;
    case 'approve':
      updates.status = 'approved';
      updates.workflowStage = 'Verification Completed';
      break;
  }

  const updated = await storage.updateItem(SURVEYS_FILE, id, updates);

  try {
    if (updated) {
      await reportService.syncReportFromSurvey(updated);
    }
  } catch {
    // Report sync is non-critical
  }

  return updated;
}

async function getGrievanceLinkage(surveyId) {
  const survey = await getSurveyById(surveyId);
  if (!survey) return null;
  const claims = await storage.query('claims.json', c => c.farmerId === survey.farmerId);
  return claims.length > 0 ? claims : [];
}

module.exports = {
  submitSurvey,
  getAllSurveys,
  getSurveyById,
  getSahayakQueue,
  getDashboardSummary,
  performSahayakAction,
  getGrievanceLinkage,
  SURVEY_WORKFLOW_STAGES,
};
