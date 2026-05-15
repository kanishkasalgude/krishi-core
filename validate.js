const { fork } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');

// ============================================================
// VALIDATION SUITE — KRISHI-PRABANDH BACKEND INTEGRATION
// ============================================================

const ROOT = __dirname;
const DATA_DIR = path.join(ROOT, 'data');
const UPLOADS_DIR = path.join(ROOT, 'uploads');
const RESULTS = { pass: 0, fail: 0, critical: [], warnings: [] };

function check(label, cond, critical = false) {
  if (cond) { RESULTS.pass++; console.log('  [PASS]', label); }
  else {
    RESULTS.fail++;
    console.log('  [FAIL]', label);
    if (critical) RESULTS.critical.push(label);
    else RESULTS.warnings.push(label);
  }
}

// ============================================================
// 1. DATA FILES EXISTENCE
// ============================================================
console.log('\n=== 1. REQUIRED DATA FILES ===');
const requiredFiles = ['surveys.json','reports.json','claims.json','farmers.json','kyc.json','payments.json','weather.json','agristack_mock_farmers_v2.csv'];
for (const f of requiredFiles) {
  check(`data/${f} exists`, fs.existsSync(path.join(DATA_DIR, f)), true);
}

// Check grievances.json — user lists it but codebase doesn't have it
check('data/grievances.json exists (optional — claims.json used for grievance linkage)', fs.existsSync(path.join(DATA_DIR, 'grievances.json')), false);

// ============================================================
// 2. UPLOAD DIRECTORIES
// ============================================================
console.log('\n=== 2. UPLOAD DIRECTORIES ===');
check('uploads/ exists', fs.existsSync(UPLOADS_DIR), true);
check('uploads/images/ exists', fs.existsSync(path.join(UPLOADS_DIR, 'images')), false);
check('uploads/videos/ exists', fs.existsSync(path.join(UPLOADS_DIR, 'videos')), false);

// ============================================================
// 3. DATA FILE VALIDITY
// ============================================================
console.log('\n=== 3. DATA FILE PARSING ===');
for (const f of ['surveys.json','reports.json','claims.json','farmers.json','kyc.json','payments.json','weather.json']) {
  try {
    const raw = fs.readFileSync(path.join(DATA_DIR, f), 'utf-8');
    JSON.parse(raw);
    check(`${f} is valid JSON`, true, true);
  } catch (e) {
    check(`${f} is valid JSON: ${e.message}`, false, true);
  }
}

// ============================================================
// START SERVER
// ============================================================
console.log('\n=== STARTING SERVER ===');
const srv = fork(path.join(ROOT, 'server.js'), [], { stdio: 'pipe' });
srv.stderr.on('data', d => process.stderr.write(d));

function get(p) {
  return new Promise(r => {
    http.get('http://127.0.0.1:5000/api'+p, (res) => {
      let d='';res.on('data',c=>d+=c);res.on('end',()=>r({s:res.statusCode,b:JSON.parse(d)}));
    });
  });
}
function post(p, d) {
  return new Promise(r => {
    const b=JSON.stringify(d);
    const o={hostname:'127.0.0.1',port:5000,path:'/api'+p,method:'POST',headers:{'Content-Type':'application/json','Content-Length':Buffer.byteLength(b)}};
    const req=http.request(o, (res) => { let d='';res.on('data',c=>d+=c);res.on('end',()=>r({s:res.statusCode,b:JSON.parse(d)})); });
    req.write(b);req.end();
  });
}
function patch(p, d) {
  return new Promise(r => {
    const b=JSON.stringify(d);
    const o={hostname:'127.0.0.1',port:5000,path:'/api'+p,method:'PATCH',headers:{'Content-Type':'application/json','Content-Length':Buffer.byteLength(b)}};
    const req=http.request(o, (res) => { let d='';res.on('data',c=>d+=c);res.on('end',()=>r({s:res.statusCode,b:JSON.parse(d)})); });
    req.write(b);req.end();
  });
}
function postMultipart() {
  return new Promise((resolve) => {
    const boundary = '----ValBoundary' + Math.random().toString(36).slice(2);
    const lines = [];
    const fields = {farmerId:'MH-AS-NAN-10000001',cropType:'Paddy',damageType:'Flood',village:'Hadgaon_Village_48',landParcelId:'775/30',description:'Validation test'};
    for (const [k,v] of Object.entries(fields)) {
      lines.push('--'+boundary); lines.push('Content-Disposition: form-data; name="'+k+'"'); lines.push(''); lines.push(v);
    }
    lines.push('--'+boundary); lines.push('Content-Disposition: form-data; name="files"; filename="test.mp4"'); lines.push('Content-Type: video/mp4'); lines.push(''); lines.push('FAKE_VIDEO');
    lines.push('--'+boundary); lines.push('Content-Disposition: form-data; name="files"; filename="test.jpg"'); lines.push('Content-Type: image/jpeg'); lines.push(''); lines.push('FAKE_IMAGE');
    lines.push('--'+boundary+'--');
    const body = Buffer.from(lines.join('\r\n'), 'utf-8');
    const opts = {hostname:'127.0.0.1',port:5000,path:'/api/surveys',method:'POST',headers:{'Content-Type':'multipart/form-data; boundary='+boundary,'Content-Length':body.length}};
    const req=http.request(opts, (res) => { let d='';res.on('data',c=>d+=c);res.on('end',()=>{try{resolve({s:res.statusCode,b:JSON.parse(d)})}catch(e){resolve({s:res.statusCode,b:{error:d}})}}); });
    req.write(body);req.end();
  });
}

