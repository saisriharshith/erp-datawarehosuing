import React, { useState, useEffect } from 'react';
import { fetchAPI } from '../services/api';

export default function FacultyDirectory() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deptFilter, setDeptFilter] = useState('');

  useEffect(() => {
    setLoading(true);
    let url = '/faculty/summary?';
    if (deptFilter) url += `department_id=${deptFilter}&`;

    fetchAPI(url)
      .then(res => setData(res))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [deptFilter]);

  if (loading || !data) {
    return (
      <div className="p-4 text-center py-5">
        <div className="spinner-border text-primary" role="status"></div>
        <p className="mt-2 text-muted small">Loading faculty directory...</p>
      </div>
    );
  }

  const list = data.faculty_list || [];

  return (
    <div className="p-3 p-md-4">
      {/* Header */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 gap-3">
        <div>
          <h4 className="fw-bold mb-1">Faculty & Academic Leadership (dim_faculty)</h4>
          <p className="text-muted small mb-0">Roster of professors, associate professors, and department heads.</p>
        </div>

        <select className="form-select form-select-sm w-auto" value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)}>
          <option value="">All Departments</option>
          <option value="DEPT_CSE">Computer Science</option>
          <option value="DEPT_ECE">Electronics</option>
          <option value="DEPT_MECH">Mechanical</option>
          <option value="DEPT_CIVIL">Civil</option>
          <option value="DEPT_AIDS">AI & Data Science</option>
        </select>
      </div>

      {/* Metric Cards */}
      <div className="row g-3 mb-4">
        <div className="col-4">
          <div className="metric-card text-center">
            <div className="text-muted small">Total Faculty</div>
            <h3 className="fw-bold my-1 text-primary">{data.total_faculty}</h3>
            <span className="badge bg-light text-muted border">Across Departments</span>
          </div>
        </div>
        <div className="col-4">
          <div className="metric-card text-center">
            <div className="text-muted small">Avg Workload</div>
            <h3 className="fw-bold my-1 text-success">{data.average_weekly_workload_hours} hrs/wk</h3>
            <span className="badge bg-light text-success border">Teaching & Labs</span>
          </div>
        </div>
        <div className="col-4">
          <div className="metric-card text-center">
            <div className="text-muted small">Avg Experience</div>
            <h3 className="fw-bold my-1 text-info">{data.average_experience_years} yrs</h3>
            <span className="badge bg-light text-info border">Senior Staff</span>
          </div>
        </div>
      </div>

      {/* Faculty Table */}
      <div className="metric-card">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0 small">
            <thead className="table-light">
              <tr>
                <th>Faculty ID</th>
                <th>Name</th>
                <th>Department</th>
                <th>Designation</th>
                <th>Experience</th>
                <th>Workload</th>
                <th>Email</th>
              </tr>
            </thead>
            <tbody>
              {list.map(f => (
                <tr key={f.faculty_id}>
                  <td className="font-mono fw-bold">{f.faculty_id}</td>
                  <td className="fw-semibold">{f.faculty_name}</td>
                  <td><span className="badge bg-light text-dark border">{f.department_name}</span></td>
                  <td>{f.designation}</td>
                  <td>{f.experience_years} years</td>
                  <td><span className="badge bg-light text-primary border">{f.workload_hours_per_week} hrs/wk</span></td>
                  <td className="text-muted">{f.email}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
