const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

// ── BUG-02 / BUG-05: Global crash guard — keeps server alive during demo ──
process.on('uncaughtException', (err) => {
  console.error('[KRISHI] UNCAUGHT EXCEPTION — server staying alive:', err.message);
});
process.on('unhandledRejection', (reason) => {
  console.error('[KRISHI] UNHANDLED REJECTION — server staying alive:', reason);
});

// ── BUG-03: Ensure uploads directory exists before multer tries to write ──
const UPLOADS_DIR = path.join(__dirname, 'uploads');
for (const sub of ['', 'images', 'videos', 'documents']) {
  const d = path.join(UPLOADS_DIR, sub);
  if (!fs.existsSync(d)) {
    fs.mkdirSync(d, { recursive: true });
    if (sub) console.log(`[KRISHI] Created missing uploads/${sub}/ directory`);
  }
}
const { errorHandler, notFound } = require('./src/middleware/errorHandler');

const farmerRoutes = require('./src/routes/farmers');
const claimRoutes = require('./src/routes/claims');
const weatherRoutes = require('./src/routes/weather');
const kycRoutes = require('./src/routes/kyc');
const paymentRoutes = require('./src/routes/payments');
const uploadRoutes = require('./src/routes/upload');
const surveyRoutes = require('./src/routes/surveys');
const reportRoutes = require('./src/routes/reports');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(express.json({ limit: '500mb' }));
app.use(express.urlencoded({ extended: true, limit: '500mb' }));

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    timestamp: new Date().toISOString(),
    service: 'KRISHI-PRABANDH API',
    version: '1.0.0',
    uptime: process.uptime(),
  });
});

app.use('/api/farmers', farmerRoutes);
app.use('/api/claims', claimRoutes);
app.use('/api/weather', weatherRoutes);
app.use('/api/kyc', kycRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/surveys', surveyRoutes);
app.use('/api/reports', reportRoutes);

app.use(notFound);
app.use(errorHandler);

const server = app.listen(PORT, () => {
  console.log(`[KRISHI-PRABANDH] Server running on port ${PORT}`);
  console.log(`[KRISHI-PRABANDH] API: http://localhost:${PORT}/api`);
  
  // Detect local IP to help the user
  const os = require('os');
  const nets = os.networkInterfaces();
  let localIp = '127.0.0.1';
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === 'IPv4' && !net.internal) {
        localIp = net.address;
        break;
      }
    }
  }
  
  console.log('\n========================================================');
  console.log(`👉 YOUR LOCAL IP ADDRESS IS: ${localIp}`);
  console.log(`Put this in Android Studio Constants.kt: http://${localIp}:5000/`);
  console.log('========================================================\n');
});
server.timeout = 600000;

// ── BUG-05: Handle EADDRINUSE and other listen errors gracefully ──
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`[KRISHI] Port ${PORT} already in use. Exiting cleanly.`);
  } else {
    console.error('[KRISHI] Server error:', err.message);
  }
  process.exit(1);
});
