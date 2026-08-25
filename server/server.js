import app from "./src/app.js";

const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
  console.log(`======================================================================`);
  console.log(`🚀 MERN BACKEND SERVER RUNNING ON: http://localhost:${PORT}`);
  console.log(`📡 Health Check:  http://localhost:${PORT}/api/health`);
  console.log(`📊 Dashboard API: http://localhost:${PORT}/api/analytics/dashboard`);
  console.log(`======================================================================`);
});
