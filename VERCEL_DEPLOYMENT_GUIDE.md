# 🚀 Al-Kawthar — Vercel Deployment Guide

## Architecture
- **Backend (Express API)** → Deployed on Vercel as a serverless Node.js project
- **Frontend (React/Vite)** → Deployed on Vercel as a static site

Both are separate Vercel projects that communicate with each other via environment variables.

---

## STEP 1: Deploy the Backend (Server)

### 1.1 Go to [vercel.com](https://vercel.com) and login
### 1.2 Click "Add New Project"
### 1.3 Import from GitHub: `SaqibAliRind/OutcomeBasedEducation`
### 1.4 Configure the project:
- **Root Directory**: `server`
- **Framework Preset**: `Other`
- **Build Command**: *(leave blank)*
- **Output Directory**: *(leave blank)*
- **Install Command**: `npm install`

### 1.5 Add Environment Variables (click "Environment Variables" tab):

| Key | Value |
|-----|-------|
| `MONGO_URI` | *(copy from server/.env)* |
| `JWT_SECRET` | `super_secret_jwt_key_12345` |
| `SMTP_EMAIL` | `glowify423@gmail.com` |
| `SMTP_PASSWORD` | `ufbp rope sqdu pjoi` |
| `CLOUDINARY_CLOUD_NAME` | `apfqvcd2` |
| `CLOUDINARY_API_KEY` | `596953465724929` |
| `CLOUDINARY_API_SECRET` | `LN7bbpGS4YDiBP1hEghIAWP3wAA` |
| `GEMINI_API_KEY` | *(copy from server/.env)* |
| `NODE_ENV` | `production` |

### 1.6 Click "Deploy"
### 1.7 After deploy completes, **copy the deployment URL** (e.g. `https://outcomebasededucation-server.vercel.app`)

---

## STEP 2: Deploy the Frontend (Client)

### 2.1 Click "Add New Project" again in Vercel
### 2.2 Import same GitHub repo: `SaqibAliRind/OutcomeBasedEducation`
### 2.3 Configure:
- **Root Directory**: `client`
- **Framework Preset**: `Vite`
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

### 2.4 Add Environment Variables:

| Key | Value |
|-----|-------|
| `VITE_API_URL` | `https://your-backend-url.vercel.app` ← paste the URL from Step 1.7 |

### 2.5 Click "Deploy"
### 2.6 Your frontend is now live! Share the URL with users.

---

## STEP 3: Update CORS (After Frontend Deploys)

Once the frontend deploys, copy the frontend URL (e.g. `https://al-kawthar.vercel.app`) and add it to the backend CORS whitelist in `server/src/app.js`:

```js
const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:3000',
    'https://your-frontend-url.vercel.app',  // ← ADD THIS
];
```

Then push and Vercel will auto-redeploy.

---

## Default Login Credentials

| Role | Email | Password |
|------|-------|----------|
| Super Admin | `admin@alkawthar.com` | `Password@123` |
| University Admin | `uniadmin@test.com` | `Password@123` |
| QEC | `qec@test.com` | `Password@123` |
| Dean | `dean@test.com` | `Password@123` |
| HOD | `hod_cs@test.com` | `Password@123` |
| Program Coordinator | `pc@test.com` | `Password@123` |
| Teacher | `t1@test.com` | `Password@123` |
| Student | `student1@test.com` | `Password@123` |
