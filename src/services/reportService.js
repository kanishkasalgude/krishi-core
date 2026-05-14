const { v4: uuidv4 } = require('uuid');
const storage = require('../utils/storage');

const REPORTS_FILE = 'reports.json';

function makeReportId() {
  const short = uuidv4().replace(/-/g, '').slice(0, 8).toUpperCase();
  return `RPT-${short}`;
}

async function createReport(survey, grievances = null) {
  const reportId = makeReportId();
  const weatherLinked = !!(survey.weatherLinkage) || survey.rainfallMatched === true;

  const report = {
    id: reportId,
    reportId,
    surveyId: survey.reportId || survey.id,
    farmerId: survey.farmerId,
    farmerName: survey.farmerName,
    village: survey.village,
    taluka: survey.taluka || '',
    district: survey.district || '',
    cropType: survey.cropType,
    damageType: survey.damageType,
    workflowStage: survey.workflowStage,
    severityLevel: survey.severity,
    confidenceScore: survey.confidenceScore || 0,
    geoVerified: survey.geoVerified || false,
    weatherLinked,
    uploadedEvidence: {
      images: survey.images || [],
      videos: survey.videos || [],
      count: survey.evidenceCount || 0,
    },
    aiRemarks: survey.aiRemarks || '',
    officerRemarks: survey.reviewRemarks || [],
    grievanceLinked: !!(grievances && grievances.length > 0),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    assignedOfficer: survey.assignedOfficer || '',
  };

  await storage.addItem(REPORTS_FILE, report);
  return report;
}

async function syncReportFromSurvey(survey) {
  const reports = await storage.readCollection(REPORTS_FILE);
  const existing = reports.find(r => r.surveyId === survey.reportId || r.surveyId === survey.id);
  if (!existing) {
    const grievances = await storage.query('claims.json', c => c.farmerId === survey.farmerId);
    return createReport(survey, grievances);
  }

  const weatherLinked = !!(survey.weatherLinkage) || survey.rainfallMatched === true;

  return storage.updateItem(REPORTS_FILE, existing.id, {
    workflowStage: survey.workflowStage,
    severityLevel: survey.severity,
    confidenceScore: survey.confidenceScore || existing.confidenceScore,
    geoVerified: survey.geoVerified !== undefined ? survey.geoVerified : existing.geoVerified,
    weatherLinked,
    uploadedEvidence: {
      images: survey.images || existing.uploadedEvidence?.images || [],
      videos: survey.videos || existing.uploadedEvidence?.videos || [],
      count: survey.evidenceCount || existing.uploadedEvidence?.count || 0,
    },
    aiRemarks: survey.aiRemarks || existing.aiRemarks,
    officerRemarks: survey.reviewRemarks || existing.officerRemarks || [],
    assignedOfficer: survey.assignedOfficer || existing.assignedOfficer || '',
    updatedAt: new Date().toISOString(),
  });
}

async function getAllReports(filters = {}) {
  let reports = await storage.readCollection(REPORTS_FILE);
  reports.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  if (filters.farmerId) {
    reports = reports.filter(r => r.farmerId === filters.farmerId);
  }
  if (filters.workflowStage) {
    reports = reports.filter(r => r.workflowStage === filters.workflowStage);
  }
  if (filters.village) {
    reports = reports.filter(r => r.village === filters.village);
  }
  return reports;
}

async function getReportById(id) {
  return storage.findById(REPORTS_FILE, id);
}

async function getReportBySurveyId(surveyId) {
  const reports = await storage.readCollection(REPORTS_FILE);
  return reports.find(r => r.surveyId === surveyId) || null;
}

module.exports = {
  createReport,
  syncReportFromSurvey,
  getAllReports,
  getReportById,
  getReportBySurveyId,
};
