import React, { useState, useEffect } from 'react';
import { fetchAPI } from '../services/api';

export default function StudentsDirectory() {
  const [students, setStudents] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [riskFilter, setRiskFilter] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [studentProfile, setStudentProfile] = useState(null);

  const loadStudents = async () => {
    setLoading(true);
    let url = `/students?page=${page}&limit=20&search=${encodeURIComponent(search)}&`;
    if (deptFilter) url += `department_id=${deptFilter}&`;
    if (riskFilter) url += `risk_level=${riskFilter}&`;

    try {
      const data = await fetchAPI(url);
      setStudents(data.students || []);
      setTotal(data.total || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStudents();
  }, [page, deptFilter, riskFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    loadStudents();
  };

  const handleOpenProfile = async (stuId) => {
    setSelectedStudent(stuId);
    setProfileLoading(true);
    try {
      const res = await fetchAPI(`/students/${stuId}`);
      setStudentProfile(res);
    } catch (err) {
      console.error(err);
    } finally {
      setProfileLoading(false);
    }
  };

  return (
    <div className="p-3 p-md-4">
      {/* Header */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 gap-3">
        <div>
          <h4 className="fw-bold mb-1">Institutional Student Directory (dim_students)</h4>
          <p className="text-muted small mb-0">Browse consolidated 360-degree academic and behavioral student records.</p>
        </div>

        <span className="badge bg-light text-dark border p-2">Total Active Records: {total}</span>
      </div>

      {/* Search & Filters */}
      <div className="metric-card mb-4">
        <form onSubmit={handleSearchSubmit} className="row g-2 align-items-center">
          <div className="col-12 col-md-5">
            <div className="input-group input-group-sm">
              <span className="input-group-text bg-light"><i className="bi bi-search"></i></span>
              <input
                type="text"
                className="form-control"
                placeholder="Search by name, ID (e.g. STU20210001), or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="col-6 col-md-3">
            <select className="form-select form-select-sm" value={deptFilter} onChange={(e) => { setDeptFilter(e.target.value); setPage(1); }}>
              <option value="">All Departments</option>
              <option value="DEPT_CSE">Computer Science (CSE)</option>
              <option value="DEPT_ECE">Electronics (ECE)</option>
              <option value="DEPT_MECH">Mechanical (MECH)</option>
              <option value="DEPT_CIVIL">Civil (CIVIL)</option>
              <option value="DEPT_AIDS">AI & Data Science (AIDS)</option>
            </select>
          </div>

          <div className="col-6 col-md-2">
            <select className="form-select form-select-sm" value={riskFilter} onChange={(e) => { setRiskFilter(e.target.value); setPage(1); }}>
              <option value="">All Risk Levels</option>
              <option value="HIGH">High Risk</option>
              <option value="MEDIUM">Medium Risk</option>
              <option value="LOW">Low Risk</option>
            </select>
          </div>

          <div className="col-12 col-md-2 d-grid">
            <button type="submit" className="btn btn-sm btn-primary" style={{ background: '#4f46e5', borderColor: '#4f46e5' }}>
              Filter
            </button>
          </div>
        </form>
      </div>

      {/* Student Table */}
      <div className="metric-card">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0 small">
            <thead className="table-light">
              <tr>
                <th>Student ID</th>
                <th>Full Name</th>
                <th>Department</th>
                <th>Semester</th>
                <th>Attendance</th>
                <th>CGPA</th>
                <th>Risk Level</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" className="text-center py-4 text-muted">
                    <span className="spinner-border spinner-border-sm me-2"></span> Loading directory...
                  </td>
                </tr>
              ) : students.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center py-4 text-muted">No students matching criteria.</td>
                </tr>
              ) : (
                students.map(s => (
                  <tr key={s.student_id}>
                    <td className="font-mono fw-bold">{s.student_id}</td>
                    <td className="fw-semibold">{s.full_name}</td>
                    <td><span className="badge bg-light text-dark border">{s.department_name}</span></td>
                    <td>Sem {s.current_semester}</td>
                    <td>
                      <span className={`fw-semibold ${s.attendance_percentage >= 75 ? 'text-success' : 'text-danger'}`}>
                        {s.attendance_percentage}%
                      </span>
                    </td>
                    <td>{s.cgpa}</td>
                    <td>
                      <span className={`badge ${s.risk_level === 'HIGH' ? 'badge-risk-high' : s.risk_level === 'MEDIUM' ? 'badge-risk-med' : 'badge-risk-low'}`}>
                        {s.risk_level}
                      </span>
                    </td>
                    <td>
                      <button className="btn btn-sm btn-outline-primary py-0 px-2" style={{ fontSize: '0.75rem' }} onClick={() => handleOpenProfile(s.student_id)}>
                        View 360
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="d-flex justify-content-between align-items-center mt-3 pt-2 border-top small text-muted">
          <span>Showing {students.length} of {total} records</span>
          <div className="d-flex gap-2">
            <button className="btn btn-sm btn-outline-secondary" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Previous</button>
            <span className="align-self-center">Page {page}</span>
            <button className="btn btn-sm btn-outline-secondary" disabled={students.length < 20} onClick={() => setPage(p => p + 1)}>Next</button>
          </div>
        </div>
      </div>

      {/* 360 Student Modal */}
      {selectedStudent && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(15,23,42,0.6)' }} tabIndex="-1">
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content border-0 shadow-lg">
              <div className="modal-header bg-primary text-white" style={{ background: '#4f46e5' }}>
                <h5 className="modal-title fs-6"><i className="bi bi-person-badge-fill me-2"></i> Student 360 Profile: {selectedStudent}</h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setSelectedStudent(null)}></button>
              </div>
              <div className="modal-body p-4">
                {profileLoading || !studentProfile ? (
                  <div className="text-center py-4"><span className="spinner-border spinner-border-sm text-primary"></span> Loading profile...</div>
                ) : (
                  <div>
                    <div className="row g-3 mb-3 border-bottom pb-3">
                      <div className="col-md-6">
                        <h5 className="fw-bold mb-1">{studentProfile.student.full_name}</h5>
                        <div className="text-muted small">Email: {studentProfile.student.email}</div>
                        <div className="text-muted small">Department: {studentProfile.student.department_name}</div>
                      </div>
                      <div className="col-md-6 text-md-end">
                        <div><span className="badge bg-light text-dark border">Batch: {studentProfile.student.batch_year}</span></div>
                        <div className="mt-1"><span className={`badge ${studentProfile.risk_assessment.risk_level === 'HIGH' ? 'badge-risk-high' : 'badge-risk-low'}`}>Risk: {studentProfile.risk_assessment.risk_level}</span></div>
                      </div>
                    </div>

                    <div className="row g-2 text-center mb-3">
                      <div className="col-3">
                        <div className="p-2 bg-light rounded border">
                          <div className="text-muted small">Attendance</div>
                          <div className="fw-bold">{studentProfile.attendance.overall_percentage}%</div>
                        </div>
                      </div>
                      <div className="col-3">
                        <div className="p-2 bg-light rounded border">
                          <div className="text-muted small">CGPA</div>
                          <div className="fw-bold">{studentProfile.examinations.cgpa}</div>
                        </div>
                      </div>
                      <div className="col-3">
                        <div className="p-2 bg-light rounded border">
                          <div className="text-muted small">Backlogs</div>
                          <div className="fw-bold">{studentProfile.examinations.backlogs}</div>
                        </div>
                      </div>
                      <div className="col-3">
                        <div className="p-2 bg-light rounded border">
                          <div className="text-muted small">Fee Status</div>
                          <div className="fw-bold">{studentProfile.fees.status}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setSelectedStudent(null)}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
