import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { fetchAPI } from '../services/api';

export default function FacultyPortal() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const isDean = user?.role === 'ADMIN';

  // For faculty members, lock strictly to their department (e.g. DEPT_CSE)
  const facultyDept = user?.department_id || (isDean ? '' : 'DEPT_CSE');
  const [deptFilter, setDeptFilter] = useState(facultyDept);

  const [facultySummary, setFacultySummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedFacultyId, setSelectedFacultyId] = useState(user?.faculty_id || '');
  const [selectedCourseIndex, setSelectedCourseIndex] = useState(0);

  // Workflow Tabs
  const [activeTab, setActiveTab] = useState('ROSTER'); // 'ROSTER' | 'WHAT_IF' | 'EARLY_WARNING' | 'ATTENDANCE_TAKER' | 'GRADING'

  // Selected Student for Modals
  const [selectedStudentForWarning, setSelectedStudentForWarning] = useState(null);
  const [selectedStudentDetail, setSelectedStudentDetail] = useState(null);

  // Faculty What-If Simulation State
  const [whatIfStudent, setWhatIfStudent] = useState(null);
  const [simAttendance, setSimAttendance] = useState(58);
  const [simInternals, setSimInternals] = useState(14);
  const [simBacklogs, setSimBacklogs] = useState(1);
  const [simulatedRisk, setSimulatedRisk] = useState('MEDIUM');

  // Daily Attendance Marker State
  const [attendanceDate, setAttendanceDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [dailyAttendanceMap, setDailyAttendanceMap] = useState({});

  // Editable Internal Marks State
  const [editingMarks, setEditingMarks] = useState({});

  // Advisee Mentorship Logs
  const [mentorshipLogs, setMentorshipLogs] = useState(() => {
    try {
      const saved = localStorage.getItem('FACULTY_MENTORSHIP_LOGS');
      return saved ? JSON.parse(saved) : [
        {
          id: 1,
          faculty_name: 'Dr. Rajeshwar Rao',
          student_id: 'STU20210016',
          student_name: 'Shaurya Joshi',
          course_code: 'CS501',
          date: '2026-08-24',
          topic: 'Attendance Shortage & Lab Make-up',
          action: 'Agreed to attend 4 Saturday make-up laboratory sessions.',
          status: 'IN_PROGRESS'
        }
      ];
    } catch {
      return [];
    }
  });

  const [newLog, setNewLog] = useState({ student_id: '', student_name: '', course_code: '', topic: '', action: '' });
  const [showLogModal, setShowLogModal] = useState(false);

  useEffect(() => {
    if (!isDean && user?.department_id) {
      setDeptFilter(user.department_id);
    }
  }, [user, isDean]);

  useEffect(() => {
    setLoading(true);
    let url = '/faculty/summary?';
    if (deptFilter) url += `department_id=${deptFilter}&`;

    fetchAPI(url)
      .then(res => {
        setFacultySummary(res);
        const list = res.faculty_list || [];
        if (list.length > 0) {
          const match = list.find(f => f.faculty_id === user?.faculty_id || f.email === user?.email);
          setSelectedFacultyId(match ? match.faculty_id : list[0].faculty_id);
        }
      })
      .catch(err => {
        console.error(err);
        addToast('Failed to load department faculty records', 'danger');
      })
      .finally(() => setLoading(false));
  }, [deptFilter, user]);

  const facultyList = facultySummary?.faculty_list || [];
  const currentFaculty = facultyList.find(f => f.faculty_id === selectedFacultyId) || facultyList[0] || {};
  const handledCourses = currentFaculty.handled_courses || [];
  const activeCourse = handledCourses[selectedCourseIndex] || handledCourses[0] || {};
  const enrolledStudents = activeCourse.students || [];

  // Attendance Distribution Buckets (90-100%, 75-89%, 60-74%, <60%)
  const bucket90_100 = enrolledStudents.filter(s => s.attendance_percentage >= 90).length;
  const bucket75_89 = enrolledStudents.filter(s => s.attendance_percentage >= 75 && s.attendance_percentage < 90).length;
  const bucket60_74 = enrolledStudents.filter(s => s.attendance_percentage >= 60 && s.attendance_percentage < 75).length;
  const bucketBelow60 = enrolledStudents.filter(s => s.attendance_percentage < 60).length;

  // Risk Distribution Buckets
  const highRiskStudents = enrolledStudents.filter(s => s.risk_level === 'HIGH' || s.attendance_percentage < 65);
  const medRiskStudents = enrolledStudents.filter(s => s.risk_level === 'MEDIUM' || (s.attendance_percentage >= 65 && s.attendance_percentage < 75));
  const lowRiskStudents = enrolledStudents.filter(s => s.risk_level === 'LOW' && s.attendance_percentage >= 75);

  // Initialize What-If target when active course changes
  useEffect(() => {
    if (enrolledStudents.length > 0) {
      const firstTarget = highRiskStudents[0] || enrolledStudents[0];
      setWhatIfStudent(firstTarget);
      setSimAttendance(firstTarget.attendance_percentage || 58);
      setSimInternals(firstTarget.internal_marks || 14);
      setSimBacklogs(firstTarget.is_shortage ? 1 : 0);

      const initialMap = {};
      const marksMap = {};
      enrolledStudents.forEach(s => {
        initialMap[s.student_id] = 'PRESENT';
        marksMap[s.student_id] = s.internal_marks;
      });
      setDailyAttendanceMap(initialMap);
      setEditingMarks(marksMap);
    }
  }, [selectedCourseIndex, selectedFacultyId, facultySummary]);

  // Recalculate What-If Simulation
  useEffect(() => {
    let score = 0;
    if (simAttendance < 65) score += 40;
    else if (simAttendance < 75) score += 20;

    if (simInternals < 15) score += 35;
    else if (simInternals < 20) score += 15;

    if (simBacklogs > 0) score += 25;

    if (score >= 50) setSimulatedRisk('HIGH');
    else if (score >= 25) setSimulatedRisk('MEDIUM');
    else setSimulatedRisk('LOW');
  }, [simAttendance, simInternals, simBacklogs]);

  const handleMarkAll = (status) => {
    const updated = {};
    enrolledStudents.forEach(s => {
      updated[s.student_id] = status;
    });
    setDailyAttendanceMap(updated);
    addToast(`Marked all ${enrolledStudents.length} students as ${status}`, 'info');
  };

  const handleSaveDailyAttendance = () => {
    const presentCount = Object.values(dailyAttendanceMap).filter(v => v === 'PRESENT').length;
    addToast(`Saved attendance for ${presentCount}/${enrolledStudents.length} students on ${attendanceDate}`, 'success');
    setActiveTab('ROSTER');
  };

  const handleSaveMarks = () => {
    addToast(`Updated internal assessment scores for ${activeCourse.course_code} (${activeCourse.section})`, 'success');
    setActiveTab('ROSTER');
  };

  const handleDispatchWarning = (stu) => {
    addToast(`Official Attendance Notice dispatched to ${stu.student_name} (${stu.email}) for ${activeCourse.course_code}`, 'success');
    setSelectedStudentForWarning(null);
  };

  const handleSaveLog = (e) => {
    e.preventDefault();
    if (!newLog.student_id || !newLog.topic) {
      addToast('Please fill in required student ID and topic', 'warning');
      return;
    }

    const entry = {
      id: Date.now(),
      faculty_name: currentFaculty.faculty_name || user?.name || 'Faculty Member',
      student_id: newLog.student_id,
      student_name: newLog.student_name || 'Advisee Student',
      course_code: newLog.course_code || activeCourse.course_code || 'GEN101',
      date: new Date().toISOString().split('T')[0],
      topic: newLog.topic,
      action: newLog.action || 'Counseling notes recorded.',
      status: 'OPEN'
    };

    const updated = [entry, ...mentorshipLogs];
    setMentorshipLogs(updated);
    localStorage.setItem('FACULTY_MENTORSHIP_LOGS', JSON.stringify(updated));
    addToast(`Counseling note recorded for ${entry.student_name}`, 'success');
    setNewLog({ student_id: '', student_name: '', course_code: '', topic: '', action: '' });
    setShowLogModal(false);
  };

  if (loading && !facultySummary) {
    return (
      <div className="p-4 text-center py-5">
        <div className="spinner-border text-primary" role="status"></div>
        <p className="mt-2 text-muted small">Loading Department Academic Portal...</p>
      </div>
    );
  }

  return (
    <div className="p-3 p-md-4">
      {/* 1. Header Banner */}
      <div className="p-4 rounded-4 text-white mb-4 shadow-sm" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)' }}>
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
          <div>
            <span className="badge bg-info text-dark mb-2 fw-semibold">
              <i className="bi bi-people-fill me-1"></i> Department Academic Portal ("How Are My Students Doing?")
            </span>
            <h3 className="fw-bold mb-1">Welcome, {currentFaculty.faculty_name || 'Dr. Sunita Rao'}</h3>
            <div className="d-flex flex-wrap gap-2 text-white-50 small mt-2">
              <span><strong>Department:</strong> <span className="text-white">{currentFaculty.department_name}</span></span>
              <span>•</span>
              <span><strong>Assigned Courses:</strong> <span className="text-white">{handledCourses.map(c => c.course_code).join(', ')}</span></span>
              <span>•</span>
              <span><strong>Total Students:</strong> <span className="text-white">{enrolledStudents.length * handledCourses.length || 120}</span></span>
              <span>•</span>
              <span><strong>Average Attendance:</strong> <span className="text-white">{activeCourse.average_attendance || 78.4}%</span></span>
              <span>•</span>
              <span><strong>Below 75%:</strong> <span className="badge badge-risk-high">{activeCourse.shortage_alerts_count || 12} Students</span></span>
            </div>
          </div>

          <div className="d-flex gap-2">
            <button className="btn btn-light btn-sm fw-semibold shadow-sm" onClick={() => setShowLogModal(true)}>
              <i className="bi bi-journal-plus text-primary me-1"></i> Log Mentoring Session
            </button>
          </div>
        </div>
      </div>

      {/* Dean Faculty Switcher (If logged in as Dean/Admin) */}
      {isDean && (
        <div className="metric-card mb-4 bg-white border-primary shadow-sm">
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
            <div>
              <span className="badge bg-primary text-white mb-1"><i className="bi bi-shield-lock-fill me-1"></i> Dean Inspection View</span>
              <h6 className="fw-bold mb-0">Select Department & Faculty to Inspect Assigned Courses</h6>
            </div>

            <div className="d-flex gap-2">
              <select
                className="form-select form-select-sm"
                value={deptFilter}
                onChange={(e) => { setDeptFilter(e.target.value); setSelectedCourseIndex(0); }}
              >
                <option value="">All Departments ({facultySummary?.total_faculty || 30} Faculty)</option>
                <option value="DEPT_CSE">Computer Science (CSE)</option>
                <option value="DEPT_ECE">Electronics (ECE)</option>
                <option value="DEPT_MECH">Mechanical (MECH)</option>
                <option value="DEPT_CIVIL">Civil (CIVIL)</option>
                <option value="DEPT_AIDS">AI & Data Science (AIDS)</option>
              </select>

              <select
                className="form-select form-select-sm"
                value={selectedFacultyId}
                onChange={(e) => { setSelectedFacultyId(e.target.value); setSelectedCourseIndex(0); }}
              >
                {facultyList.map(f => (
                  <option key={f.faculty_id} value={f.faculty_id}>
                    {f.faculty_name} ({f.designation})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* 2. Course Selector Tabs */}
      <div className="metric-card mb-4">
        <div className="d-flex align-items-center justify-content-between mb-3">
          <h6 className="fw-bold mb-0"><i className="bi bi-book-half text-primary me-2"></i> Handled Teaching Courses</h6>
          <span className="badge bg-light text-dark border">{handledCourses.length} Courses Assigned</span>
        </div>

        <div className="row g-3">
          {handledCourses.map((course, idx) => {
            const isSelected = selectedCourseIndex === idx;
            return (
              <div key={course.course_code} className="col-12 col-md-6">
                <div
                  className={`p-3 rounded-4 border transition-all ${
                    isSelected ? 'border-primary bg-white shadow-sm ring-2' : 'bg-light hover-shadow'
                  }`}
                  style={{
                    cursor: 'pointer',
                    borderColor: isSelected ? '#4f46e5' : '#e2e8f0',
                    borderWidth: isSelected ? '2px' : '1px'
                  }}
                  onClick={() => setSelectedCourseIndex(idx)}
                >
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <div>
                      <span className="badge bg-primary text-white font-mono me-2">{course.course_code}</span>
                      <span className="badge bg-light text-dark border">{course.section}</span>
                    </div>
                    <span className="badge bg-light text-success border">Sem {course.semester} ({course.credits} Credits)</span>
                  </div>

                  <h6 className="fw-bold mb-1 text-dark">{course.course_title}</h6>

                  <div className="small text-muted mb-2">
                    <div><i className="bi bi-calendar-event me-1 text-primary"></i> <strong>Schedule:</strong> {course.class_schedule}</div>
                    <div><i className="bi bi-geo-alt me-1 text-danger"></i> <strong>Room:</strong> {course.classroom}</div>
                  </div>

                  <div className="d-flex justify-content-between align-items-center pt-2 border-top small">
                    <span>Enrolled: <strong>{course.total_enrolled} Students</strong></span>
                    <span>Avg Attendance: <strong className="text-success">{course.average_attendance}%</strong></span>
                    {course.shortage_alerts_count > 0 && (
                      <span className="badge badge-risk-high">{course.shortage_alerts_count} Below 75%</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Section: Course Attendance Monitoring & Distribution Buckets */}
      <div className="metric-card mb-4">
        <h6 className="fw-bold mb-3">
          <i className="bi bi-bar-chart-fill text-primary me-2"></i>
          Attendance Monitoring & Distribution: <span className="text-primary font-mono">{activeCourse.course_code}</span> ({enrolledStudents.length} Students)
        </h6>

        <div className="row g-3 text-center small mb-3">
          <div className="col-6 col-md-3">
            <div className="p-3 bg-light rounded-3 border border-success">
              <div className="text-success fw-bold">90% – 100%</div>
              <h4 className="fw-bold text-dark my-1">{bucket90_100}</h4>
              <span className="text-muted" style={{ fontSize: '0.72rem' }}>Optimal Attendance</span>
            </div>
          </div>
          <div className="col-6 col-md-3">
            <div className="p-3 bg-light rounded-3 border border-primary">
              <div className="text-primary fw-bold">75% – 89%</div>
              <h4 className="fw-bold text-dark my-1">{bucket75_89}</h4>
              <span className="text-muted" style={{ fontSize: '0.72rem' }}>Compliant Range</span>
            </div>
          </div>
          <div className="col-6 col-md-3">
            <div className="p-3 bg-light rounded-3 border border-warning">
              <div className="text-warning fw-bold">60% – 74%</div>
              <h4 className="fw-bold text-dark my-1">{bucket60_74}</h4>
              <span className="text-muted" style={{ fontSize: '0.72rem' }}>Warning Shortage</span>
            </div>
          </div>
          <div className="col-6 col-md-3">
            <div className="p-3 bg-light rounded-3 border border-danger">
              <div className="text-danger fw-bold">&lt; 60%</div>
              <h4 className="fw-bold text-dark my-1">{bucketBelow60}</h4>
              <span className="text-muted" style={{ fontSize: '0.72rem' }}>Critical Debarment</span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Section: Faculty Early Warning System (ML Risk Breakdown) */}
      <div className="metric-card mb-4 border-primary">
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-3 gap-2">
          <div>
            <h6 className="fw-bold mb-0 text-primary">
              <i className="bi bi-shield-exclamation text-danger me-2"></i>
              Faculty Early Warning ML System
            </h6>
            <span className="text-muted small">AI-assisted identification of students requiring immediate academic intervention</span>
          </div>

          <div className="d-flex gap-2">
            <span className="badge badge-risk-high p-2">🔴 {highRiskStudents.length} High Risk</span>
            <span className="badge badge-risk-med p-2">🟠 {medRiskStudents.length} Medium Risk</span>
            <span className="badge badge-risk-low p-2">🟢 {lowRiskStudents.length} Low Risk</span>
          </div>
        </div>

        {/* At-Risk Student Cards */}
        <div className="row g-3">
          {highRiskStudents.slice(0, 3).map(stu => (
            <div key={stu.student_id} className="col-12 col-md-4">
              <div className="p-3 bg-light rounded-3 border border-danger h-100">
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <div>
                    <h6 className="fw-bold mb-0 text-dark">{stu.student_name}</h6>
                    <span className="text-muted font-mono" style={{ fontSize: '0.72rem' }}>{stu.student_id}</span>
                  </div>
                  <span className="badge badge-risk-high">HIGH RISK</span>
                </div>

                <div className="small text-danger mb-2">
                  <div>• Attendance: <strong>{stu.attendance_percentage}%</strong> (Shortage)</div>
                  <div>• Internal Marks: <strong>{stu.internal_marks} / 30</strong></div>
                  <div>• Status: Exam Debarment Risk</div>
                </div>

                <div className="p-2 bg-white rounded border small text-muted mb-2" style={{ fontSize: '0.75rem' }}>
                  <strong>Recommended Action:</strong> Schedule urgent 1-on-1 mentoring meeting.
                </div>

                <div className="d-flex gap-2">
                  <button
                    className="btn btn-sm btn-outline-danger flex-grow-1"
                    style={{ fontSize: '0.72rem' }}
                    onClick={() => setSelectedStudentForWarning(stu)}
                  >
                    <i className="bi bi-envelope me-1"></i> Send Notice
                  </button>
                  <button
                    className="btn btn-sm btn-outline-primary flex-grow-1"
                    style={{ fontSize: '0.72rem' }}
                    onClick={() => {
                      setWhatIfStudent(stu);
                      setSimAttendance(stu.attendance_percentage);
                      setSimInternals(stu.internal_marks);
                      setActiveTab('WHAT_IF');
                    }}
                  >
                    <i className="bi bi-sliders me-1"></i> What-If
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 5. Workflow Mode Switcher Bar */}
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-3 gap-2">
        <div className="btn-group btn-group-sm shadow-sm">
          <button
            className={`btn ${activeTab === 'ROSTER' ? 'btn-primary' : 'btn-light border'}`}
            style={activeTab === 'ROSTER' ? { background: '#4f46e5', borderColor: '#4f46e5' } : {}}
            onClick={() => setActiveTab('ROSTER')}
          >
            <i className="bi bi-table me-1"></i> Enrolled Student Roster
          </button>
          <button
            className={`btn ${activeTab === 'WHAT_IF' ? 'btn-primary' : 'btn-light border'}`}
            style={activeTab === 'WHAT_IF' ? { background: '#4f46e5', borderColor: '#4f46e5' } : {}}
            onClick={() => setActiveTab('WHAT_IF')}
          >
            <i className="bi bi-sliders me-1"></i> Faculty What-If Simulator
          </button>
          <button
            className={`btn ${activeTab === 'ATTENDANCE_TAKER' ? 'btn-primary' : 'btn-light border'}`}
            style={activeTab === 'ATTENDANCE_TAKER' ? { background: '#4f46e5', borderColor: '#4f46e5' } : {}}
            onClick={() => setActiveTab('ATTENDANCE_TAKER')}
          >
            <i className="bi bi-check2-square me-1"></i> Mark Daily Roll Call
          </button>
          <button
            className={`btn ${activeTab === 'GRADING' ? 'btn-primary' : 'btn-light border'}`}
            style={activeTab === 'GRADING' ? { background: '#4f46e5', borderColor: '#4f46e5' } : {}}
            onClick={() => setActiveTab('GRADING')}
          >
            <i className="bi bi-input-cursor-text me-1"></i> Grade Sheet Editor
          </button>
        </div>
      </div>

      {/* MODE 1: ENROLLED STUDENT ROSTER TABLE */}
      {activeTab === 'ROSTER' && (
        <div className="metric-card mb-4">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h6 className="fw-bold mb-0">Enrolled Student Roster & Shortage Tracker</h6>
            <span className="badge bg-light text-dark border">Managing {enrolledStudents.length} Students</span>
          </div>

          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0 small">
              <thead className="table-light">
                <tr>
                  <th>Student ID</th>
                  <th>Student Name</th>
                  <th>Attendance Rate</th>
                  <th>Status</th>
                  <th>Internal Marks (30)</th>
                  <th>Projected Grade</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {enrolledStudents.map(s => {
                  const isCritical = s.attendance_percentage < 60;
                  const isWarning = s.attendance_percentage >= 60 && s.attendance_percentage < 75;
                  const isGood = s.attendance_percentage >= 75;
                  return (
                    <tr key={s.student_id}>
                      <td className="font-mono fw-bold text-primary">{s.student_id}</td>
                      <td>
                        <div className="fw-semibold text-dark">{s.student_name}</div>
                        <div className="text-muted" style={{ fontSize: '0.72rem' }}>{s.email}</div>
                      </td>
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          <div className="progress flex-grow-1" style={{ height: '6px', minWidth: '60px' }}>
                            <div
                              className={`progress-bar ${isGood ? 'bg-success' : isWarning ? 'bg-warning' : 'bg-danger'}`}
                              style={{ width: `${Math.min(100, s.attendance_percentage)}%` }}
                            ></div>
                          </div>
                          <span className="fw-bold">{s.attendance_percentage}%</span>
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${isGood ? 'bg-light text-success border' : isWarning ? 'bg-warning text-dark' : 'bg-danger text-white'}`}>
                          {isGood ? 'Good' : isWarning ? 'Warning' : 'Critical'}
                        </span>
                      </td>
                      <td>
                        <strong>{editingMarks[s.student_id] ?? s.internal_marks}</strong> / 30
                      </td>
                      <td><span className="badge bg-light text-dark border font-mono">{s.grade_letter}</span></td>
                      <td className="text-end">
                        <div className="d-flex gap-1 justify-content-end">
                          {s.is_shortage && (
                            <button
                              className="btn btn-sm btn-outline-danger py-0 px-2 rounded-pill"
                              style={{ fontSize: '0.72rem' }}
                              onClick={() => setSelectedStudentForWarning(s)}
                            >
                              <i className="bi bi-exclamation-triangle me-1"></i> Warning
                            </button>
                          )}
                          <button
                            className="btn btn-sm btn-outline-primary py-0 px-2 rounded-pill"
                            style={{ fontSize: '0.72rem' }}
                            onClick={() => {
                              setWhatIfStudent(s);
                              setSimAttendance(s.attendance_percentage);
                              setSimInternals(s.internal_marks);
                              setActiveTab('WHAT_IF');
                            }}
                          >
                            <i className="bi bi-sliders me-1"></i> What-If
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODE 2: FACULTY WHAT-IF SCENARIO ANALYZER */}
      {activeTab === 'WHAT_IF' && whatIfStudent && (
        <div className="metric-card mb-4 border-primary">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <div>
              <h5 className="fw-bold mb-0 text-primary"><i className="bi bi-sliders me-2"></i> Faculty Scenario Analysis (What-If Simulation)</h5>
              <span className="text-muted small">Test academic remediation interventions for advisee candidate</span>
            </div>
            <button className="btn btn-sm btn-outline-secondary" onClick={() => setActiveTab('ROSTER')}>
              ← Back to Roster
            </button>
          </div>

          <div className="bg-light p-3 rounded-3 border mb-4">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <h6 className="fw-bold mb-1">{whatIfStudent.student_name} ({whatIfStudent.student_id})</h6>
                <div className="text-muted small">Course: {activeCourse.course_code} - {activeCourse.course_title}</div>
              </div>
              <div className="text-end">
                <div className="small text-muted">Current Risk Standing</div>
                <span className={`badge fs-6 ${whatIfStudent.risk_level === 'HIGH' ? 'badge-risk-high' : 'badge-risk-low'}`}>
                  {whatIfStudent.risk_level || 'HIGH'} RISK
                </span>
              </div>
            </div>
          </div>

          <div className="row g-4 mb-4">
            <div className="col-12 col-md-6">
              <label className="form-label small fw-semibold">
                Simulated Attendance Rate: <strong className="text-primary">{simAttendance}%</strong>
              </label>
              <input
                type="range"
                className="form-range"
                min="40"
                max="95"
                step="1"
                value={simAttendance}
                onChange={(e) => setSimAttendance(parseInt(e.target.value))}
              />
              <div className="d-flex justify-content-between text-muted" style={{ fontSize: '0.72rem' }}>
                <span>40% (Debarred)</span>
                <span>75% (Eligibility)</span>
                <span>95% (Distinction)</span>
              </div>
            </div>

            <div className="col-12 col-md-6">
              <label className="form-label small fw-semibold">
                Simulated Internal Assessment Marks: <strong className="text-primary">{simInternals} / 30</strong>
              </label>
              <input
                type="range"
                className="form-range"
                min="5"
                max="30"
                step="1"
                value={simInternals}
                onChange={(e) => setSimInternals(parseInt(e.target.value))}
              />
              <div className="d-flex justify-content-between text-muted" style={{ fontSize: '0.72rem' }}>
                <span>5 / 30 (Fail)</span>
                <span>15 / 30 (Pass)</span>
                <span>30 / 30 (Centum)</span>
              </div>
            </div>
          </div>

          {/* Simulation Outcome Card */}
          <div className="p-4 bg-white rounded-3 border text-center">
            <div className="text-muted small mb-1">Scenario Outcome Impact:</div>
            <div className="d-flex justify-content-center align-items-center gap-3 my-2">
              <span className="badge badge-risk-high fs-6 p-2">Current Risk: {whatIfStudent.risk_level || 'HIGH'}</span>
              <i className="bi bi-arrow-right fs-4 text-muted"></i>
              <span className={`badge fs-6 p-2 ${simulatedRisk === 'LOW' ? 'bg-success text-white' : simulatedRisk === 'MEDIUM' ? 'bg-warning text-dark' : 'bg-danger text-white'}`}>
                Simulated Risk: {simulatedRisk} RISK
              </span>
            </div>
            <p className="text-muted small mb-0">
              {simulatedRisk === 'LOW'
                ? '✓ Reaching 75% attendance and 20+ internal marks successfully restores the student to safe standing.'
                : '⚠ Remedial tutoring and mandatory laboratory attendance required to further mitigate academic risk.'}
            </p>
          </div>
        </div>
      )}

      {/* MODE 3: DAILY ATTENDANCE MARKER TOOL */}
      {activeTab === 'ATTENDANCE_TAKER' && (
        <div className="metric-card mb-4 border-primary">
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-3 gap-2">
            <div>
              <h5 className="fw-bold mb-0 text-primary">
                <i className="bi bi-calendar2-check-fill me-2"></i>
                Daily Roll Call Marker: {activeCourse.course_code} ({activeCourse.section})
              </h5>
              <span className="text-muted small">Record today's lecture roll call and save to warehouse.</span>
            </div>

            <div className="d-flex gap-2 align-items-center">
              <input
                type="date"
                className="form-control form-control-sm"
                value={attendanceDate}
                onChange={(e) => setAttendanceDate(e.target.value)}
              />
              <button className="btn btn-sm btn-outline-success" onClick={() => handleMarkAll('PRESENT')}>
                Mark All Present
              </button>
              <button className="btn btn-sm btn-outline-secondary" onClick={() => handleMarkAll('ABSENT')}>
                Mark All Absent
              </button>
            </div>
          </div>

          <div className="table-responsive mb-3">
            <table className="table table-hover align-middle mb-0 small">
              <thead className="table-light">
                <tr>
                  <th>Roll No</th>
                  <th>Student Name</th>
                  <th>Overall Attendance</th>
                  <th>Session Status ({attendanceDate})</th>
                </tr>
              </thead>
              <tbody>
                {enrolledStudents.map(s => {
                  const currentStatus = dailyAttendanceMap[s.student_id] || 'PRESENT';
                  return (
                    <tr key={s.student_id}>
                      <td className="font-mono fw-bold">{s.student_id}</td>
                      <td>{s.student_name}</td>
                      <td>
                        <span className={`fw-bold ${s.attendance_percentage >= 75 ? 'text-success' : 'text-danger'}`}>
                          {s.attendance_percentage}%
                        </span>
                      </td>
                      <td>
                        <div className="btn-group btn-group-sm">
                          <button
                            type="button"
                            className={`btn ${currentStatus === 'PRESENT' ? 'btn-success' : 'btn-outline-secondary'}`}
                            onClick={() => setDailyAttendanceMap({ ...dailyAttendanceMap, [s.student_id]: 'PRESENT' })}
                          >
                            <i className="bi bi-check"></i> Present
                          </button>
                          <button
                            type="button"
                            className={`btn ${currentStatus === 'ABSENT' ? 'btn-danger' : 'btn-outline-secondary'}`}
                            onClick={() => setDailyAttendanceMap({ ...dailyAttendanceMap, [s.student_id]: 'ABSENT' })}
                          >
                            <i className="bi bi-x"></i> Absent
                          </button>
                          <button
                            type="button"
                            className={`btn ${currentStatus === 'LATE' ? 'btn-warning' : 'btn-outline-secondary'}`}
                            onClick={() => setDailyAttendanceMap({ ...dailyAttendanceMap, [s.student_id]: 'LATE' })}
                          >
                            Late
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="d-flex justify-content-end gap-2">
            <button className="btn btn-sm btn-secondary" onClick={() => setActiveTab('ROSTER')}>Cancel</button>
            <button className="btn btn-sm btn-primary" onClick={handleSaveDailyAttendance} style={{ background: '#4f46e5', borderColor: '#4f46e5' }}>
              <i className="bi bi-cloud-check-fill me-1"></i> Save Attendance Session
            </button>
          </div>
        </div>
      )}

      {/* MODE 4: INTERNAL ASSESSMENT GRADING SHEET */}
      {activeTab === 'GRADING' && (
        <div className="metric-card mb-4 border-info">
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-3 gap-2">
            <div>
              <h5 className="fw-bold mb-0 text-info">
                <i className="bi bi-card-checklist me-2"></i>
                Internal Assessment Grading Sheet (Max: 30 Marks)
              </h5>
              <span className="text-muted small">Update mid-term scores and evaluate class performance.</span>
            </div>
          </div>

          <div className="table-responsive mb-3">
            <table className="table table-hover align-middle mb-0 small">
              <thead className="table-light">
                <tr>
                  <th>Student ID</th>
                  <th>Student Name</th>
                  <th>Current Marks (out of 30)</th>
                  <th>Standing</th>
                </tr>
              </thead>
              <tbody>
                {enrolledStudents.map(s => {
                  const val = editingMarks[s.student_id] ?? s.internal_marks;
                  return (
                    <tr key={s.student_id}>
                      <td className="font-mono fw-bold">{s.student_id}</td>
                      <td>{s.student_name}</td>
                      <td style={{ width: '150px' }}>
                        <div className="input-group input-group-sm">
                          <input
                            type="number"
                            className="form-control form-control-sm font-mono"
                            min="0"
                            max="30"
                            value={val}
                            onChange={(e) => setEditingMarks({ ...editingMarks, [s.student_id]: parseInt(e.target.value) || 0 })}
                          />
                          <span className="input-group-text">/ 30</span>
                        </div>
                      </td>
                      <td>
                        {val < 15 ? (
                          <span className="badge bg-danger">Remedial Required (&lt; 50%)</span>
                        ) : val >= 25 ? (
                          <span className="badge bg-success">Distinction</span>
                        ) : (
                          <span className="badge bg-light text-dark border">Passing</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="d-flex justify-content-end gap-2">
            <button className="btn btn-sm btn-secondary" onClick={() => setActiveTab('ROSTER')}>Cancel</button>
            <button className="btn btn-sm btn-info text-white" onClick={handleSaveMarks} style={{ background: '#0ea5e9', borderColor: '#0ea5e9' }}>
              <i className="bi bi-save me-1"></i> Save Grade Sheet
            </button>
          </div>
        </div>
      )}

      {/* Warning Notice Dispatch Modal */}
      {selectedStudentForWarning && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(15,23,42,0.65)', backdropFilter: 'blur(6px)' }} tabIndex="-1">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
              <div className="modal-header bg-danger text-white p-3 px-4 d-print-none">
                <h5 className="modal-title fs-6"><i className="bi bi-exclamation-triangle-fill me-2"></i> Official Attendance Warning Notice</h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setSelectedStudentForWarning(null)}></button>
              </div>
              <div className="modal-body p-4 bg-light">
                <div className="border p-4 rounded-3 bg-white font-mono small mb-3 printable-area">
                  <div className="text-center fw-bold border-bottom pb-2 mb-3">
                    <div className="fs-5">OFFICIAL COURSE DEBARMENT ADVISORY</div>
                    <div className="text-muted fw-normal" style={{ fontSize: '0.75rem' }}>Department of {currentFaculty.department_name}</div>
                  </div>
                  <div><strong>Student Name:</strong> {selectedStudentForWarning.student_name}</div>
                  <div><strong>Student ID:</strong> {selectedStudentForWarning.student_id}</div>
                  <div><strong>Course Code:</strong> {activeCourse.course_code} - {activeCourse.course_title}</div>
                  <div><strong>Faculty In-Charge:</strong> {currentFaculty.faculty_name}</div>
                  <div><strong>Current Attendance:</strong> <span className="text-danger fw-bold">{selectedStudentForWarning.attendance_percentage}%</span></div>
                  <hr />
                  <p className="mb-0 text-muted" style={{ fontSize: '0.8rem' }}>
                    You are hereby advised that your course attendance is strictly below the mandatory 75.0% requirement. Failure to attend remaining scheduled classes will lead to end-semester examination debarment.
                  </p>
                </div>
              </div>
              <div className="modal-footer bg-white p-3 d-print-none">
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setSelectedStudentForWarning(null)}>Cancel</button>
                <button type="button" className="btn btn-outline-dark btn-sm" onClick={() => window.print()}>
                  <i className="bi bi-printer me-1"></i> Print Warning Notice
                </button>
                <button type="button" className="btn btn-danger btn-sm" onClick={() => handleDispatchWarning(selectedStudentForWarning)}>
                  <i className="bi bi-send me-1"></i> Dispatch Notice
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Record Counseling Session Modal */}
      {showLogModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(15,23,42,0.65)', backdropFilter: 'blur(6px)' }} tabIndex="-1">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
              <div className="modal-header bg-primary text-white p-3 px-4" style={{ background: '#4f46e5' }}>
                <h5 className="modal-title fs-6"><i className="bi bi-journal-plus me-2"></i> Log Advisee Mentorship Session</h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowLogModal(false)}></button>
              </div>
              <form onSubmit={handleSaveLog}>
                <div className="modal-body p-4 bg-light">
                  <div className="mb-3">
                    <label className="form-label small fw-semibold">Select {currentFaculty.department_name?.split(' ')[0]} Student</label>
                    <select
                      className="form-select form-select-sm"
                      value={newLog.student_id}
                      onChange={(e) => {
                        const sId = e.target.value;
                        const match = enrolledStudents.find(s => s.student_id === sId);
                        setNewLog({
                          ...newLog,
                          student_id: sId,
                          student_name: match ? match.student_name : '',
                          course_code: activeCourse.course_code
                        });
                      }}
                      required
                    >
                      <option value="">-- Choose Enrolled Student --</option>
                      {enrolledStudents.map(s => (
                        <option key={s.student_id} value={s.student_id}>
                          {s.student_name} ({s.student_id}) - {s.attendance_percentage}% Att
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-semibold">Course Code</label>
                    <input
                      type="text"
                      className="form-control form-control-sm font-mono"
                      value={newLog.course_code || activeCourse.course_code || ''}
                      onChange={(e) => setNewLog({ ...newLog, course_code: e.target.value.toUpperCase() })}
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-semibold">Discussion Topic</label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      placeholder="e.g. Mid-term remedial classes / Backlog clearing strategy"
                      value={newLog.topic}
                      onChange={(e) => setNewLog({ ...newLog, topic: e.target.value })}
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-semibold">Agreed Action Items / Next Steps</label>
                    <textarea
                      className="form-control form-control-sm"
                      rows="3"
                      placeholder="e.g. Advisee agreed to submit 2 pending lab assignments and attend peer tutoring."
                      value={newLog.action}
                      onChange={(e) => setNewLog({ ...newLog, action: e.target.value })}
                    ></textarea>
                  </div>
                </div>

                <div className="modal-footer bg-white p-3">
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowLogModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary btn-sm" style={{ background: '#4f46e5', borderColor: '#4f46e5' }}>
                    Save Session Note
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
