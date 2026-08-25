import React, { useState, useEffect, useMemo } from 'react';
import { fetchAPI } from '../services/api';
import { useToast } from '../context/ToastContext';

export default function StudentsDirectory() {
  const { addToast } = useToast();
  const [students, setStudents] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [riskFilter, setRiskFilter] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [studentProfile, setStudentProfile] = useState(null);
  const [activeProfileTab, setActiveProfileTab] = useState('overview');

  // Debounced live search
  const [debouncedSearch, setDebouncedSearch] = useState(searchTerm);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1);
    }, 250);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  const loadStudents = async () => {
    setLoading(true);
    let url = `/students?page=${page}&limit=20&search=${encodeURIComponent(debouncedSearch)}&`;
    if (deptFilter) url += `department_id=${deptFilter}&`;
    if (riskFilter) url += `risk_level=${riskFilter}&`;

    try {
      const data = await fetchAPI(url);
      setStudents(data.students || []);
      setTotal(data.total || 0);
    } catch (err) {
      console.error(err);
      addToast('Error loading student records', 'danger');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStudents();
  }, [page, deptFilter, riskFilter, debouncedSearch]);

  const handleOpenProfile = async (stuId) => {
    setSelectedStudent(stuId);
    setProfileLoading(true);
    setActiveProfileTab('overview');
    try {
      const res = await fetchAPI(`/students/${stuId}`);
      setStudentProfile(res);
    } catch (err) {
      console.error(err);
      addToast(`Failed to load 360 profile for ${stuId}`, 'danger');
    } finally {
      setProfileLoading(false);
    }
  };

  const handleExportCSV = () => {
    if (!students.length) return;
    const headers = "Student_ID,Name,Department,Semester,Attendance,CGPA,Risk_Level,Email\n";
    const rows = students.map(s =>
      `"${s.student_id}","${s.full_name}","${s.department_name}","${s.current_semester}","${s.attendance_percentage}%","${s.cgpa}","${s.risk_level}","${s.email}"`
    ).join("\n");
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `students_master_export_page_${page}.csv`;
    link.click();
    addToast(`Exported ${students.length} student records to CSV`, 'success');
  };

  return (
    <div className="p-3 p-md-4">
      {/* Header */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 gap-3">
        <div>
          <h4 className="fw-bold mb-1">Students Master Directory (dim_students)</h4>
          <p className="text-muted small mb-0">Unified institutional registry with real-time academic 360 drilldown and debounced search.</p>
        </div>

        <div className="d-flex align-items-center gap-2">
          <span className="badge bg-light text-dark border p-2 font-mono">
            {total} Active Records
          </span>
          <button className="btn btn-sm btn-outline-success d-flex align-items-center gap-1 shadow-sm" onClick={handleExportCSV}>
            <i className="bi bi-file-earmark-spreadsheet-fill"></i>
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Live Search & Filter Bar */}
      <div className="metric-card mb-4">
        <div className="row g-2 align-items-center">
          <div className="col-12 col-md-5">
            <div className="input-group input-group-sm shadow-sm rounded overflow-hidden">
              <span className="input-group-text bg-white border-end-0"><i className="bi bi-search text-muted"></i></span>
              <input
                type="text"
                className="form-control border-start-0"
                placeholder="Type name, ID (e.g. STU20210001), or email to filter..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button className="btn btn-outline-secondary border-start-0" type="button" onClick={() => setSearchTerm('')}>
                  <i className="bi bi-x"></i>
                </button>
              )}
            </div>
          </div>

          <div className="col-6 col-md-4">
            <select className="form-select form-select-sm" value={deptFilter} onChange={(e) => { setDeptFilter(e.target.value); setPage(1); }}>
              <option value="">All 5 Departments</option>
              <option value="DEPT_CSE">Computer Science (CSE)</option>
              <option value="DEPT_ECE">Electronics & Comm (ECE)</option>
              <option value="DEPT_MECH">Mechanical Engg (MECH)</option>
              <option value="DEPT_CIVIL">Civil Engg (CIVIL)</option>
              <option value="DEPT_AIDS">AI & Data Science (AIDS)</option>
            </select>
          </div>

          <div className="col-6 col-md-3">
            <select className="form-select form-select-sm" value={riskFilter} onChange={(e) => { setRiskFilter(e.target.value); setPage(1); }}>
              <option value="">All Risk Tiers</option>
              <option value="HIGH">🔴 High Risk (&gt; 60%)</option>
              <option value="MEDIUM">🟡 Medium Risk (30-60%)</option>
              <option value="LOW">🟢 Low Risk (&lt; 30%)</option>
            </select>
          </div>
        </div>
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
                <th>Term</th>
                <th>Attendance</th>
                <th>CGPA</th>
                <th>Risk Standing</th>
                <th className="text-end">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" className="text-center py-5 text-muted">
                    <div className="spinner-border spinner-border-sm text-primary me-2" role="status"></div>
                    Querying MongoDB Warehouse records...
                  </td>
                </tr>
              ) : students.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center py-5 text-muted">
                    <i className="bi bi-inbox fs-3 d-block mb-1"></i>
                    No student records match the current filters.
                  </td>
                </tr>
              ) : (
                students.map(s => (
                  <tr key={s.student_id}>
                    <td className="font-mono fw-bold text-primary">{s.student_id}</td>
                    <td>
                      <div className="fw-semibold text-dark">{s.full_name}</div>
                      <div className="text-muted" style={{ fontSize: '0.72rem' }}>{s.email}</div>
                    </td>
                    <td><span className="badge bg-light text-dark border">{s.department_name}</span></td>
                    <td>Sem {s.current_semester}</td>
                    <td>
                      <span className={`fw-bold ${s.attendance_percentage >= 75 ? 'text-success' : 'text-danger'}`}>
                        {s.attendance_percentage}%
                      </span>
                    </td>
                    <td className="fw-bold font-mono">{s.cgpa}</td>
                    <td>
                      <span className={`badge ${s.risk_level === 'HIGH' ? 'badge-risk-high' : s.risk_level === 'MEDIUM' ? 'badge-risk-med' : 'badge-risk-low'}`}>
                        {s.risk_level}
                      </span>
                    </td>
                    <td className="text-end">
                      <button
                        className="btn btn-sm btn-outline-primary py-1 px-3 shadow-sm rounded-pill"
                        style={{ fontSize: '0.75rem' }}
                        onClick={() => handleOpenProfile(s.student_id)}
                      >
                        <i className="bi bi-person-badge me-1"></i> 360 View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="d-flex justify-content-between align-items-center mt-3 pt-3 border-top small text-muted">
          <span>Showing {students.length} of {total} records (Page {page})</span>
          <div className="d-flex gap-2">
            <button
              className="btn btn-sm btn-outline-secondary"
              disabled={page <= 1 || loading}
              onClick={() => setPage(p => p - 1)}
            >
              <i className="bi bi-chevron-left"></i> Previous
            </button>
            <button
              className="btn btn-sm btn-outline-secondary"
              disabled={students.length < 20 || loading}
              onClick={() => setPage(p => p + 1)}
            >
              Next <i className="bi bi-chevron-right"></i>
            </button>
          </div>
        </div>
      </div>

      {/* Comprehensive 360 Student Drilldown Modal */}
      {selectedStudent && (
        <div
          className="modal show d-block"
          style={{ backgroundColor: 'rgba(15,23,42,0.65)', backdropFilter: 'blur(6px)' }}
          tabIndex="-1"
        >
          <div className="modal-dialog modal-dialog-centered modal-xl modal-dialog-scrollable">
            <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
              {/* Modal Header */}
              <div className="modal-header bg-dark text-white p-3 px-4">
                <div className="d-flex align-items-center gap-2">
                  <span className="fs-5 text-warning"><i className="bi bi-person-bounding-box"></i></span>
                  <div>
                    <h5 className="modal-title fs-6 fw-bold mb-0">
                      Student 360 Profile: {studentProfile?.student?.full_name || selectedStudent}
                    </h5>
                    <span className="text-white-50" style={{ fontSize: '0.75rem' }}>
                      Registration: <span className="font-mono text-white">{selectedStudent}</span> | Batch {studentProfile?.student?.batch_year || '2021-2025'}
                    </span>
                  </div>
                </div>
                <button type="button" className="btn-close btn-close-white" onClick={() => setSelectedStudent(null)}></button>
              </div>

              {/* Modal Body with Tabs */}
              <div className="modal-body p-4 bg-light">
                {profileLoading || !studentProfile ? (
                  <div className="text-center py-5">
                    <div className="spinner-border text-primary" role="status"></div>
                    <p className="mt-2 text-muted small">Loading multi-fact student records...</p>
                  </div>
                ) : (
                  <div>
                    {/* Top KPI Banner */}
                    <div className="row g-2 mb-3 text-center">
                      <div className="col-3">
                        <div className="p-3 bg-white rounded-3 border shadow-sm">
                          <div className="text-muted small">Attendance Compliance</div>
                          <h4 className={`fw-bold mb-0 ${studentProfile.attendance.overall_percentage >= 75 ? 'text-success' : 'text-danger'}`}>
                            {studentProfile.attendance.overall_percentage}%
                          </h4>
                          <span className="badge bg-light text-muted border mt-1" style={{ fontSize: '0.7rem' }}>
                            {studentProfile.attendance.is_eligible ? 'Eligible' : 'Debarment Risk'}
                          </span>
                        </div>
                      </div>
                      <div className="col-3">
                        <div className="p-3 bg-white rounded-3 border shadow-sm">
                          <div className="text-muted small">Cumulative CGPA</div>
                          <h4 className="fw-bold text-primary mb-0">{studentProfile.examinations.cgpa} / 10</h4>
                          <span className="badge bg-light text-muted border mt-1" style={{ fontSize: '0.7rem' }}>
                            Backlogs: {studentProfile.examinations.backlogs}
                          </span>
                        </div>
                      </div>
                      <div className="col-3">
                        <div className="p-3 bg-white rounded-3 border shadow-sm">
                          <div className="text-muted small">Tuition Fee Status</div>
                          <h4 className="fw-bold mb-0 text-dark">{studentProfile.fees.status}</h4>
                          <span className="badge bg-light text-muted border mt-1" style={{ fontSize: '0.7rem' }}>
                            Due: ₹{studentProfile.fees.outstanding_balance?.toLocaleString()}
                          </span>
                        </div>
                      </div>
                      <div className="col-3">
                        <div className="p-3 bg-white rounded-3 border shadow-sm">
                          <div className="text-muted small">Risk Classification</div>
                          <h4 className="fw-bold mb-0">{studentProfile.risk_assessment.risk_level}</h4>
                          <span className={`badge mt-1 ${studentProfile.risk_assessment.risk_level === 'HIGH' ? 'badge-risk-high' : 'badge-risk-low'}`} style={{ fontSize: '0.7rem' }}>
                            {(studentProfile.risk_assessment.risk_score * 100).toFixed(0)}% Risk Index
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Navigation Pills */}
                    <ul className="nav nav-pills mb-3 gap-2">
                      <li className="nav-item">
                        <button
                          className={`nav-link btn-sm py-1 px-3 rounded-pill ${activeProfileTab === 'overview' ? 'active' : 'bg-white text-muted border'}`}
                          onClick={() => setActiveProfileTab('overview')}
                        >
                          Overview & Risk
                        </button>
                      </li>
                      <li className="nav-item">
                        <button
                          className={`nav-link btn-sm py-1 px-3 rounded-pill ${activeProfileTab === 'attendance' ? 'active' : 'bg-white text-muted border'}`}
                          onClick={() => setActiveProfileTab('attendance')}
                        >
                          Course Attendance ({studentProfile.attendance.subject_records?.length || 0})
                        </button>
                      </li>
                      <li className="nav-item">
                        <button
                          className={`nav-link btn-sm py-1 px-3 rounded-pill ${activeProfileTab === 'exams' ? 'active' : 'bg-white text-muted border'}`}
                          onClick={() => setActiveProfileTab('exams')}
                        >
                          Examination Grades ({studentProfile.examinations.exam_records?.length || 0})
                        </button>
                      </li>
                      <li className="nav-item">
                        <button
                          className={`nav-link btn-sm py-1 px-3 rounded-pill ${activeProfileTab === 'fees' ? 'active' : 'bg-white text-muted border'}`}
                          onClick={() => setActiveProfileTab('fees')}
                        >
                          Fee Transactions ({studentProfile.fees.transactions?.length || 0})
                        </button>
                      </li>
                    </ul>

                    {/* Tab 1: Overview & Risk */}
                    {activeProfileTab === 'overview' && (
                      <div className="bg-white p-3 rounded-3 border">
                        <div className="row g-3">
                          <div className="col-md-6">
                            <h6 className="fw-bold mb-2">Student Demographics (dim_students)</h6>
                            <ul className="list-group list-group-flush small">
                              <li className="list-group-item px-0 d-flex justify-content-between">
                                <span className="text-muted">Department:</span>
                                <span className="fw-semibold">{studentProfile.student.department_name}</span>
                              </li>
                              <li className="list-group-item px-0 d-flex justify-content-between">
                                <span className="text-muted">Current Term:</span>
                                <span className="fw-semibold">Semester {studentProfile.student.current_semester}</span>
                              </li>
                              <li className="list-group-item px-0 d-flex justify-content-between">
                                <span className="text-muted">Admission Quota:</span>
                                <span className="fw-semibold">{studentProfile.student.admission_quota || 'Merit'}</span>
                              </li>
                              <li className="list-group-item px-0 d-flex justify-content-between">
                                <span className="text-muted">Contact Email:</span>
                                <span className="fw-semibold font-mono">{studentProfile.student.email}</span>
                              </li>
                            </ul>
                          </div>
                          <div className="col-md-6">
                            <h6 className="fw-bold mb-2">Predictive Academic Risk Factors</h6>
                            <div className="p-3 bg-light rounded-3 border small">
                              <div className="mb-2"><strong>ML Risk Standing:</strong> <span className={`badge ms-1 ${studentProfile.risk_assessment.risk_level === 'HIGH' ? 'badge-risk-high' : 'badge-risk-low'}`}>{studentProfile.risk_assessment.risk_level}</span></div>
                              <div className="text-muted mb-2">Identified Warning Indicators:</div>
                              <ul className="mb-0 ps-3">
                                {(studentProfile.risk_assessment.risk_factors || []).map((f, i) => (
                                  <li key={i} className="text-muted">{f}</li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Tab 2: Course Attendance */}
                    {activeProfileTab === 'attendance' && (
                      <div className="bg-white p-3 rounded-3 border">
                        <table className="table table-sm table-hover align-middle mb-0 small">
                          <thead className="table-light">
                            <tr>
                              <th>Course ID</th>
                              <th>Conducted</th>
                              <th>Attended</th>
                              <th>Percentage</th>
                              <th>Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(studentProfile.attendance.subject_records || []).map((a, i) => (
                              <tr key={i}>
                                <td className="font-mono fw-bold">{a.subject_id}</td>
                                <td>{a.total_classes}</td>
                                <td>{a.classes_attended}</td>
                                <td>
                                  <div className="d-flex align-items-center gap-2">
                                    <div className="progress flex-grow-1" style={{ height: '5px' }}>
                                      <div className={`progress-bar ${a.attendance_percentage >= 75 ? 'bg-success' : 'bg-danger'}`} style={{ width: `${a.attendance_percentage}%` }}></div>
                                    </div>
                                    <span className="fw-bold">{a.attendance_percentage}%</span>
                                  </div>
                                </td>
                                <td>
                                  <span className={`badge ${a.attendance_percentage >= 75 ? 'bg-light text-success border' : 'badge-risk-high'}`}>
                                    {a.status || (a.attendance_percentage >= 75 ? 'Adequate' : 'Shortage')}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {/* Tab 3: Examinations */}
                    {activeProfileTab === 'exams' && (
                      <div className="bg-white p-3 rounded-3 border">
                        <table className="table table-sm table-hover align-middle mb-0 small">
                          <thead className="table-light">
                            <tr>
                              <th>Course ID</th>
                              <th>Internal (30)</th>
                              <th>End-Sem (70)</th>
                              <th>Total (100)</th>
                              <th>Grade</th>
                              <th>Result</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(studentProfile.examinations.exam_records || []).map((e, i) => (
                              <tr key={i}>
                                <td className="font-mono fw-bold">{e.subject_id}</td>
                                <td>{e.internal_marks_scored}</td>
                                <td>{e.end_semester_marks_scored}</td>
                                <td className="fw-bold">{e.total_marks}</td>
                                <td><span className="badge bg-light text-dark border font-mono">{e.grade_letter}</span></td>
                                <td>
                                  <span className={`badge ${e.is_passed ? 'bg-success' : 'bg-danger'}`}>
                                    {e.is_passed ? 'PASSED' : 'FAILED'}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {/* Tab 4: Fees */}
                    {activeProfileTab === 'fees' && (
                      <div className="bg-white p-3 rounded-3 border">
                        <table className="table table-sm table-hover align-middle mb-0 small">
                          <thead className="table-light">
                            <tr>
                              <th>Transaction ID</th>
                              <th>Term</th>
                              <th>Total Due</th>
                              <th>Remitted</th>
                              <th>Balance</th>
                              <th>Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(studentProfile.fees.transactions || []).map((f, i) => (
                              <tr key={i}>
                                <td className="font-mono">{f.transaction_id}</td>
                                <td>Sem {f.semester}</td>
                                <td>₹{f.total_due?.toLocaleString()}</td>
                                <td className="text-success fw-semibold">₹{f.total_paid?.toLocaleString()}</td>
                                <td className="text-danger fw-semibold">₹{f.outstanding_balance?.toLocaleString()}</td>
                                <td>
                                  <span className={`badge ${f.payment_status === 'PAID' ? 'bg-light text-success border' : 'bg-light text-danger border'}`}>
                                    {f.payment_status}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="modal-footer bg-white p-3">
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setSelectedStudent(null)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
