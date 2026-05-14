const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();
const { errorHandler, notFound } = require('./src/middleware/errorHandler');

const farmerRoutes = require('./src/routes/farmers');
const claimRoutes = require('./src/routes/claims');
const weatherRoutes = require('./src/routes/weather');
const kycRoutes = require('./src/routes/kyc');
const paymentRoutes = require('./src/routes/payments');
const uploadRoutes = require('./src/routes/upload');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

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

app.use(notFound);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`[KRISHI-PRABANDH] Server running on port ${PORT}`);
  console.log(`[KRISHI-PRABANDH] API: http://localhost:${PORT}/api`);
});
