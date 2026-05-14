const villages = ['Barwani', 'Kasrawad', 'Segaon', 'Jhirniya', 'Punasa', 'Bhikangaon'];

const aiRemarksPool = [
  'High confidence. Geo-tag matches village boundary. Rainfall anomaly detected on claimed date.',
  'Medium confidence. Geo verified but rainfall pattern mismatched. Similar claim from same village flagged.',
  'Very high confidence. All parameters validated. Eligible for expedited payout.',
  'Low confidence. Geo coordinates outside claimed village boundary. Rainfall data shows adequate irrigation period.',
  'Moderate confidence. Geo and rainfall OK. Unusual claim type - manual review recommended.',
  'High confidence. Satellite imagery confirms crop damage patterns. Recommended for approval.',
  'Low confidence. Duplicate coordinates detected from recent claim. Flagged for manual review.',
  'Medium confidence. Rainfall data supports claim but geo boundary overlap detected.',
  'High confidence. Historical yield data shows significant deviation. Auto-approve recommended.',
  'Low confidence. Insufficient evidence in uploaded media. Request field visit.',
];

function generateConfidenceScore() {
  return Math.floor(Math.random() * 40) + 55;
}

function generateGeoVerified() {
  return Math.random() > 0.25;
}

function generateRainfallMatched() {
  return Math.random() > 0.35;
}

function generateDuplicateRisk() {
  return Math.random() > 0.7;
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
    aiRemarks = 'Very high confidence. All parameters validated. Eligible for expedited payout.';
  } else if (confidenceScore >= 70 && geoVerified) {
    aiRemarks = 'High confidence. Geo-tag matches village boundary. Rainfall anomaly detected on claimed date.';
  } else if (duplicateRisk) {
    aiRemarks = 'Low confidence. Duplicate coordinates detected from recent claim. Flagged for manual review.';
  } else {
    aiRemarks = generateAiRemarks();
  }

  return { confidenceScore, geoVerified, rainfallMatched, duplicateRisk, aiRemarks };
}

module.exports = { analyzeClaim, villages };
