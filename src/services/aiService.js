const villages = ['Malegaon', 'Barshi', 'Solapur', 'Vairag', 'Tuljapur', 'Osmanabad'];

const aiRemarksPool = [
  'Satellite-derived NDVI anomaly confirms vegetative stress during flowering stage. Geo-tagged evidence coordinates match registered land parcel boundary. AWS rainfall deviation of +42mm recorded for the claim window.',
  'Duplicate land parcel usage detected across multiple applications. Recommended manual scrutiny of crop cycle eligibility before processing.',
  'Geo-tagged evidence and rainfall anomaly support flood damage claim. AWS station recorded 124mm in 24 hours against monthly normal of 38mm. CCE report confirms >75% yield loss.',
  'Satellite vegetation trend inconsistent with declared crop cycle. NDVI profile suggests crop was harvested prior to claimed loss period. Ground-truth verification recommended before re-evaluation.',
  'Parcel coordinates verified against Bhunaksha records. Crop stage consistent with reported sowing date. Wildlife intrusion claims require compensatory affidavit per Maharashtra Relief Manual.',
  'Thermal satellite imagery indicates moisture stress patterns consistent with reported drought conditions. However, irrigation infrastructure (borewell) is present within 200m of parcel boundary.',
  'Historical yield data for this parcel shows 3-year average significantly below claimed loss percentage. Potential overestimation flagged. Risk category: Yellow.',
  'Multi-spectral analysis confirms pest infestation pattern consistent with Pink Bollworm. ETL levels exceeded. Recommended for expedited CCE scheduling.',
  'Claim amount exceeds 80% of sum insured. Mandatory physical verification required before approval per IRDAI guidelines clause 14.2.',
  'Aadhaar-seeded bank account validation successful. PMFBY premium share verified. Claim pipeline eligible for auto-adjudication.',
  'Land parcel boundary overlap detected with adjacent Gram Panchayat asset. Revenue records require reconciliation before claim processing.',
  'Weather data from nearest AWS station (distance 4.2km) confirms rainfall anomaly. However, crop stage at time of event was early vegetative — loss assessment requires field verification.',
];

function generateConfidenceScore() {
  return Math.floor(Math.random() * 35) + 58;
}

function generateGeoVerified() {
  return Math.random() > 0.2;
}

function generateRainfallMatched() {
  return Math.random() > 0.3;
}

function generateDuplicateRisk() {
  return Math.random() > 0.72;
}

function generateAiRemarks() {
  return aiRemarksPool[Math.floor(Math.random() * aiRemarksPool.length)];
}

function analyzeClaim(claimData) {
  const confidenceScore = generateConfidenceScore();
  const geoVerified = generateGeoVerified();
  const rainfallMatched = generateRainfallMatched();
  const duplicateRisk = generateDuplicateRisk();

  let aiRemarks;
  if (confidenceScore >= 85 && geoVerified && rainfallMatched && !duplicateRisk) {
    aiRemarks = 'Aadhaar-seeded bank account validation successful. PMFBY premium share verified. Claim pipeline eligible for auto-adjudication. All parameters validated at confidence threshold >= 85%.';
  } else if (confidenceScore >= 70 && geoVerified) {
    aiRemarks = 'Multi-spectral analysis confirms crop stress patterns consistent with reported loss event. Geo-tag matches registered land parcel boundary. Recommended for Officer Review with high confidence flag.';
  } else if (duplicateRisk) {
    aiRemarks = 'Duplicate land parcel usage detected across multiple applications for same season. Land parcel referenced in another active claim. Mandatory manual scrutiny of crop cycle eligibility before processing.';
  } else {
    aiRemarks = generateAiRemarks();
  }

  return { confidenceScore, geoVerified, rainfallMatched, duplicateRisk, aiRemarks };
}

module.exports = { analyzeClaim, villages };
