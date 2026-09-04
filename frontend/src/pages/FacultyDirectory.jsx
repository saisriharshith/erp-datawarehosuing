import React, { useState, useEffect } from 'react';
import { fetchAPI } from '../services/api';

export default function FacultyDirectory() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deptFilter, setDeptFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFacultyModal, setSelectedFacultyModal] = useState(null);

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
  const filteredList = list.filter(f =>
    f.faculty_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.faculty_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.department_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.designation.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-3 p-md-4">
      {/* Header */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 gap-3">
        <div>
          <div className="d-flex align-items-center gap-2 mb-1">
            <h4 className="fw-bold mb-0">University Faculty & Teaching Directorate</h4>
            <span className="badge bg-primary text-white">All Faculty Directory</span>
          </div>
          <p className="text-muted small mb-0">Institutional roster of professors, associate professors, and department heads across all 5 disciplines.</p>
        </div>

        <div className="d-flex gap-2">
          <input
            type="text"
            className="form-control form-control-sm"
            placeholder="Search faculty by name, dept..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ minWidth: '220px' }}
          />

          <select className="form-select form-select-sm w-auto" value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)}>
            <option value="">All Departments</option>
            <option value="DEPT_CSE">Computer Science (CSE)</option>
            <option value="DEPT_ECE">Electronics (ECE)</option>
            <option value="DEPT_MECH">Mechanical (MECH)</option>
            <option value="DEPT_CIVIL">Civil (CIVIL)</option>
            <option value="DEPT_AIDS">AI & Data Science (AIDS)</option>
          </select>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-sm-6 col-lg-3">
          <div className="erp-stat-card">
            <div className="text-muted small">Total Faculty Staff</div>
            <h3 className="fw-bold my-1 text-primary">{data.total_faculty || 30}</h3>
            <span className="badge bg-light text-muted border">Across 5 Departments</span>
          </div>
        </div>
        <div className="col-12 col-sm-6 col-lg-3">
          <div className="erp-stat-card">
            <div className="text-muted small">Biometric Punctuality</div>
            <h3 className="fw-bold my-1 text-success">{data.average_faculty_attendance || 95.8}%</h3>
            <span className="badge bg-light text-success border">Faculty Attendance</span>
          </div>
        </div>
        <div className="col-12 col-sm-6 col-lg-3">
          <div className="erp-stat-card">
            <div className="text-muted small">Avg Weekly Workload</div>
            <h3 className="fw-bold my-1 text-info">{data.average_weekly_workload_hours || 16.0} hrs/wk</h3>
            <span className="badge bg-light text-info border">Teaching & Labs</span>
          </div>
        </div>
        <div className="col-12 col-sm-6 col-lg-3">
          <div className="erp-stat-card">
            <div className="text-muted small">Research Publications</div>
            <h3 className="fw-bold my-1">{data.total_research_publications || 128} Papers</h3>
            <span className="badge bg-light text-muted border">Scopus / IEEE Indexed</span>
          </div>
        </div>
      </div>

      {/* Faculty Table (All Faculty) */}
      <div className="erp-card">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h6 className="fw-bold mb-0"><i className="bi bi-people-fill text-primary me-2"></i> All University Faculty Staff ({filteredList.length})</h6>
          <span className="text-muted small">Click any faculty member to inspect handled courses and department student roster.</span>
        </div>

        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0 small">
            <thead className="table-light">
              <tr>
                <th>Faculty ID</th>
                <th>Faculty Name</th>
                <th>Department</th>
                <th>Designation</th>
                <th>Biometric Attendance</th>
                <th>Weekly Workload</th>
                <th>Research Papers</th>
                <th className="text-end">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredList.map(f => (
                <tr key={f.faculty_id} style={{ cursor: 'pointer' }} onClick={() => setSelectedFacultyModal(f)}>
                  <td className="font-mono fw-bold text-primary">{f.faculty_id}</td>
                  <td>
                    <div className="fw-semibold" style={{ color: 'var(--erp-text)' }}>{f.faculty_name}</div>
                    <div className="text-muted" style={{ fontSize: '0.72rem' }}>{f.email}</div>
                  </td>
                  <td><span className="badge bg-body-secondary text-body border">{f.department_name}</span></td>
                  <td>{f.designation}</td>
                  <td>
                    <span className={`badge ${f.attendance_percentage >= 94 ? 'bg-light text-success border' : 'bg-light text-warning border'}`}>
                      {f.attendance_percentage}% ({f.biometric_status})
                    </span>
                  </td>
                  <td><span className="badge bg-light text-primary border">{f.workload_hours_per_week} hrs/wk</span></td>
                  <td><span className="badge bg-body-secondary text-body border">{f.research_publications} papers</span></td>
                  <td className="text-end">
                    <button
                      className="btn btn-sm btn-outline-primary py-1 px-2 rounded-pill"
                      style={{ fontSize: '0.72rem' }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedFacultyModal(f);
                      }}
                    >
                      <i className="bi bi-eye me-1"></i> View Students Roster
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detailed Faculty Teaching & Enrolled Students Modal */}
      {selectedFacultyModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(15,23,42,0.65)', backdropFilter: 'blur(6px)' }} tabIndex="-1">
          <div className="modal-dialog modal-dialog-centered modal-lg modal-dialog-scrollable">
            <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
              <div className="modal-header bg-dark text-white p-3 px-4">
                <div>
                  <h5 className="modal-title fs-6 fw-bold mb-0">
                    <i className="bi bi-person-video3 text-warning me-2"></i>
                    {selectedFacultyModal.faculty_name} ({selectedFacultyModal.department_name})
                  </h5>
                  <span className="text-white-50 small">{selectedFacultyModal.designation} | ID: {selectedFacultyModal.faculty_id}</span>
                </div>
                <button type="button" className="btn-close btn-close-white" onClick={() => setSelectedFacultyModal(null)}></button>
              </div>

              <div className="modal-body p-4 bg-body-tertiary">
                {/* Faculty Metrics Summary */}
                <div className="row g-2 text-center small mb-3">
                  <div className="col-4">
                    <div className="erp-card p-2 text-center">
                      <div className="text-muted">Biometric Attendance</div>
                      <div className="fw-bold text-success fs-6">{selectedFacultyModal.attendance_percentage}%</div>
                    </div>
                  </div>
                  <div className="col-4">
                    <div className="erp-card p-2 text-center">
                      <div className="text-muted">Teaching Workload</div>
                      <div className="fw-bold text-primary fs-6">{selectedFacultyModal.workload_hours_per_week} hrs/wk</div>
                    </div>
                  </div>
                  <div className="col-4">
                    <div className="erp-card p-2 text-center">
                      <div className="text-muted">Department Advisees</div>
                      <div className="fw-bold text-info fs-6">{selectedFacultyModal.advisees_count} Students</div>
                    </div>
                  </div>
                </div>

                {/* Handled Courses & Enrolled Students */}
                <h6 className="fw-bold mb-2"><i className="bi bi-book-half text-primary me-1"></i> Handled Teaching Courses & Enrolled {selectedFacultyModal.department_name} Students:</h6>

                {(selectedFacultyModal.handled_courses || []).map((course, cIdx) => (
                  <div key={cIdx} className="erp-card mb-3">
                    <div className="d-flex justify-content-between align-items-center mb-2 pb-2 border-bottom">
                      <div>
                        <strong className="text-primary font-mono">{course.course_code}</strong> - <strong>{course.course_title}</strong> ({course.section})
                        <div className="text-muted small">Schedule: {course.class_schedule} | Room: {course.classroom}</div>
                      </div>
                      <span className="badge bg-light text-success border">Avg Attendance: {course.average_attendance}%</span>
                    </div>

                    {/* Students List in this Course */}
                    <div className="table-responsive">
                      <table className="table table-sm table-hover align-middle mb-0" style={{ fontSize: '0.75rem' }}>
                        <thead className="table-light">
                          <tr>
                            <th>Student ID</th>
                            <th>Student Name</th>
                            <th>Department</th>
                            <th>Section</th>
                            <th>Attendance</th>
                            <th>Internals (30)</th>
                            <th>Standing</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(course.students || []).map(stu => (
                            <tr key={stu.student_id}>
                              <td className="font-mono fw-bold">{stu.student_id}</td>
                              <td className="fw-semibold">{stu.student_name}</td>
                              <td><span className="badge bg-body-secondary text-body border">{stu.department_name || selectedFacultyModal.department_name}</span></td>
                              <td>{stu.section}</td>
                              <td>
                                <span className={`fw-bold ${stu.attendance_percentage >= 75 ? 'text-success' : 'text-danger'}`}>
                                  {stu.attendance_percentage}%
                                </span>
                              </td>
                              <td><strong>{stu.internal_marks}</strong> / 30</td>
                              <td>
                                <span className={`badge ${stu.attendance_percentage >= 75 ? 'bg-light text-success border' : 'badge-risk-high'}`}>
                                  {stu.attendance_percentage >= 75 ? 'Good' : 'Shortage'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>

              <div className="modal-footer p-3">
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setSelectedFacultyModal(null)}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
