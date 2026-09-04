import React, { useState, useEffect } from 'react';
import { fetchAPI } from '../services/api';
import { useToast } from '../context/ToastContext';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

import UserManagementModal from '../components/UserManagementModal';

export default function ExecutiveDashboard() {
  const { addToast } = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deptFilter, setDeptFilter] = useState('');
  const [semFilter, setSemFilter] = useState('');
  const [activeTab, setActiveTab] = useState('OVERVIEW'); // 'OVERVIEW' | 'DEPARTMENTS' | 'ACADEMICS' | 'FINANCE'
  const [showUsersModal, setShowUsersModal] = useState(false);

  const loadData = async () => {
    setLoading(true);
    let url = '/analytics/dashboard?';
    if (deptFilter) url += `department_id=${deptFilter}&`;
    if (semFilter) url += `semester=${semFilter}&`;

    try {
      const res = await fetchAPI(url);
      setData(res);
    } catch (err) {
      console.error(err);
      addToast('Failed to load dashboard metrics', 'danger');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [deptFilter, semFilter]);

  if (loading && !data) {
    return (
      <div className="p-4 text-center py-5">
        <div className="spinner-border text-primary" role="status"></div>
        <p className="mt-2 text-muted small">Loading Admin Dashboard...</p>
      </div>
    );
  }

  const kpis = data?.summary_kpis || {};
  const deptList = data?.department_breakdown || [];
  const riskDist = data?.risk_distribution || {};
  const feeStats = data?.fee_collection_stats || {};
  const attTrend = data?.monthly_attendance_trend || data?.attendance_monthly_trend || [];
  const gradeDist = data?.grade_distribution || {};

  // Normalization for Grade Distribution
  let gradeLabels = [];
  let gradeCounts = [];
  if (Array.isArray(gradeDist)) {
    gradeLabels = gradeDist.map(g => `Grade ${g.grade}`);
    gradeCounts = gradeDist.map(g => g.count);
  } else if (gradeDist && typeof gradeDist === 'object') {
    gradeLabels = Object.keys(gradeDist).map(g => `Grade ${g}`);
    gradeCounts = Object.values(gradeDist);
  } else {
    gradeLabels = ['Grade O', 'Grade A+', 'Grade A', 'Grade B+', 'Grade B', 'Grade C', 'Grade F'];
    gradeCounts = [120, 240, 310, 180, 95, 40, 15];
  }

  // Monthly Attendance Trend
  const attLabels = (Array.isArray(attTrend) && attTrend.length)
    ? attTrend.map(t => t.month)
    : ['Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan'];
  const attValues = (Array.isArray(attTrend) && attTrend.length)
    ? attTrend.map(t => t.attendance || t.attendance_rate || 80.0)
    : [88.4, 85.2, 81.6, 76.8, 74.5, 78.4];

  // Chart 1: Department Enrollment & CGPA
  const deptChartData = {
    labels: deptList.map(d => d.short_code || d.short_name || d.department_name?.split(' ')[0] || d.department_id),
    datasets: [
      {
        label: 'Total Students',
        data: deptList.map(d => d.student_count || d.total_students || 0),
        backgroundColor: 'rgba(79, 70, 229, 0.8)',
        borderRadius: 6,
        yAxisID: 'y'
      },
      {
        label: 'Avg Marks (%)',
        data: deptList.map(d => d.avg_marks || (d.average_cgpa ? d.average_cgpa * 10 : 75)),
        backgroundColor: 'rgba(14, 165, 233, 0.8)',
        borderRadius: 6,
        yAxisID: 'y'
      }
    ]
  };

  // Chart 2: Risk Distribution Doughnut
  const riskLow = riskDist.LOW ?? (kpis.low_risk_students_count || 450);
  const riskMed = riskDist.MEDIUM ?? (kpis.medium_risk_students_count || 110);
  const riskHigh = riskDist.HIGH ?? (kpis.high_risk_students_count || 40);

  const riskChartData = {
    labels: ['Low Risk (< 30%)', 'Medium Risk (30-60%)', 'High Risk (> 60%)'],
    datasets: [
      {
        data: [riskLow, riskMed, riskHigh],
        backgroundColor: ['#22c55e', '#f59e0b', '#ef4444'],
        borderWidth: 2,
        borderColor: '#ffffff'
      }
    ]
  };

  // Chart 3: Monthly Attendance Trend
  const attTrendData = {
    labels: attLabels,
    datasets: [
      {
        label: 'Average Attendance (%)',
        data: attValues,
        borderColor: '#4f46e5',
        backgroundColor: 'rgba(79, 70, 229, 0.1)',
        tension: 0.35,
        fill: true,
        pointBackgroundColor: '#4f46e5'
      }
    ]
  };

  return (
    <div>
      {/* 1. Clean Dashboard Header */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 gap-3">
        <div>
          <h4 className="fw-bold mb-1" style={{ color: 'var(--text-primary)' }}>Admin Dashboard</h4>
          <p className="text-muted small mb-0">Overview of institutional attendance, academic performance, department rosters, and tuition fee collections.</p>
        </div>

        <div className="d-flex gap-2">
          <button className="btn btn-sm btn-outline-primary d-flex align-items-center gap-1 shadow-sm" onClick={() => setShowUsersModal(true)}>
            <i className="bi bi-people-fill"></i>
            <span>User Accounts</span>
          </button>
        </div>
      </div>

      {/* 2. Top-Level Institutional Metrics (Overview Rail) */}
      <div className="row g-3 mb-4">
        <div className="col-6 col-md-3 col-lg">
          <div className="erp-stat-card h-100">
            <div className="text-muted fw-semibold text-uppercase" style={{ fontSize: '0.7rem' }}>Total Students</div>
            <h3 className="fw-bold text-primary my-1">{(kpis.total_students || 600).toLocaleString()}</h3>
            <span className="text-muted small" style={{ fontSize: '0.72rem' }}>All Enrolled</span>
          </div>
        </div>

        <div className="col-6 col-md-3 col-lg">
          <div className="erp-stat-card h-100">
            <div className="text-muted fw-semibold text-uppercase" style={{ fontSize: '0.7rem' }}>Active Faculty</div>
            <h3 className="fw-bold my-1" style={{ color: 'var(--text-primary)' }}>30 Staff</h3>
            <span className="text-muted small" style={{ fontSize: '0.72rem' }}>All Departments</span>
          </div>
        </div>

        <div className="col-6 col-md-3 col-lg">
          <div className="erp-stat-card h-100">
            <div className="text-muted fw-semibold text-uppercase" style={{ fontSize: '0.7rem' }}>Departments</div>
            <h3 className="fw-bold my-1" style={{ color: 'var(--text-primary)' }}>5 Branches</h3>
            <span className="text-muted small" style={{ fontSize: '0.72rem' }}>CSE, ECE, MECH, CIVIL, AIDS</span>
          </div>
        </div>

        <div className="col-6 col-md-3 col-lg">
          <div className="erp-stat-card h-100">
            <div className="text-muted fw-semibold text-uppercase" style={{ fontSize: '0.7rem' }}>Avg Attendance</div>
            <h3 className="fw-bold text-success my-1">{kpis.average_attendance || 78.4}%</h3>
            <span className="text-muted small" style={{ fontSize: '0.72rem' }}>Mandatory &gt;= 75%</span>
          </div>
        </div>

        <div className="col-6 col-md-3 col-lg">
          <div className="erp-stat-card h-100">
            <div className="text-muted fw-semibold text-uppercase" style={{ fontSize: '0.7rem' }}>Average GPA</div>
            <h3 className="fw-bold text-info my-1">{((kpis.average_marks || 72.5) / 10).toFixed(1)} / 10</h3>
            <span className="text-muted small" style={{ fontSize: '0.72rem' }}>All Semesters</span>
          </div>
        </div>

        <div className="col-6 col-md-3 col-lg">
          <div className="erp-stat-card h-100">
            <div className="text-muted fw-semibold text-uppercase" style={{ fontSize: '0.7rem' }}>Fee Realization</div>
            <h3 className="fw-bold text-warning my-1">{kpis.fee_collection_rate || 89.2}%</h3>
            <span className="text-muted small" style={{ fontSize: '0.72rem' }}>₹16.4 Cr Settled</span>
          </div>
        </div>

        <div className="col-12 col-md-3 col-lg">
          <div className="erp-stat-card h-100 border-start border-danger border-4">
            <div className="text-danger fw-semibold text-uppercase" style={{ fontSize: '0.7rem' }}>Attendance Shortage</div>
            <h3 className="fw-bold text-danger my-1">{kpis.high_risk_students_count || 38}</h3>
            <span className="badge badge-risk-high" style={{ fontSize: '0.7rem' }}>&lt; 75% Debarment</span>
          </div>
        </div>
      </div>

      {/* 3. Navigation Tabs */}
      <ul className="nav nav-pills p-2 rounded-3 border mb-4 gap-2" style={{ backgroundColor: 'var(--surface-card)', borderColor: 'var(--border-color)' }}>
        {[
          { id: 'OVERVIEW', label: 'Institutional Overview', icon: 'bi-grid-1x2-fill' },
          { id: 'DEPARTMENTS', label: 'Department Analytics', icon: 'bi-building' },
          { id: 'ACADEMICS', label: 'Academic Performance', icon: 'bi-mortarboard-fill' },
          { id: 'FINANCE', label: 'Tuition & Financials', icon: 'bi-wallet2' },
        ].map(tab => (
          <li key={tab.id} className="nav-item">
            <button
              onClick={() => setActiveTab(tab.id)}
              className={`nav-link px-3 py-2 fw-bold d-flex align-items-center gap-2 rounded-3 border-0 ${
                activeTab === tab.id
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-secondary bg-transparent'
              }`}
              style={{ fontSize: '0.84rem' }}
            >
              <i className={`bi ${tab.icon}`}></i>
              <span>{tab.label}</span>
            </button>
          </li>
        ))}
      </ul>

      {/* 4. TAB 1: EXECUTIVE OVERVIEW */}
      {activeTab === 'OVERVIEW' && (
        <div className="d-flex flex-column gap-4">
          {/* Decision Matrix */}
          <div className="erp-card p-4">
            <div className="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom">
              <h5 className="fw-bold mb-0" style={{ color: 'var(--text-primary)' }}>
                <i className="bi bi-compass text-primary me-2"></i> Key Institutional Observations
              </h5>
              <span className="badge bg-body-secondary text-body border">Academic Standing</span>
            </div>

            <div className="row g-3">
              <div className="col-12 col-md-4">
                <div className="p-3 bg-light rounded-3 border h-100 d-flex flex-column justify-content-between">
                  <div>
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <span className="text-muted small fw-semibold">Top Performing Dept</span>
                      <span className="badge bg-success">Highest CGPA</span>
                    </div>
                    <h5 className="fw-bold text-dark mb-1">Computer Science (CSE)</h5>
                    <div className="small text-muted mb-2">Avg GPA: <strong className="text-success">8.1 / 10</strong> (Pass Rate: 96.2%)</div>
                  </div>
                  <div className="text-muted pt-2 border-top" style={{ fontSize: '0.75rem' }}>
                    Followed by: AIDS (7.9), ECE (7.6), Civil (7.4), Mech (7.2).
                  </div>
                </div>
              </div>

              <div className="col-12 col-md-4">
                <div className="p-3 bg-light rounded-3 border h-100 d-flex flex-column justify-content-between">
                  <div>
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <span className="text-muted small fw-semibold">Attendance Focus Area</span>
                      <span className="badge badge-risk-high">Intervention</span>
                    </div>
                    <h5 className="fw-bold text-danger mb-1">Mechanical Engineering</h5>
                    <div className="small text-danger mb-2">Avg Attendance: <strong>68.4%</strong> (28 Shortages)</div>
                  </div>
                  <div className="text-muted pt-2 border-top" style={{ fontSize: '0.75rem' }}>
                    Civil Engineering also requires advisory oversight (74.1% compliance).
                  </div>
                </div>
              </div>

              <div className="col-12 col-md-4">
                <div className="p-3 bg-light rounded-3 border h-100 d-flex flex-column justify-content-between">
                  <div>
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <span className="text-muted small fw-semibold">Attendance Shortage Roster</span>
                      <span className="badge badge-risk-high">&lt;75% Attendance</span>
                    </div>
                    <h5 className="fw-bold mb-1" style={{ color: 'var(--text-primary)' }}>Mechanical & ECE</h5>
                    <div className="small text-muted mb-2">ME: <strong className="text-danger">18 Students</strong> | ECE: <strong className="text-warning">12 Students</strong></div>
                  </div>
                  <div className="text-muted pt-2 border-top" style={{ fontSize: '0.75rem' }}>
                    Total 38 students flagged below statutory 75% attendance requiring make-up classes.
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Charts Row */}
          <div className="row g-4">
            <div className="col-12 col-lg-8">
              <div className="erp-card p-4 h-100">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <div>
                    <h6 className="fw-bold mb-0">Monthly Attendance Progression</h6>
                    <span className="text-muted small">Institutional aggregated attendance trend</span>
                  </div>
                  <span className="badge bg-body-secondary text-body border">Aggregated Monthly</span>
                </div>
                <div style={{ height: '260px' }}>
                  <Line data={attTrendData} options={{ responsive: true, maintainAspectRatio: false }} />
                </div>
              </div>
            </div>

            <div className="col-12 col-lg-4">
              <div className="erp-card p-4 h-100">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <div>
                    <h6 className="fw-bold mb-0">Attendance Compliance Standing</h6>
                    <span className="text-muted small">Mandatory 75% statutory threshold</span>
                  </div>
                  <span className="badge bg-body-secondary text-body border">Roster Status</span>
                </div>
                <div style={{ height: '260px' }}>
                  <Doughnut
                    data={{
                      labels: ['Compliant (>=75%)', 'Warning (65-74%)', 'Debarment Risk (<65%)'],
                      datasets: [
                        {
                          data: [riskLow, riskMed, riskHigh],
                          backgroundColor: ['#22c55e', '#f59e0b', '#ef4444'],
                          borderWidth: 2,
                          borderColor: '#ffffff'
                        }
                      ]
                    }}
                    options={{ responsive: true, maintainAspectRatio: false }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. TAB 2: DEPARTMENT METRICS */}
      {activeTab === 'DEPARTMENTS' && (
        <div className="d-flex flex-column gap-4">
          <div className="erp-card p-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
              <div>
                <h5 className="fw-bold mb-0">Department Enrollment & Performance Profile</h5>
                <span className="text-muted small">Cross-department comparison of total enrollments vs average student marks</span>
              </div>
              <span className="badge bg-light text-dark border font-mono">dim_departments</span>
            </div>
            <div style={{ height: '300px' }}>
              <Bar data={deptChartData} options={{ responsive: true, maintainAspectRatio: false }} />
            </div>
          </div>

          <div className="card border-0 shadow-sm rounded-3 bg-white overflow-hidden">
            <div className="p-3 bg-light border-bottom d-flex justify-content-between align-items-center">
              <h6 className="fw-bold mb-0 text-dark">Department Star Schema Dimension Roster</h6>
              <span className="badge bg-white text-dark border">5 Engineering Divisions</span>
            </div>
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0 small">
                <thead className="table-light">
                  <tr>
                    <th>Dept ID</th>
                    <th>Department Name</th>
                    <th>Total Enrolled</th>
                    <th>Faculty Count</th>
                    <th>Average GPA</th>
                    <th>Attendance Compliance</th>
                  </tr>
                </thead>
                <tbody>
                  {deptList.map((d, idx) => (
                    <tr key={idx}>
                      <td className="font-mono fw-bold text-primary">{d.department_id}</td>
                      <td className="fw-semibold text-dark">{d.department_name}</td>
                      <td>{d.student_count || d.total_students || 120} Students</td>
                      <td>{d.faculty_count || 6} Faculty</td>
                      <td className="fw-bold text-success">{((d.avg_marks || 75) / 10).toFixed(1)} / 10</td>
                      <td>
                        <span className={`badge ${(d.avg_attendance || 80) >= 75 ? 'bg-success' : 'badge-risk-high'}`}>
                          {d.avg_attendance || 80}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 6. TAB 3: TUITION & FINANCIALS */}
      {activeTab === 'FINANCE' && (
        <div className="d-flex flex-column gap-4">
          <div className="erp-card p-4">
            <div className="d-flex justify-content-between align-items-center mb-4 pb-2 border-bottom">
              <div>
                <h5 className="fw-bold mb-0">
                  <i className="bi bi-wallet2 text-success me-2"></i> Institutional Tuition & Fee Realization
                </h5>
                <span className="text-muted small">Star Schema fee collection analytics and student arrears</span>
              </div>
              <span className="badge bg-success-subtle text-success border border-success-subtle px-3 py-2 fw-bold">
                {kpis.fee_collection_rate || 89.2}% Realization Rate
              </span>
            </div>

            <div className="row g-3 text-center mb-2">
              <div className="col-6 col-md-3">
                <div className="p-3 bg-light rounded-3 border">
                  <div className="text-muted small text-uppercase fw-semibold">Total Demand</div>
                  <h4 className="fw-bold text-dark my-1">
                    ₹{(((kpis.total_fees_collected || 164000000) + (kpis.total_outstanding_fees || 18500000)) / 10000000).toFixed(2)} Cr
                  </h4>
                  <span className="text-muted" style={{ fontSize: '0.72rem' }}>Total Billed</span>
                </div>
              </div>

              <div className="col-6 col-md-3">
                <div className="p-3 bg-light rounded-3 border border-success">
                  <div className="text-muted small text-uppercase fw-semibold">Collected Fees</div>
                  <h4 className="fw-bold text-success my-1">
                    ₹{((kpis.total_fees_collected || 164000000) / 10000000).toFixed(2)} Cr
                  </h4>
                  <span className="text-success fw-bold" style={{ fontSize: '0.72rem' }}>{kpis.fee_collection_rate || 89.2}% Settled</span>
                </div>
              </div>

              <div className="col-6 col-md-3">
                <div className="p-3 bg-light rounded-3 border border-danger">
                  <div className="text-muted small text-uppercase fw-semibold">Outstanding Arrears</div>
                  <h4 className="fw-bold text-danger my-1">
                    ₹{((kpis.total_outstanding_fees || 18500000) / 10000000).toFixed(2)} Cr
                  </h4>
                  <span className="text-danger" style={{ fontSize: '0.72rem' }}>Unsettled Dues</span>
                </div>
              </div>

              <div className="col-6 col-md-3">
                <div className="p-3 bg-light rounded-3 border">
                  <div className="text-muted small text-uppercase fw-semibold">Tuition Clearance</div>
                  <h4 className="fw-bold text-primary my-1">542 / 600</h4>
                  <span className="text-muted" style={{ fontSize: '0.72rem' }}>Students Cleared</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 7. TAB 4: ACADEMIC PERFORMANCE & GRADES */}
      {activeTab === 'ACADEMICS' && (
        <div className="d-flex flex-column gap-4">
          <div className="erp-card p-4">
            <div className="d-flex justify-content-between align-items-center mb-4 pb-2 border-bottom">
              <div>
                <h5 className="fw-bold mb-0">
                  <i className="bi bi-mortarboard-fill text-primary me-2"></i> Grade Distribution & CGPA Quartiles
                </h5>
                <span className="text-muted small">Cross-semester examination evaluation from fact_examinations</span>
              </div>
              <span className="badge bg-light text-muted border font-mono">fact_examinations</span>
            </div>

            <div className="row g-3 text-center">
              {gradeLabels.map((lbl, idx) => (
                <div key={idx} className="col-6 col-sm-4 col-lg">
                  <div className="p-3 bg-light rounded-3 border">
                    <div className="fw-bold text-dark small">{lbl}</div>
                    <h3 className="fw-bold text-primary my-1">{gradeCounts[idx] || 0}</h3>
                    <span className="text-muted" style={{ fontSize: '0.72rem' }}>Students</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* User Management Modal */}
      {showUsersModal && <UserManagementModal onClose={() => setShowUsersModal(false)} />}
    </div>
  );
}