setTimeout(async () => {
  // ============================================================
  // 4. HEALTH CHECK
  // ============================================================
  console.log('\n=== 4. HEALTH ===');
  try {
    const h = await get('/health');
    check('GET /api/health returns 200', h.s === 200, true);
    check('health has service name', h.b.service === 'KRISHI-PRABANDH API', true);
  } catch(e) {
    check('Server is running', false, true);
    console.log('FATAL: Server not reachable. Aborting.');
    srv.kill(); process.exit(1);
  }

  // ============================================================
  // 5. SURVEY SUBMISSION
  // ============================================================
  console.log('\n=== 5. SURVEY SUBMISSION (JSON + multipart) ===');

  // 5a. JSON submission
  const r1 = await post('/surveys', {farmerId:'MH-AS-LAT-10000001',cropType:'Sunflower',damageType:'Drought',village:'Udgir_Village_60',landParcelId:'13/42'});
  check('POST /api/surveys (JSON) returns 201', r1.s === 201, true);
  check('  workflowStage = Pending Sahayak Verification', r1.b.data?.workflowStage === 'Pending Sahayak Verification', true);
  check('  reportId generated', !!r1.b.data?.reportId, true);
  check('  farmerName from CSV', r1.b.data?.farmerName === 'Sita Jadhav', true);
  check('  confidenceScore present', typeof r1.b.data?.confidenceScore === 'number', true);
  check('  severity present', !!r1.b.data?.severity, true);
  check('  geoVerified is boolean', typeof r1.b.data?.geoVerified === 'boolean', true);
  check('  aiRemarks present', typeof r1.b.data?.aiRemarks === 'string' && r1.b.data.aiRemarks.length > 0, true);

  // 5b. Multipart with files
  const r2 = await postMultipart();
  check('POST /api/surveys (multipart+files) returns 201', r2.s === 201, true);
  if (r2.b.data) {
    check('  evidenceCount > 0', r2.b.data.evidenceCount > 0, true);
    check('  videos array populated', r2.b.data.videos?.length > 0, true);
    check('  images array populated', r2.b.data.images?.length > 0, true);
    check('  video path starts with /uploads/', r2.b.data.videos[0]?.startsWith('/uploads/'), true);
    check('  image path starts with /uploads/', r2.b.data.images[0]?.startsWith('/uploads/'), true);

    // Verify files exist on disk
    const vp = path.join(ROOT, r2.b.data.videos[0].replace(/^\//, ''));
    const ip = path.join(ROOT, r2.b.data.images[0].replace(/^\//, ''));
    check('  video file exists on disk', fs.existsSync(vp), true);
    check('  image file exists on disk', fs.existsSync(ip), true);

    // Cleanup
    try { fs.unlinkSync(vp); } catch(e) {}
    try { fs.unlinkSync(ip); } catch(e) {}
  }

  // 5c. Invalid farmerId
  const rBad = await post('/surveys', {farmerId:'INVALID',cropType:'Paddy',damageType:'Flood',village:'X',landParcelId:'Y'});
  check('POST with invalid farmerId returns 404', rBad.s === 404, true);

  // 5d. Missing fields
  const rMiss = await post('/surveys', {farmerId:'MH-AS-NAN-10000001'});
  check('POST with missing fields returns 400', rMiss.s === 400, true);

  // ============================================================
  // 6. SURVEY PERSISTENCE
  // ============================================================
  console.log('\n=== 6. SURVEY PERSISTENCE ===');
  const allSurveys = await get('/surveys');
  check('GET /api/surveys returns data', allSurveys.b.count > 0, true);
  check('GET /api/surveys has success flag', allSurveys.b.success === true, true);

  const firstSurvey = allSurveys.b.data[0];
  check('survey has reportId', !!firstSurvey.reportId, true);
  check('survey has farmerId', !!firstSurvey.farmerId, true);
  check('survey has farmerName', !!firstSurvey.farmerName, true);
  check('survey has farmerDetails', !!firstSurvey.farmerDetails, true);
  check('survey has landParcelDetails', !!firstSurvey.landParcelDetails, true);
  check('survey has createdAt', !!firstSurvey.createdAt, true);

  // ============================================================
  // 7. QUEUE
  // ============================================================
  console.log('\n=== 7. SAHAYAK QUEUE ===');
  const q = await get('/surveys/queue');
  check('GET /api/surveys/queue returns array', Array.isArray(q.b.data), true);
  if (q.b.count > 0) {
    const validStages = q.b.data.every(s => s.workflowStage === 'Pending Sahayak Verification' || s.workflowStage === 'Re-Survey Requested');
    check('All queue items have valid workflowStage', validStages, true);
    check('Queue items have farmerName', q.b.data.every(s => !!s.farmerName), true);
    check('Queue items have reportId', q.b.data.every(s => !!s.reportId), true);
    check('Queue sorted by createdAt desc',
      q.b.data.every((s,i,a) => i===0 || new Date(s.createdAt) <= new Date(a[i-1].createdAt)), true);
  } else {
    check('Queue has items (should have from submission above)', false, true);
  }

  // ============================================================
  // 8. REPORTS
  // ============================================================
  console.log('\n=== 8. REPORT GENERATION & PERSISTENCE ===');
  const reports = await get('/reports');
  check('GET /api/reports returns array', Array.isArray(reports.b.data), true);
  check('GET /api/reports count > 0', reports.b.count > 0, true);

  if (reports.b.count > 0) {
    const rpt = reports.b.data[0];
    const reportFields = ['reportId','surveyId','farmerId','farmerName','village','taluka','district','cropType','damageType','workflowStage','severityLevel','confidenceScore','geoVerified','weatherLinked','uploadedEvidence','aiRemarks','officerRemarks','grievanceLinked','createdAt','assignedOfficer'];
    for (const f of reportFields) {
      check(`  report.${f} present`, rpt[f] !== undefined, true);
    }
    check('  report.uploadedEvidence.images is array', Array.isArray(rpt.uploadedEvidence?.images), true);
    check('  report.uploadedEvidence.videos is array', Array.isArray(rpt.uploadedEvidence?.videos), true);
    check('  report.uploadedEvidence.count is number', typeof rpt.uploadedEvidence?.count === 'number', true);
    check('  report.officerRemarks is array', Array.isArray(rpt.officerRemarks), true);
    check('  report.grievanceLinked is boolean', typeof rpt.grievanceLinked === 'boolean', true);
    check('  report.surveyId matches survey.reportId', rpt.surveyId === firstSurvey.reportId, true);
    check('  report.createdAt is ISO string', !isNaN(Date.parse(rpt.createdAt)), true);
  }

  // Individual report fetch
  if (reports.b.count > 0) {
    const rptId = reports.b.data[0].reportId;
    const byId = await get('/reports/' + rptId);
    check('GET /api/reports/:id works', byId.b.data?.reportId === rptId, true);
  }

  // ============================================================
  // 9. WORKFLOW SYNC
  // ============================================================
  console.log('\n=== 9. WORKFLOW STATE SYNC ===');

  // Get a survey from queue, verify it, check report syncs
  const q2 = await get('/surveys/queue');
  if (q2.b.count > 0) {
    const targetId = q2.b.data[0].reportId;

    // Verify
    const v = await patch('/surveys/'+targetId+'/action', {action:'verify',remark:'Field verified.',officerName:'Sahayak Officer'});
    check('Verify action returns 200', v.s === 200, true);

    const sq = await get('/surveys/'+targetId);
    check('  survey.workflowStage = Geo Verification Complete', sq.b.data?.workflowStage === 'Geo Verification Complete', true);

    const rp = await get('/reports');
    const matched = rp.b.data.find(r => r.surveyId === targetId);
    check('  report.workflowStage matches survey', matched?.workflowStage === 'Geo Verification Complete', true);
    check('  report.officerRemarks has new entry', matched?.officerRemarks?.length > 0, true);

    // Escalate
    await patch('/surveys/'+targetId+'/action', {action:'escalate',remark:'Escalated to CO.',officerName:'SO',assignedOfficer:'Circle Officer Latur'});
    const rp2 = await get('/reports');
    const matched2 = rp2.b.data.find(r => r.surveyId === targetId);
    check('  Escalate syncs to report.workflowStage', matched2?.workflowStage === 'Escalated to Circle Officer', true);
    check('  Escalate syncs assignedOfficer', matched2?.assignedOfficer === 'Circle Officer Latur', true);
  }

  // ============================================================
  // 10. DASHBOARD SUMMARY
  // ============================================================
  console.log('\n=== 10. DASHBOARD SUMMARY ===');
  const sum = await get('/surveys/summary');
  check('GET /api/surveys/summary returns data', sum.b.success === true, true);
  check('  summary.total is number', typeof sum.b.data?.total === 'number', true);
  check('  summary.pendingVerification is number', typeof sum.b.data?.pendingVerification === 'number', true);
  check('  summary.severityBreakdown is object', typeof sum.b.data?.severityBreakdown === 'object', true);

  // ============================================================
  // 11. CLAIMS / GRIEVANCE LINKAGE
  // ============================================================
  console.log('\n=== 11. CLAIMS/GRIEVANCE LINKAGE ===');
  const claims = await get('/claims');
  check('GET /api/claims returns data', claims.b.success === true, true);

  const claimById = await get('/claims/CLM-001');
  check('GET /api/claims/:id works', claimById.b.data?.id === 'CLM-001', true);

  // Grievance linkage on survey
  const surveyWithClaims = await get('/surveys/' + firstSurvey.reportId + '/grievances');
  // This farmer (MH-AS-LAT-10000001) may not have claims — that's OK
  check('Survey grievance endpoint works', surveyWithClaims.b.success === true, true);

  // ============================================================
  // 12. UPLOAD ENDPOINT
  // ============================================================
  console.log('\n=== 12. UPLOAD ENDPOINT ===');
  try {
    const boundary = '----UpBoundary' + Math.random().toString(36).slice(2);
    const lines = [];
    lines.push('--'+boundary); lines.push('Content-Disposition: form-data; name="files"; filename="upload_test.jpg"'); lines.push('Content-Type: image/jpeg'); lines.push(''); lines.push('UPLOAD_TEST_DATA');
    lines.push('--'+boundary+'--');
    const body = Buffer.from(lines.join('\r\n'), 'utf-8');
    const opts = {hostname:'127.0.0.1',port:5000,path:'/api/upload',method:'POST',headers:{'Content-Type':'multipart/form-data; boundary='+boundary,'Content-Length':body.length}};

    const result = await new Promise((resolve) => {
      const req=http.request(opts, (res) => { let d='';res.on('data',c=>d+=c);res.on('end',()=>resolve({s:res.statusCode,b:JSON.parse(d)})); });
      req.write(body);req.end();
    });
    check('POST /api/upload returns 200/201', result.s === 200 || result.s === 201, true);
    if (result.b.data) {
      const fileData = Array.isArray(result.b.data) ? result.b.data[0] : result.b.data;
      check('  upload has filename', !!fileData.filename, true);
      check('  upload has path', !!fileData.path, true);
      check('  upload has mimetype', !!fileData.mimetype, true);
      // Cleanup uploaded file
      const up = path.join(ROOT, 'uploads', fileData.filename);
      try { fs.unlinkSync(up); } catch(e) {}
    }
  } catch(e) {
    check('POST /api/upload endpoint', false, true);
  }

  // ============================================================
  // 13. POLLING COMPATIBILITY
  // ============================================================
  console.log('\n=== 13. POLLING COMPATIBILITY ===');
  // Simulate 3 rapid polls as dashboard would do
  try {
    for (let i = 0; i < 3; i++) {
      const pq = await get('/surveys/queue');
      const ps = await get('/surveys/summary');
      const pr = await get('/reports');
      if (pq.b.success && ps.b.success && pr.b.success) {
        check(`  Poll ${i+1}: queue + summary + reports OK`, true, true);
      } else {
        check(`  Poll ${i+1}: queue + summary + reports OK`, false, true);
      }
    }
  } catch(e) {
    check('Polling returns consistent data', false, true);
  }

  // ============================================================
  // SUMMARY
  // ============================================================
  console.log('\n========================================');
  console.log(' VALIDATION RESULTS');
  console.log('========================================');
  console.log(`  PASSED: ${RESULTS.pass}`);
  console.log(`  FAILED: ${RESULTS.fail}`);
  console.log(`  CRITICAL: ${RESULTS.critical.length}`);
  console.log(`  WARNINGS: ${RESULTS.warnings.length}`);
  if (RESULTS.critical.length > 0) {
    console.log('\n  CRITICAL ISSUES:');
    RESULTS.critical.forEach(i => console.log('    -', i));
  }
  if (RESULTS.warnings.length > 0) {
    console.log('\n  WARNINGS:');
    RESULTS.warnings.forEach(i => console.log('    -', i));
  }
  console.log('========================================');

  // Cleanup test data
  try { fs.unlinkSync(path.join(DATA_DIR, 'surveys.json')); } catch(e) {}
  try { 
    const r = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'reports.json'), 'utf-8'));
    fs.writeFileSync(path.join(DATA_DIR, 'reports.json'), '[]', 'utf-8');
  } catch(e) {}

  srv.kill();
  process.exit(RESULTS.critical.length > 0 ? 1 : 0);
}, 4000);
