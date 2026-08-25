# 🚀 Step-by-Step Render.com Deployment Guide (Unified MERN Stack)

This repository is pre-configured as a **unified Fullstack application**. Render builds the React frontend and serves both the React client and Express REST API from a single free **Web Service**.

---

## 📋 Prerequisites Checklist

1. A free account on [Render.com](https://render.com).
2. Your code pushed to a **GitHub** repository.
3. Your **MongoDB Atlas Connection URI**.

---

## ⚡ Method 1: Instant 1-Click Blueprint (Recommended)

Since this repository contains [`render.yaml`](file:///Users/konthamsaisriharshith/Desktop/client/render.yaml), Render can automatically configure the service:

1. Log into your [Render Dashboard](https://dashboard.render.com).
2. Click **New +** (top right) $\rightarrow$ select **Blueprint**.
3. Connect your GitHub repository.
4. Render will read `render.yaml` and prompt you for the `MONGODB_URI` environment variable.
5. Paste your MongoDB URI:
   ```text
   mongodb+srv://Sai:5201587sai@t-complete-backend.wyq5t6x.mongodb.net/erp?retryWrites=true&w=majority
   ```
6. Click **Apply** $\rightarrow$ Render will automatically build the React frontend and start the backend!

---

## 🛠️ Method 2: Manual Web Service Setup (Alternative)

If you prefer setting up the Web Service manually:

### Step 1: Create Web Service
1. In Render Dashboard, click **New + $\rightarrow$ Web Service**.
2. Select **Build and deploy from a Git repository** and connect your repo.

### Step 2: Configure Service Details
Fill in the following fields:

| Field | Value |
| :--- | :--- |
| **Name** | `erp-decision-support` (or your preferred name) |
| **Region** | `Oregon (US West)` or closest to your users |
| **Branch** | `main` (or `master`) |
| **Runtime** | `Node` |
| **Build Command** | `npm run build` |
| **Start Command** | `npm start` |
| **Plan Type** | `Free` |

---

### Step 3: Configure Environment Variables
Scroll down to the **Environment Variables** section and add these 5 variables:

| Key | Value | Description |
| :--- | :--- | :--- |
| `NODE_ENV` | `production` | Enables Express production optimizations |
| `PORT` | `10000` | Port assigned by Render |
| `MONGODB_URI` | `mongodb+srv://Sai:5201587sai@t-complete-backend.wyq5t6x.mongodb.net/erp?retryWrites=true&w=majority` | MongoDB Atlas cluster connection string |
| `SOURCE_DB_NAME` | `erp_source` | Raw operational database name |
| `WAREHOUSE_DB_NAME` | `erp_warehouse` | Analytical Star Schema warehouse name |

---

### Step 4: Deploy & Access Live URL
1. Click **Deploy Web Service**.
2. Render will run:
   ```bash
   npm run build
   # 1. Installs server dependencies
   # 2. Installs frontend dependencies
   # 3. Compiles Vite React SPA into frontend/dist
   # 4. Starts Node Express on port 10000
   ```
3. Once the build finishes (usually 1-2 minutes), you will see:
   ```text
   ==> Your service is live 🎉 at https://erp-decision-support-xxxx.onrender.com
   ```

---

## 🔒 Crucial MongoDB Atlas Network Access Setting

If Render cannot connect to your database, ensure **IP Whitelisting** is open:
1. Go to [cloud.mongodb.com](https://cloud.mongodb.com).
2. In the left menu, click **Network Access** (under Security).
3. Click **Add IP Address**.
4. Select **Allow Access from Anywhere (`0.0.0.0/0`)** and click **Confirm**.
   *(This allows cloud hosting platforms like Render to communicate with your Atlas cluster).*

---

## 🧪 Testing Your Live Deployed App

Once deployed, verify the endpoints:
1. **Frontend App**: `https://your-service.onrender.com/` (Opens the Decision Support System).
2. **Health Check**: `https://your-service.onrender.com/api/health` (Returns `{"status": "online"}`).
3. **Analytics Dashboard API**: `https://your-service.onrender.com/api/analytics/dashboard`.
4. **Persona Switcher**: Click the top-right persona switcher to test as **Dean Dr. Sarah Jenkins**, **Faculty Dr. Sunita Deshmukh**, or **Student Sai Gupta**!
