const surveyService = require('../services/surveyService');

async function submitSurvey(req, res, next) {
  try {
    const files = req.files || [];
    const survey = await surveyService.submitSurvey(req.body, files);
    res.status(201).json({ success: true, surveyId: survey.id, status: 'PROCESSING' });
  } catch (err) {
    if (err.statusCode) {
      return res.status(err.statusCode).json({ success: false, error: err.message });
    }
    next(err);
  }
}

async function getAllSurveys(req, res, next) {
  try {
    const { status, workflowStage, farmerId, village } = req.query;
    const surveys = await surveyService.getAllSurveys({ status, workflowStage, farmerId, village });
    res.json({ success: true, count: surveys.length, data: surveys });
  } catch (err) {
    next(err);
  }
}

async function getSurveyById(req, res, next) {
  try {
    const survey = await surveyService.getSurveyById(req.params.id);
    if (!survey) {
      return res.status(404).json({ success: false, error: 'Survey not found' });
    }
    res.json({ success: true, data: survey });
  } catch (err) {
    next(err);
  }
}

async function getSahayakQueue(req, res, next) {
  try {
    const queue = await surveyService.getSahayakQueue();
    res.json({ success: true, count: queue.length, data: queue });
  } catch (err) {
    next(err);
  }
}

async function getDashboardSummary(req, res, next) {
  try {
    const summary = await surveyService.getDashboardSummary();
    res.json({ success: true, data: summary });
  } catch (err) {
    next(err);
  }
}

async function performAction(req, res, next) {
  try {
    const { id } = req.params;
    const { action, remark, officerName, assignedOfficer } = req.body;

    if (!action) {
      return res.status(400).json({ success: false, error: 'Action is required' });
    }

    const updated = await surveyService.performSahayakAction(id, action, { remark, officerName, assignedOfficer });
    if (!updated) {
      return res.status(404).json({ success: false, error: 'Survey not found' });
    }
    res.json({ success: true, data: updated });
  } catch (err) {
    if (err.statusCode) {
      return res.status(err.statusCode).json({ success: false, error: err.message });
    }
    next(err);
  }
}

async function getGrievanceLinkage(req, res, next) {
  try {
    const linked = await surveyService.getGrievanceLinkage(req.params.id);
    if (linked === null) {
      return res.status(404).json({ success: false, error: 'Survey not found' });
    }
    res.json({ success: true, count: linked.length, data: linked });
  } catch (err) {
    next(err);
  }
}

async function generateReport(req, res, next) {
  try {
    const survey = await surveyService.getSurveyById(req.params.id);
    if (!survey) {
      return res.status(404).json({ success: false, error: 'Survey not found' });
    }
    const grievances = await surveyService.getGrievanceLinkage(req.params.id);
    const report = {
      reportId: survey.reportId,
      generatedAt: new Date().toISOString(),
      survey,
      grievanceLinkage: grievances,
      officerRemarksHistory: survey.reviewRemarks,
    };
    res.json({ success: true, data: report });
  } catch (err) {
    next(err);
  }
}

async function getLatestSurveys(req, res, next) {
  try {
    const surveys = await surveyService.getAllSurveys({});
    const latest = surveys.slice(0, 20).map(s => ({
      id: s.id,
      farmerId: s.farmerId,
      status: s.status,
      workflowStage: s.workflowStage,
      uploadStatus: s.uploadStatus,
      officerStatus: s.officerStatus,
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
      assignedOfficer: s.assignedOfficer
    }));
    res.json({ success: true, count: latest.length, data: latest });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  submitSurvey,
  getAllSurveys,
  getSurveyById,
  getSahayakQueue,
  getDashboardSummary,
  performAction,
  getGrievanceLinkage,
  generateReport,
  getLatestSurveys,
};
