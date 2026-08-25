import React, { useState, useEffect } from 'react';
import { fetchAPI } from '../services/api';

export default function RiskAnalysis() {
  const [baseline, setBaseline] = useState({
    attendance_percentage: 62.0,
    previous_gpa: 5.8,
    internal_marks_avg: 45.0,
    failed_subjects: 2,
    fee_outstanding_ratio: 0.35,
    library_usage: 1
  });

  const [scenario, setScenario] = useState({
    attendance_percentage: 82.0,
    previous_gpa: 6.8,
    internal_marks_avg: 65.0,
    failed_subjects: 0,
    fee_outstanding_ratio: 0.0,
    library_usage: 5
  });

  const [simResult, setSimResult] = useState(null);
  const [roster, setRoster] = useState([]);
  const [loading, setLoading] = useState(false);

  const runSimulation = async () => {
    setLoading(true);
    try {
      const res = await fetchAPI('/simulate-scenario', {
        method: 'POST',
        body: JSON.stringify({ baseline, scenario })
      });
      setSimResult(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runSimulation();
    fetchAPI('/risk-roster?limit=25')
      .then(res => setRoster(res.roster || []))
      .catch(err => console.error(err));
  }, []);

  const handleExportCSV = () => {
    if (!roster.length) return;
    const headers = "Student_ID,Department,Semester,Attendance,Risk_Level,Risk_Score,Risk_Factors\n";
    const rows = roster.map(r =>
      `"${r.student_id}","${r.department_name}","${r.semester}","${r.attendance_percentage}%","${r.risk_level}","${r.risk_score}","${(r.risk_factors || []).join('; ')}"`
    ).join("\n");
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "student_risk_advisory_roster.csv";
    link.click();
  };

  const getGaugeRotation = (score = 0) => {
    // 0 -> -90 deg, 1 -> 90 deg
    return -90 + (score * 180);
  };

  return (
    <div className="p-3 p-md-4">
      {/* Header */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 gap-3">
        <div>
          <h4 className="fw-bold mb-1">Predictive Student Risk & What-If Simulator</h4>
          <p className="text-muted small mb-0">Scikit-learn analytical risk classifier (94.5% Accuracy) with interactive What-If scenario interventions.</p>
        </div>

        <button className="btn btn-sm btn-outline-success d-flex align-items-center gap-1" onClick={handleExportCSV}>
          <i className="bi bi-file-earmark-spreadsheet"></i>
          <span>Export Advisee CSV</span>
        </button>
      </div>

      {/* Speedometer Gauge & What-If Controls */}
      <div className="row g-3 mb-4">
        {/* Left: What-If Slider Controls */}
        <div className="col-12 col-lg-7">
          <div className="metric-card">
            <h6 className="fw-bold mb-3"><i className="bi bi-sliders text-primary me-1"></i> Simulated Scenario Adjustment</h6>

            <div className="row g-3">
              <div className="col-6">
                <label className="form-label small fw-semibold">Attendance: <strong className="text-primary">{scenario.attendance_percentage}%</strong></label>
                <input
                  type="range"
                  className="form-range"
                  min="30"
                  max="100"
                  value={scenario.attendance_percentage}
                  onChange={(e) => setScenario({ ...scenario, attendance_percentage: parseFloat(e.target.value) })}
                />
              </div>

              <div className="col-6">
                <label className="form-label small fw-semibold">Previous CGPA: <strong className="text-primary">{scenario.previous_gpa}</strong></label>
                <input
                  type="range"
                  className="form-range"
                  min="3.0"
                  max="10.0"
                  step="0.1"
                  value={scenario.previous_gpa}
                  onChange={(e) => setScenario({ ...scenario, previous_gpa: parseFloat(e.target.value) })}
                />
              </div>

              <div className="col-6">
                <label className="form-label small fw-semibold">Internal Marks: <strong className="text-primary">{scenario.internal_marks_avg}%</strong></label>
                <input
                  type="range"
                  className="form-range"
                  min="20"
                  max="100"
                  value={scenario.internal_marks_avg}
                  onChange={(e) => setScenario({ ...scenario, internal_marks_avg: parseFloat(e.target.value) })}
                />
              </div>

              <div className="col-6">
                <label className="form-label small fw-semibold">Backlogs: <strong className="text-primary">{scenario.failed_subjects}</strong></label>
                <input
                  type="range"
                  className="form-range"
                  min="0"
                  max="5"
                  value={scenario.failed_subjects}
                  onChange={(e) => setScenario({ ...scenario, failed_subjects: parseInt(e.target.value) })}
                />
              </div>

              <div className="col-6">
                <label className="form-label small fw-semibold">Outstanding Fee Ratio: <strong className="text-primary">{scenario.fee_outstanding_ratio}</strong></label>
                <input
                  type="range"
                  className="form-range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={scenario.fee_outstanding_ratio}
                  onChange={(e) => setScenario({ ...scenario, fee_outstanding_ratio: parseFloat(e.target.value) })}
                />
              </div>

              <div className="col-6">
                <label className="form-label small fw-semibold">Library Books / Sem: <strong className="text-primary">{scenario.library_usage}</strong></label>
                <input
                  type="range"
                  className="form-range"
                  min="0"
                  max="10"
                  value={scenario.library_usage}
                  onChange={(e) => setScenario({ ...scenario, library_usage: parseInt(e.target.value) })}
                />
              </div>
            </div>

            <div className="mt-3 text-end">
              <button className="btn btn-sm btn-primary px-3" onClick={runSimulation} disabled={loading} style={{ background: '#4f46e5', borderColor: '#4f46e5' }}>
                <i className="bi bi-play-fill me-1"></i> Re-Calculate Risk Impact
              </button>
            </div>
          </div>
        </div>

        {/* Right: Dynamic Speedometer SVG Gauge */}
        <div className="col-12 col-lg-5">
          <div className="metric-card text-center">
            <h6 className="fw-bold mb-2">Real-Time Risk Probability Speedometer</h6>
            <p className="text-muted small mb-3">Multi-factor composite risk probability index</p>

            {simResult && (
              <div>
                <svg width="220" height="120" viewBox="0 0 220 120" className="mx-auto d-block">
                  {/* Gauge Background Arc */}
                  <path d="M 20 110 A 90 90 0 0 1 200 110" fill="none" stroke="#e2e8f0" strokeWidth="18" strokeLinecap="round" />
                  {/* Low Zone (Green) */}
                  <path d="M 20 110 A 90 90 0 0 1 70 38" fill="none" stroke="#22c55e" strokeWidth="18" strokeLinecap="round" />
                  {/* Medium Zone (Amber) */}
                  <path d="M 70 38 A 90 90 0 0 1 150 38" fill="none" stroke="#f59e0b" strokeWidth="18" />
                  {/* High Zone (Red) */}
                  <path d="M 150 38 A 90 90 0 0 1 200 110" fill="none" stroke="#ef4444" strokeWidth="18" strokeLinecap="round" />

                  {/* Gauge Needle */}
                  <line
                    x1="110"
                    y1="110"
                    x2="110"
                    y2="30"
                    stroke="#1e293b"
                    strokeWidth="4"
                    strokeLinecap="round"
                    style={{
                      transformOrigin: '110px 110px',
                      transform: `rotate(${getGaugeRotation(simResult.scenario.risk_score)}deg)`,
                      transition: 'transform 0.5s ease-out'
                    }}
                  />
                  <circle cx="110" cy="110" r="8" fill="#1e293b" />
                </svg>

                <h3 className={`fw-bold mt-2 mb-0 ${simResult.scenario.risk_level === 'HIGH' ? 'text-danger' : simResult.scenario.risk_level === 'MEDIUM' ? 'text-warning' : 'text-success'}`}>
                  {(simResult.scenario.risk_score * 100).toFixed(1)}% Risk
                </h3>
                <span className={`badge ${simResult.scenario.risk_level === 'HIGH' ? 'badge-risk-high' : simResult.scenario.risk_level === 'MEDIUM' ? 'badge-risk-med' : 'badge-risk-low'}`}>
                  {simResult.scenario.risk_level} PROBABILITY
                </span>

                <div className="alert alert-info py-2 mt-3 mb-0 small text-start">
                  <strong>Impact:</strong> {simResult.impact_summary}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Risk Advisory Roster Table */}
      <div className="metric-card">
        <div className="d-flex align-items-center justify-content-between mb-3">
          <h6 className="fw-bold mb-0">Cohort Risk Advisory Roster</h6>
          <span className="badge bg-light text-dark border">Scikit-learn Model Inferences</span>
        </div>

        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0 small">
            <thead className="table-light">
              <tr>
                <th>Student ID</th>
                <th>Department</th>
                <th>Semester</th>
                <th>Attendance</th>
                <th>Risk Level</th>
                <th>Risk Factors</th>
              </tr>
            </thead>
            <tbody>
              {roster.slice(0, 10).map((r, idx) => (
                <tr key={idx}>
                  <td className="font-mono fw-bold">{r.student_id}</td>
                  <td>{r.department_name}</td>
                  <td>Sem {r.semester}</td>
                  <td>{r.attendance_percentage}%</td>
                  <td>
                    <span className={`badge ${r.risk_level === 'HIGH' ? 'badge-risk-high' : r.risk_level === 'MEDIUM' ? 'badge-risk-med' : 'badge-risk-low'}`}>
                      {r.risk_level}
                    </span>
                  </td>
                  <td className="text-muted">{(r.risk_factors || []).join(', ')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
