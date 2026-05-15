<p align="center">
  <img src="./logo/KRISHI_PRABANDH_LOGO.png" width="120" alt="Krishi Prabandh Logo" />
</p>

<h1 align="center">Krishi Prabandh Core Backend</h1>

<p align="center">
  <strong>Centralized Node.js Services for Agricultural Governance</strong>
</p>

<p align="center">
  <a href="./DETAIL.md">Technical Documentation</a> &nbsp;&bull;&nbsp;
  <a href="../README.md">Main Project</a>
</p>

---

The **Krishi Prabandh Core Backend** is the centralized nervous system of the agricultural governance platform. It provides RESTful APIs for both the SwaSurvey Mobile App and the Officer Web Portal.

Built with a monolithic Node.js + Express architecture, it processes complex multipart farmer submissions, acts as the definitive source of truth for land and weather data, and runs mock AI algorithms for automated fraud detection and application prioritization.

---

## Core Features

### 📡 Unified REST API
Serves as the gateway for mobile app synchronization and web portal data fetching. Manages farmers, agricultural claims, and verification records.

### 🧠 Mock Intelligence Layer
Automatically simulates complex AI analysis on incoming claims:
- Confidence Scoring (55-95)
- Geolocation Validation
- Duplicate Risk Assessment

### 💾 Robust File Handling
Supports high-volume multimedia uploads from field applications, safely processing and storing large geotagged image and video files via Multer middleware.

### ⏱️ Live Polling Support
Optimized to handle 5-second interval live polling from the Web Portal dashboard, ensuring officers see applications the moment farmers press submit in the field.

---

## Quick Start

### Prerequisites
- **Node.js** v18+

### Running the Server

```bash
npm install
npm run dev        # Run with live-reloading (nodemon)
```

The server runs on `http://localhost:5000` by default.

---

## Environment Variables (`.env`)

Create a `.env` file in the root directory:

```env
PORT=5000
NODE_ENV=development
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=10485760
CORS_ORIGIN=*
```

---

For complete API reference, file structure, and deployment instructions, see [DETAIL.md](./DETAIL.md).
