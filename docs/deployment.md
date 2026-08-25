# Deployment & Production Architecture Guide (MERN Stack)

This guide details step-by-step instructions for deploying the **ERP Data Warehouse & Decision Support System** on **MongoDB Atlas**, **Render / Railway (Backend API)**, and **Vercel (React Frontend)**.

---

## 1. MongoDB Atlas Setup (Cloud Database)

1. Create a cluster on [MongoDB Atlas](https://www.mongodb.com/atlas).
2. Under **Database Access**, create a user with read/write permissions.
3. Under **Network Access**, add IP `0.0.0.0/0` (Allow Access from Anywhere).
4. Copy the connection string:
   ```text
   mongodb+srv://<username>:<password>@cluster0.abcde.mongodb.net/?retryWrites=true&w=majority
   ```
5. Seed the cloud database:
   ```bash
   export MONGODB_URI="mongodb+srv://<username>:<password>@cluster0.abcde.mongodb.net/?retryWrites=true&w=majority"
   npm run seed
   npm run etl
   ```

---

## 2. Production Deployment (Single-Service Fullstack)

1. Connect your repository on Render or Railway.
2. Build command:
   ```bash
   npm run build
   ```
3. Start command:
   ```bash
   npm start
   ```
4. Configure Environment Variables:
   - `MONGODB_URI`: `<Your MongoDB Atlas URI>`
   - `SOURCE_DB_NAME`: `erp_source`
   - `WAREHOUSE_DB_NAME`: `erp_warehouse`
   - `PORT`: `5001` (or dynamic cloud port)

---

## 3. Local Development Quickstart

```bash
# 1. Install all dependencies
npm install && cd frontend && npm install && cd ../server && npm install && cd ..

# 2. Build React SPA
npm run build

# 3. Run automated tests
npm test

# 4. Start Development Mode (Hot-Reloading)
npm run server:watch  # Terminal 1: Node Express on Port 5001
npm run client        # Terminal 2: React Vite on Port 3000
```
Open `http://localhost:3000` in your browser.
