const fs = require('fs');
const path = require('path');

const CSV_PATH = path.join(__dirname, '..', '..', 'data', 'agristack_mock_farmers_v2.csv');

let registry = null;
let registryByMobile = null;

function parseCSV() {
  const raw = fs.readFileSync(CSV_PATH, 'utf-8').trim();
  const lines = raw.split('\n');
  const headers = lines[0].split(',').map(h => h.trim());
  const farmers = [];
  for (let i = 1; i < lines.length; i++) {
    const vals = lines[i].split(',').map(v => v.trim());
    const entry = {};
    headers.forEach((h, idx) => { entry[h] = vals[idx] || ''; });
    farmers.push(entry);
  }
  return farmers;
}

function getRegistry() {
  if (!registry) {
    registry = parseCSV();
  }
  return registry;
}

function findFarmerById(farmerId) {
  const farmers = getRegistry();
  return farmers.find(f => f.farmer_id === farmerId) || null;
}

function findFarmerByMobile(mobile) {
  const farmers = getRegistry();
  return farmers.find(f => f.mobile === mobile) || null;
}

function getAllFarmers() {
  return getRegistry();
}

function getVillages() {
  const farmers = getRegistry();
  return [...new Set(farmers.map(f => f.village).filter(Boolean))].sort();
}

function getTalukas() {
  const farmers = getRegistry();
  return [...new Set(farmers.map(f => f.taluka).filter(Boolean))].sort();
}

function getDistricts() {
  const farmers = getRegistry();
  return [...new Set(farmers.map(f => f.district).filter(Boolean))].sort();
}

function getFarmerDetails(farmerId) {
  const farmer = findFarmerById(farmerId);
  if (!farmer) return null;
  return {
    farmerId: farmer.farmer_id,
    name: farmer.full_name,
    gender: farmer.gender,
    age: parseInt(farmer.age) || 0,
    mobile: farmer.mobile,
    aadhaarMasked: farmer.aadhaar_masked,
    state: farmer.state,
    district: farmer.district,
    taluka: farmer.taluka,
    village: farmer.village,
    pincode: farmer.pincode,
    khasraNumber: farmer.khasra_number,
    gatNumber: farmer.gat_number,
    landHoldingHa: parseFloat(farmer.land_holding_ha) || 0,
    landType: farmer.land_type,
    soilType: farmer.soil_type,
    irrigationSource: farmer.irrigation_source,
    primaryCrop: farmer.primary_crop,
    secondaryCrop: farmer.secondary_crop,
    tertiaryCrop: farmer.tertiary_crop,
    hasKcc: farmer.has_kcc === 'Yes',
    kccBank: farmer.kcc_bank,
    pmKisanBeneficiary: farmer.pm_kisan_beneficiary === 'Yes',
    pmfbyEnrolled: farmer.pmfby_enrolled === 'Yes',
    pmfbySumInsuredRs: parseFloat(farmer.pmfby_sum_insured_rs) || 0,
    plotCentroidLat: parseFloat(farmer.plot_centroid_lat) || 0,
    plotCentroidLon: parseFloat(farmer.plot_centroid_lon) || 0,
    plotBoundaryRadiusM: parseFloat(farmer.plot_boundary_radius_m) || 0,
    ndviBaseline: parseFloat(farmer.ndvi_baseline) || 0,
    ndviCurrent: parseFloat(farmer.ndvi_current) || 0,
    ndviDropPct: parseFloat(farmer.ndvi_drop_pct) || 0,
    lastDamageScorePct: parseFloat(farmer.last_damage_score_pct) || 0,
    lastClaimStatus: farmer.last_claim_status || '',
    registrationDate: farmer.registration_date,
  };
}

module.exports = {
  getRegistry,
  findFarmerById,
  findFarmerByMobile,
  getAllFarmers,
  getVillages,
  getTalukas,
  getDistricts,
  getFarmerDetails,
};
