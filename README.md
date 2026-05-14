# KRISHI-PRABANDH — Agricultural Governance Platform

Monolithic Node.js + Express backend for hackathon demo. JSON file storage. No DB required.

## Folder Structure

```
krishi-core/
├── server.js              # Entry point
├── package.json
├── .env
├── .gitignore
├── README.md
├── data/
│   ├── farmers.json       # Farmer profiles
│   ├── claims.json        # Crop loss claims
│   ├── weather.json       # Village weather data
│   ├── kyc.json           # KYC records
│   └── payments.json      # Payment records
├── uploads/               # Uploaded files (images/videos)
└── src/
    ├── controllers/       # Request handlers
    ├── routes/            # Express routers
    ├── services/          # Business logic + AI mock
    ├── middleware/         # Multer + error handler
    └── utils/             # JSON file storage helpers
```

## Quick Start

```bash
npm install
npm start          # production
npm run dev        # dev with --watch
```

## Environment Variables (.env)

```
PORT=5000
NODE_ENV=production
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=10485760
CORS_ORIGIN=*
```

## API Reference

### Health
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Server health + uptime |

### Farmers
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/farmers` | List all farmers |
| GET | `/api/farmers/:id` | Get farmer by ID |
| GET | `/api/farmers/:id/claims` | Get claims for a farmer |

### Claims (Core)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/claims` | List claims (?status=pending) |
| GET | `/api/claims/summary` | Counts by status |
| GET | `/api/claims/:id` | Get claim by ID |
| POST | `/api/claims` | Create new claim |
| PATCH | `/api/claims/:id` | Update claim status |

### Supporting Data
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/weather` | Weather data (?village=Barwani) |
| GET | `/api/kyc` | KYC records (?status=verified) |
| GET | `/api/kyc/:farmerId` | KYC by farmer |
| GET | `/api/payments` | Payments (?status=disbursed) |
| GET | `/api/payments/:claimId` | Payment by claim |

### Upload
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/upload` | Upload files (multipart, field: `files`) |

## Sample Requests

### Create a claim
```bash
curl -X POST http://localhost:5000/api/claims \
  -H "Content-Type: application/json" \
  -d '{
    "farmerId": "FARM-001",
    "farmerName": "Ramesh Singh",
    "cropType": "Wheat",
    "claimType": "crop_loss",
    "village": "Barwani",
    "district": "Khargone",
    "state": "Madhya Pradesh",
    "geoCoordinates": {"lat": 22.0321, "lng": 75.0092},
    "lossAreaAcres": 1.5,
    "description": "Hailstorm destroyed crop"
  }'
```

### Approve/reject a claim
```bash
curl -X PATCH http://localhost:5000/api/claims/CLM-001 \
  -H "Content-Type: application/json" \
  -d '{"status": "approved", "officerRemark": "Verified in person"}'
```

### Upload files
```bash
curl -X POST http://localhost:5000/api/upload \
  -F "files=@photo.jpg" \
  -F "files=@video.mp4"
```

## Frontend Integration (Axios)

### Farmer App — Submit Claim
```js
import axios from 'axios';

const API = axios.create({ baseURL: 'http://localhost:5000/api' });

// Submit claim with files
const formData = new FormData();
formData.append('files', imageFile);
formData.append('farmerId', 'FARM-001');
formData.append('cropType', 'Wheat');
formData.append('claimType', 'crop_loss');
formData.append('village', 'Barwani');
formData.append('geoCoordinates', JSON.stringify({lat:22.03, lng:75.01}));

const res = await API.post('/claims', formData);
```

### Officer Dashboard — Live Polling (5s)
```js
const POLL_INTERVAL = 5000;

async function fetchDashboard() {
  const [claims, summary, weather] = await Promise.all([
    API.get('/claims?status=pending'),
    API.get('/claims/summary'),
    API.get('/weather'),
  ]);
  setClaims(claims.data.data);
  setSummary(summary.data.data);
  setWeather(weather.data.data);
}

useEffect(() => {
  fetchDashboard();
  const id = setInterval(fetchDashboard, POLL_INTERVAL);
  return () => clearInterval(id);
}, []);
```

### Approve/Reject from Dashboard
```js
async function handleDecision(claimId, decision) {
  await API.patch(`/claims/${claimId}`, {
    status: decision,
    officerRemark: decision === 'approved'
      ? 'Approved after field verification'
      : 'Rejected - insufficient evidence',
  });
  fetchDashboard(); // refresh
}
```

## Deployment (Railway)

1. Push to GitHub:
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USER/krishi-prabandh.git
git push -u origin main
```

2. Go to [railway.app](https://railway.app) → New Project → Deploy from GitHub repo

3. Railway auto-detects Node.js. Set start command: `node server.js`

4. Add environment variables in Railway dashboard:
   - `PORT=5000`
   - `NODE_ENV=production`
   - `CORS_ORIGIN=*`

5. Railway assigns a public URL like `https://krishi-prabandh.up.railway.app`

6. Update frontend base URLs to the Railway URL.

## Mock Intelligence Layer

Claims auto-generate these AI fields on creation:
- `confidenceScore` — 55-95 range
- `geoVerified` — boolean (75% true)
- `rainfallMatched` — boolean (65% true)
- `duplicateRisk` — boolean (30% true)
- `aiRemarks` — contextual remark string

These simulate satellite + weather + historical analysis.
