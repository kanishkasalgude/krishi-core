<p align="center">
  <img src="../Krishi%20Prabandh%20SwaSurvey%20App/logo/KRISHI_PRABANDH_LOGO.png" width="120" alt="Krishi Prabandh Logo" />
</p>

<h1 align="center">Core Backend: Deep Dive Architecture</h1>

<p align="center">
  <strong>Node.js API Gateway & Mock Intelligence Engine</strong>
</p>

---

## 1. Architectural Philosophy

The Krishi Prabandh Core Backend is designed around a **Monolithic Layered Architecture**. It prioritizes rapid iteration and simplicity for the hackathon environment while maintaining strict dependency injection and route separation to allow for future microservice extraction.

---

## 2. Directory & Module Breakdown

```text
krishi-core/
├── server.js              # Application Bootstrap & Middleware Binding
├── data/                  # Flat-file JSON "Database"
├── uploads/               # Persistent Volume for Media
└── src/
    ├── controllers/       # HTTP Request/Response formatting
    ├── routes/            # Express Router definitions
    ├── services/          # Pure business logic and Data access
    ├── middleware/        # Multer, CORS, and Auth Guards
    └── utils/             # File I/O helpers, Math functions
```

### 2.1. The Service Layer
Controllers never interact with the file system directly. They inject requests into the Service layer (e.g., `ClaimService.js`). This guarantees that when transitioning from JSON files to a PostgreSQL database, the Controller logic remains entirely untouched.

---

## 3. Data Schema & Persistence Model

The application currently relies on a synchronous JSON file-read/write strategy for data persistence.

### 3.1. `claims.json` Model
```typescript
interface Claim {
  id: string;               // UUID v4
  farmerId: string;         // Reference to farmers.json
  cropType: string;         // e.g., "Soybean", "Cotton"
  geoCoordinates: {
    lat: number;
    lng: number;
  };
  lossAreaAcres: number;
  status: 'pending' | 'approved' | 'rejected';
  officerRemark?: string;   // Populated post-review
  mediaUrls: string[];      // Pointers to /uploads/ directory
  aiMetrics: AIMetrics;
}
```

### 3.2. Concurrency Handling
While Node.js is single-threaded, concurrent asynchronous file writes can corrupt JSON files. The `utils/fileHandler.js` implements a rudimentary locking mechanism to ensure file writes are queued sequentially.

---

## 4. The Mock Intelligence Layer

A defining feature of the backend is its simulated AI Engine. When a `POST /api/claims` is received, the backend intercepts the payload before storage and passes it through `AIService.evaluate()`.

### 4.1. Simulation Logic
- **Geospatial Cross-Check:** The engine checks the farmer's claimed `geoCoordinates` against the pre-registered plot boundaries in `farmers.json`. If distance > 100 meters, `geoVerified = false`.
- **Weather Correlation:** The system looks up historical weather data for the specified `village`. If the claim is "Flood Damage" but rainfall was < 50mm, it flags a discrepancy.
- **Confidence Scoring:** Based on the above booleans, a weighted score out of 100 is generated and attached to the claim payload.

---

## 5. Advanced File Handling (Multer)

Agricultural surveys require robust media uploads. 

```javascript
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, process.env.UPLOAD_PATH);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 10485760 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.match(/image\/(jpeg|jpg|png)|video\/mp4/)) {
      return cb(new Error('Unsupported file format'), false);
    }
    cb(null, true);
  }
});
```

---

## 6. Comprehensive API Endpoints

### 6.1. Claim Management
- `POST /api/claims`: Accepts multipart form data. Requires `farmerId`, `cropType`, and files. Generates AI metrics automatically. Returns `201 Created` with claim ID.
- `GET /api/claims?status=pending`: Returns an array of filtered claims. Used by the Web Portal's polling engine.
- `PATCH /api/claims/:id`: Accepts `{ "status": "approved" }`. Appends timestamp and officer ID.

### 6.2. Analytics
- `GET /api/claims/summary`: Computes aggregate statistics (total pending, total approved, high fraud risk counts) to power the portal's top-level dashboard graphs.

---

## 7. Security Best Practices
- **CORS Configuration:** Strictly defined using the `cors` package to prevent unauthorized domains from polling sensitive agricultural data.
- **Rate Limiting:** `express-rate-limit` is integrated to prevent brute-force API attacks and DDoS vectors.
- **Payload Sanitization:** All incoming text fields are stripped of HTML tags to prevent Cross-Site Scripting (XSS) if rendered unsafely on the frontend.
