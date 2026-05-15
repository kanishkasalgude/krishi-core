const reportService = require('../services/reportService');

async function getAllReports(req, res, next) {
  try {
    const { farmerId, workflowStage, village } = req.query;
    const reports = await reportService.getAllReports({ farmerId, workflowStage, village });
    res.json({ success: true, count: reports.length, data: reports });
  } catch (err) {
    next(err);
  }
}

async function getReportById(req, res, next) {
  try {
    const report = await reportService.getReportById(req.params.id);
    if (!report) {
      return res.status(404).json({ success: false, error: 'Report not found' });
    }
    res.json({ success: true, data: report });
  } catch (err) {
    next(err);
  }
}

module.exports = { getAllReports, getReportById };
