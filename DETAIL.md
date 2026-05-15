# Krishi Prabandh Core Backend - Technical Details

## Folder Structure

```
krishi-core/
├── server.js              # Entry point
├── package.json
├── .env
├── .gitignore
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
    ├── middleware/        # Multer + error handler
    └── utils/             # JSON file storage helpers
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

### Upload
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/upload` | Upload files (multipart, field: `files`) |

---

## Mock Intelligence Layer Data Structure

Claims auto-generate these AI fields on creation to simulate satellite + weather + historical analysis:
- `confidenceScore` — 55-95 range
- `geoVerified` — boolean (75% true)
- `rainfallMatched` — boolean (65% true)
- `duplicateRisk` — boolean (30% true)
- `aiRemarks` — contextual remark string

## Deployment (Railway)

1. Push to GitHub.
2. Connect repository to [Railway.app](https://railway.app).
3. Set start command: `node server.js`
4. Add environment variables: `PORT`, `NODE_ENV`, `CORS_ORIGIN`.
