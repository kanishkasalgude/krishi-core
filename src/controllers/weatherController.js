const storage = require('../utils/storage');

const WEATHER_FILE = 'weather.json';

async function getWeather(req, res, next) {
  try {
    // ── BUG-11: readCollection guarantees array even if file is malformed ──
    const data = await storage.readCollection(WEATHER_FILE);
    const { village } = req.query;

    if (village) {
      const filtered = data.filter(w => w.village.toLowerCase() === village.toLowerCase());
      return res.json({ success: true, count: filtered.length, data: filtered });
    }

    const latest = data.slice(-10).reverse();
    res.json({ success: true, count: latest.length, data: latest });
  } catch (err) {
    next(err);
  }
}

module.exports = { getWeather };
