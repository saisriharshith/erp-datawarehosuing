import app from "./src/app.js";
import { dbManager } from "./src/config/db.js";
import { User } from "./src/models/User.js";

const PORT = process.env.PORT || 5001;

// Connect to MongoDB Atlas & Synchronize Institutional Users
dbManager.connect().then(() => {
  User.syncWithDatabase();
});

app.listen(PORT, () => {
  console.log(`======================================================================`);
  console.log(`🚀 MERN BACKEND SERVER RUNNING ON: http://localhost:${PORT}`);
  console.log(`📡 Health Check:  http://localhost:${PORT}/api/health`);
  console.log(`📊 Dashboard API: http://localhost:${PORT}/api/analytics/dashboard`);
  console.log(`======================================================================`);
});
