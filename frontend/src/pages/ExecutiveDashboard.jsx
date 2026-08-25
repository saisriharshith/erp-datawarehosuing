import React, { useState, useEffect } from 'react';
import { fetchAPI } from '../services/api';
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

export default function ExecutiveDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deptFilter, setDeptFilter] = useState('');
  const [semFilter, setSemFilter] = useState('');

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
        <p className="mt-2 text-muted small">Loading institutional metrics...</p>
      </div>
    );
  }

  const kpi = data?.summary_kpis || {};
  const deptBreakdown = data?.department_breakdown || [];
  const grades = data?.grade_distribution || {};
  const monthlyAtt = data?.monthly_attendance_trend || [];

  // Chart 1: Department Attendance & Performance
  const deptChartData = {
    labels: deptBreakdown.map(d => d.department_name),
    datasets: [
      {
        label: 'Average Attendance (%)',
        data: deptBreakdown.map(d => d.avg_attendance),
        backgroundColor: '#4f46e5',
        borderRadius: 4
      },
      {
        label: 'Average Exam Score (%)',
        data: deptBreakdown.map(d => d.avg_marks),
        backgroundColor: '#0ea5e9',
        borderRadius: 4
      }
    ]
  };

  // Chart 2: Grade Distribution Doughnut
  const gradeChartData = {
    labels: Object.keys(grades),
    datasets: [
      {
        data: Object.values(grades),
        backgroundColor: ['#10b981', '#3b82f6', '#6366f1', '#8b5cf6', '#f59e0b', '#ec4899', '#ef4444'],
        borderWidth: 1
      }
    ]
  };

  // Chart 3: Longitudinal Attendance Trend
  const trendChartData = {
    labels: monthlyAtt.map(m => m.month),
    datasets: [
      {
        label: 'Campus Attendance (%)',
        data: monthlyAtt.map(m => m.attendance),
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        tension: 0.3,
        fill: true
      }
    ]
  };

  return (
    <div className="p-3 p-md-4">
      {/* Top Header & Filters */}
      <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between mb-4 gap-3">
        <div>
          <h4 className="fw-bold mb-1">Executive Institutional Command Center</h4>
          <p className="text-muted small mb-0">Consolidated analytics across academic dimensions, ML risk forecasting, and fee collections.</p>
        </div>

        <div className="d-flex align-items-center gap-2">
          <select className="form-select form-select-sm" value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)}>
            <option value="">All Departments (5)</option>
            <option value="DEPT_CSE">Computer Science (CSE)</option>
            <option value="DEPT_ECE">Electronics & Comm (ECE)</option>
            <option value="DEPT_MECH">Mechanical Engg (MECH)</option>
            <option value="DEPT_CIVIL">Civil Engg (CIVIL)</option>
            <option value="DEPT_AIDS">AI & Data Science (AI&DS)</option>
          </select>

          <select className="form-select form-select-sm" value={semFilter} onChange={(e) => setSemFilter(e.target.value)}>
            <option value="">All Semesters (1-8)</option>
            {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
              <option key={s} value={s}>Semester {s}</option>
            ))}
          </select>

          <button className="btn btn-sm btn-outline-secondary" onClick={loadData} title="Refresh Metrics">
            <i className="bi bi-arrow-clockwise"></i>
          </button>
        </div>
      </div>

      {/* 4 High-Level Metric Cards */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-sm-6 col-lg-3">
          <div className="metric-card">
            <div className="d-flex align-items-center justify-content-between text-muted mb-2">
              <span className="small fw-semibold text-uppercase">Total Students</span>
              <i className="bi bi-people fs-5 text-primary"></i>
            </div>
            <h3 className="fw-bold mb-1">{kpi.total_students?.toLocaleString()}</h3>
            <span className="badge bg-light text-success border"><i className="bi bi-check-circle me-1"></i>Active In DW</span>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-lg-3">
          <div className="metric-card">
            <div className="d-flex align-items-center justify-content-between text-muted mb-2">
              <span className="small fw-semibold text-uppercase">Avg Attendance</span>
              <i className="bi bi-calendar-check fs-5 text-success"></i>
            </div>
            <h3 className="fw-bold mb-1">{kpi.average_attendance}%</h3>
            <span className={`badge ${kpi.average_attendance >= 75 ? 'bg-light text-success border' : 'bg-light text-danger border'}`}>
              {kpi.average_attendance >= 75 ? 'Eligible Threshold' : 'Shortage Alert'}
            </span>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-lg-3">
          <div className="metric-card">
            <div className="d-flex align-items-center justify-content-between text-muted mb-2">
              <span className="small fw-semibold text-uppercase">High Risk Attrition</span>
              <i className="bi bi-exclamation-triangle fs-5 text-danger"></i>
            </div>
            <h3 className="fw-bold mb-1 text-danger">{kpi.high_risk_students_count}</h3>
            <span className="badge badge-risk-high">{Math.round((kpi.high_risk_students_count / (kpi.total_students || 1)) * 100)}% of Cohort</span>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-lg-3">
          <div className="metric-card">
            <div className="d-flex align-items-center justify-content-between text-muted mb-2">
              <span className="small fw-semibold text-uppercase">Data Quality Score</span>
              <i className="bi bi-shield-check fs-5 text-info"></i>
            </div>
            <h3 className="fw-bold mb-1 text-indigo">{kpi.data_quality_score}%</h3>
            <span className="badge bg-light text-success border">5 Dimensions Passed</span>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-lg-8">
          <div className="metric-card">
            <div className="d-flex align-items-center justify-content-between mb-3">
              <h6 className="fw-bold mb-0">Department Academic & Attendance Comparison</h6>
              <span className="badge bg-light text-dark border">Consolidated Star Schema</span>
            </div>
            <div style={{ height: '280px' }}>
              <Bar data={deptChartData} options={{ responsive: true, maintainAspectRatio: false }} />
            </div>
          </div>
        </div>

        <div className="col-12 col-lg-4">
          <div className="metric-card">
            <div className="d-flex align-items-center justify-content-between mb-3">
              <h6 className="fw-bold mb-0">Grade Distribution</h6>
              <span className="badge bg-light text-dark border">Exam Facts</span>
            </div>
            <div style={{ height: '280px' }}>
              <Doughnut data={gradeChartData} options={{ responsive: true, maintainAspectRatio: false }} />
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Table: Department Breakdown Drilldown */}
      <div className="metric-card">
        <div className="d-flex align-items-center justify-content-between mb-3">
          <h6 className="fw-bold mb-0">Department Operational Summary</h6>
          <span className="badge bg-light text-dark border">5 Engineering Departments</span>
        </div>

        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0 small">
            <thead className="table-light">
              <tr>
                <th>Department Name</th>
                <th>Student Strength</th>
                <th>Avg Attendance</th>
                <th>Avg Score</th>
                <th>High Risk Alert</th>
                <th>Compliance Status</th>
              </tr>
            </thead>
            <tbody>
              {deptBreakdown.map(d => (
                <tr key={d.department_id}>
                  <td className="fw-bold">{d.department_name}</td>
                  <td>{d.student_count} students</td>
                  <td>
                    <span className={`fw-semibold ${d.avg_attendance >= 75 ? 'text-success' : 'text-danger'}`}>
                      {d.avg_attendance}%
                    </span>
                  </td>
                  <td>{d.avg_marks}%</td>
                  <td>
                    <span className="badge badge-risk-high">{d.high_risk_count} critical</span>
                  </td>
                  <td>
                    <span className={`badge ${d.avg_attendance >= 75 ? 'bg-light text-success border' : 'bg-light text-warning text-dark border'}`}>
                      {d.avg_attendance >= 75 ? 'Satisfactory' : 'Intervention Needed'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
