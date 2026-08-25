# Deployment & Production Architecture Guide

This guide details step-by-step instructions for deploying the **ERP Data Warehouse & Decision Support System** on **MongoDB Atlas**, **Render (Backend API)**, and **Vercel (Frontend Client)**.

---

## 1. MongoDB Atlas Setup (Cloud Database)

1. Create a free M0 cluster on [MongoDB Atlas](https://www.mongodb.com/atlas).
2. Under **Database Access**, create a user `erp_admin` with read/write permissions.
3. Under **Network Access**, add IP `0.0.0.0/0` (Allow Access from Anywhere) to permit connections from Render and development environments.
4. Copy the connection string:
   ```
   mongodb+srv://erp_admin:<password>@cluster0.abcde.mongodb.net/?retryWrites=true&w=majority
   ```
5. Seed the cloud database:
   ```bash
   export MONGODB_URI="mongodb+srv://erp_admin:<password>@cluster0.abcde.mongodb.net/?retryWrites=true&w=majority"
   python scripts/seed_database.py
   python etl/pipeline.py
   python ml/train.py
   ```

---

## 2. Backend Deployment on Render

1. Create a **Web Service** on [Render](https://render.com).
2. Connect your GitHub repository.
3. Configure the service:
   - **Environment**: `Python 3`
   - **Root Directory**: `.` (or `backend`)
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `gunicorn backend.app:app --bind 0.0.0.0:$PORT`
4. Set Environment Variables on Render:
   - `MONGODB_URI`: `<Your MongoDB Atlas URI>`
   - `SOURCE_DB_NAME`: `erp_source`
   - `WAREHOUSE_DB_NAME`: `erp_warehouse`
   - `SECRET_KEY`: `<Generate random secret string>`
   - `FRONTEND_URL`: `https://your-frontend.vercel.app` (or `*` during initial testing)
5. Deploy and verify the health check at:
   `https://<your-render-app>.onrender.com/api/health`

---

## 3. Frontend Deployment on Vercel

1. Create a new project on [Vercel](https://vercel.com).
2. Select your GitHub repository.
3. Set **Root Directory** to `frontend`.
4. Create or edit `frontend/js/config.js` to point to your live Render backend URL:
   ```javascript
   const API_CONFIG = {
     BASE_URL: window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
       ? "http://localhost:5001/api"
       : "https://<your-render-app>.onrender.com/api"
   };
   ```
5. Deploy. Vercel will host the static HTML/CSS/JS with automatic global CDN caching and SSL.

---

## 4. Local Development Quickstart

```bash
# 1. Clone repository
git clone <repo-url>
cd client

# 2. Setup Virtual Environment
python3 -m venv venv
source venv/bin/activate

# 3. Install dependencies
pip install -r requirements.txt

# 4. Configure local environment
cp .env.example .env

# 5. Generate source synthetic data & seed MongoDB
python scripts/generate_data.py
python scripts/seed_database.py

# 6. Run ETL Pipeline & Train ML Model
python etl/pipeline.py
python ml/train.py

# 7. Start Backend API
python -m backend.app

# 8. Start Frontend (Live Server or Python HTTP Server)
cd frontend && python3 -m http.server 3000
```
Open `http://localhost:3000` in your browser.
