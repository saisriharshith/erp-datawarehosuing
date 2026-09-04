import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { fetchAPI } from '../services/api';

export default function FacultyPortal() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const isDean = user?.role === 'ADMIN';

  // Sub-tab: 'roster' | 'attendance' | 'marks' | 'warnings' | 'mentoring'
  const activeTab = searchParams.get('tab') || 'roster';
  const setActiveTab = (tabName) => {
    setSearchParams({ tab: tabName });
  };

  const facultyDept = user?.department_id || (isDean ? '' : 'DEPT_CSE');
  const [deptFilter, setDeptFilter] = useState(facultyDept);
  const [facultySummary, setFacultySummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedFacultyId, setSelectedFacultyId] = useState(user?.faculty_id || '');
  const [selectedCourseIndex, setSelectedCourseIndex] = useState(0);

  // Daily Attendance Marker State
  const [attendanceDate, setAttendanceDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [dailyAttendanceMap, setDailyAttendanceMap] = useState({});
  const [submittedAttendanceSessions, setSubmittedAttendanceSessions] = useState(() => {
    try {
      const saved = localStorage.getItem('SAVED_ATTENDANCE_SESSIONS');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });
  const [attendanceSearch, setAttendanceSearch] = useState('');

  // Editable Internal Marks State
  const [editingMarks, setEditingMarks] = useState({});
  const [marksErrors, setMarksErrors] = useState({});
  const [selectedAssessmentType, setSelectedAssessmentType] = useState('INTERNAL_1');
  const [marksSearch, setMarksSearch] = useState('');

  // Advisee Mentorship Logs
  const [mentorshipLogs, setMentorshipLogs] = useState(() => {
    try {
      const saved = localStorage.getItem('FACULTY_MENTORSHIP_LOGS');
      return saved ? JSON.parse(saved) : [
        {
          id: 1,
          faculty_name: 'Dr. Sunita Deshmukh',
          student_id: 'STU20220001',
          student_name: 'Sai Gupta',
          course_code: 'CS501',
          date: '2026-08-24',
          topic: 'Attendance Shortage Remediation Plan',
          action: 'Agreed to attend Saturday make-up practical sessions and submit makeup assignments.',
          status: 'IN_PROGRESS'
        }
      ];
    } catch {
      return [];
    }
  });
  const [newLog, setNewLog] = useState({ student_id: '', student_name: '', course_code: '', topic: '', action: '' });
  const [showLogModal, setShowLogModal] = useState(false);
  const [selectedStudentForWarning, setSelectedStudentForWarning] = useState(null);

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

  // Initialize Maps when course changes
  useEffect(() => {
    if (enrolledStudents.length > 0) {
      const initialMap = {};
      const marksMap = {};
      enrolledStudents.forEach(s => {
        initialMap[s.student_id] = 'PRESENT';
        marksMap[s.student_id] = s.internal_marks || 22;
      });
      setDailyAttendanceMap(initialMap);
      setEditingMarks(marksMap);
      setMarksErrors({});
    }
  }, [selectedCourseIndex, selectedFacultyId, facultySummary]);

  // Today's Lectures Schedule for this Faculty Member
  const facultyTodaySchedule = useMemo(() => [
    { time: '09:00 AM - 10:00 AM', course: activeCourse.course_code || 'CS501', title: activeCourse.course_title || 'Operating Systems', section: activeCourse.section || 'Section A', room: activeCourse.classroom || 'Hall 204', status: 'COMPLETED' },
    { time: '11:15 AM - 12:45 PM', course: handledCourses[1]?.course_code || 'CS401', title: handledCourses[1]?.course_title || 'Database Systems', section: 'Section B', room: 'Lab 102', status: 'IN_PROGRESS' },
    { time: '02:00 PM - 03:30 PM', course: activeCourse.course_code || 'CS501', title: 'Tutorial & Doubts Remedial', section: 'Section A', room: 'Hall 204', status: 'UPCOMING' }
  ], [activeCourse, handledCourses]);

  const atRiskStudents = enrolledStudents.filter(s => s.is_shortage || s.attendance_percentage < 75.0);

  // Mark all present / absent
  const handleBulkAttendance = (status) => {
    const updated = {};
    enrolledStudents.forEach(s => {
      updated[s.student_id] = status;
    });
    setDailyAttendanceMap(updated);
    addToast(`Marked all ${enrolledStudents.length} students as ${status}`, 'info');
  };

  // Submit attendance with duplicate submission prevention
  const handleSaveDailyAttendance = () => {
    const sessionKey = `${activeCourse.course_code}_${activeCourse.section}_${attendanceDate}`;
    if (submittedAttendanceSessions[sessionKey]) {
      const confirmed = window.confirm(`Attendance for ${activeCourse.course_code} on ${attendanceDate} was already submitted earlier today. Do you wish to overwrite and update this record?`);
      if (!confirmed) return;
    }

    const presentCount = Object.values(dailyAttendanceMap).filter(v => v === 'PRESENT').length;
    const updatedSessions = { ...submittedAttendanceSessions, [sessionKey]: { date: attendanceDate, presentCount, total: enrolledStudents.length, timestamp: new Date().toISOString() } };
    setSubmittedAttendanceSessions(updatedSessions);
    localStorage.setItem('SAVED_ATTENDANCE_SESSIONS', JSON.stringify(updatedSessions));

    addToast(`Saved attendance session: ${presentCount}/${enrolledStudents.length} Present on ${attendanceDate} for ${activeCourse.course_code}`, 'success');
    setActiveTab('roster');
  };

  // Mark entry validation (Max Marks: 30)
  const MAX_MARKS = 30;
  const handleMarkChange = (studentId, valueStr) => {
    const num = parseInt(valueStr, 10);
    const newErrors = { ...marksErrors };

    if (isNaN(num)) {
      setEditingMarks({ ...editingMarks, [studentId]: 0 });
      delete newErrors[studentId];
    } else if (num > MAX_MARKS) {
      newErrors[studentId] = `Marks cannot exceed ${MAX_MARKS}`;
      setEditingMarks({ ...editingMarks, [studentId]: num });
    } else if (num < 0) {
      newErrors[studentId] = `Marks cannot be negative`;
      setEditingMarks({ ...editingMarks, [studentId]: 0 });
    } else {
      delete newErrors[studentId];
      setEditingMarks({ ...editingMarks, [studentId]: num });
    }
    setMarksErrors(newErrors);
  };

  const handleSaveMarks = () => {
    if (Object.keys(marksErrors).length > 0) {
      addToast(`Please correct the marked errors before submitting. Marks cannot exceed ${MAX_MARKS}.`, 'danger');
      return;
    }
    addToast(`Internal assessment marks successfully recorded for ${activeCourse.course_code} (${activeCourse.section})`, 'success');
    setActiveTab('roster');
  };

  // Dispatch Warning Notice to At-Risk Student
  const handleDispatchWarning = (stu) => {
    addToast(`Official Attendance Shortage Notice dispatched to ${stu.student_name} (${stu.email}) for ${activeCourse.course_code}`, 'success');
    setSelectedStudentForWarning(null);
  };

  // Mentorship Session Logger
  const handleSaveLog = (e) => {
    if (e) e.preventDefault();
    if (!newLog.student_id || !newLog.topic) {
      addToast('Please provide Student ID and Counseling Topic', 'warning');
      return;
    }

    const entry = {
      id: Date.now(),
      faculty_name: currentFaculty.faculty_name || user?.name || 'Faculty Member',
      student_id: newLog.student_id,
      student_name: newLog.student_name || 'Advisee Student',
      course_code: newLog.course_code || activeCourse.course_code || 'CS501',
      date: new Date().toISOString().split('T')[0],
      topic: newLog.topic,
      action: newLog.action || 'Remedial academic action plan agreed upon.',
      status: 'OPEN'
    };

    const updated = [entry, ...mentorshipLogs];
    setMentorshipLogs(updated);
    localStorage.setItem('FACULTY_MENTORSHIP_LOGS', JSON.stringify(updated));
    addToast(`Mentorship session recorded for ${entry.student_name}`, 'success');
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

  // Calculate live class average for marks
  const markValues = Object.values(editingMarks).filter(v => typeof v === 'number' && v <= MAX_MARKS);
  const classAvgMark = markValues.length ? Number((markValues.reduce((a, b) => a + b, 0) / markValues.length).toFixed(1)) : 22.4;

  return (
    <div className="p-2 p-md-4">
      {/* 1. DEAN INSPECTION BAR (Visible if Dean/Admin) */}
      {isDean && (
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center p-3 mb-3 rounded-3 bg-primary text-white shadow-sm gap-2">
          <div className="d-flex align-items-center gap-2">
            <i className="bi bi-shield-check fs-5"></i>
            <span className="small">
              Dean Directorate: Inspecting Teaching Portfolio of <strong>{currentFaculty.faculty_name}</strong>
            </span>
          </div>
          <div className="d-flex gap-2">
            <select
              className="form-select form-select-sm"
              value={selectedFacultyId}
              onChange={e => { setSelectedFacultyId(e.target.value); setSelectedCourseIndex(0); }}
              style={{ width: '220px' }}
            >
              {facultyList.map(f => (
                <option key={f.faculty_id} value={f.faculty_id}>
                  {f.faculty_name} ({f.department_name ? f.department_name.split(' ')[0] : 'Engg'})
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* 2. FACULTY GREETING & WORKSPACE HEADER */}
      <div className="erp-card p-4 mb-4">
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
          <div>
            <div className="d-flex align-items-center gap-2 mb-1">
              <span className="badge bg-primary-subtle text-primary border border-primary-subtle px-2 py-1">
                <i className="bi bi-person-workspace me-1"></i> Faculty Academic Workspace
              </span>
              <span className="text-muted small">•</span>
              <span className="text-muted small font-mono">{currentFaculty.faculty_id || 'FAC102'}</span>
            </div>
            <h4 className="fw-bold mb-1" style={{ color: 'var(--text-primary)' }}>
              {currentFaculty.faculty_name || 'Dr. Sunita Deshmukh'}
            </h4>
            <div className="d-flex flex-wrap gap-2 text-muted small">
              <span><strong>Department:</strong> {currentFaculty.department_name || 'Computer Science & Engineering'}</span>
              <span>•</span>
              <span><strong>Designation:</strong> {currentFaculty.designation || 'Professor & HOD'}</span>
              <span>•</span>
              <span><strong>Handled Courses:</strong> {handledCourses.map(c => c.course_code).join(', ')}</span>
            </div>
          </div>

          <div className="d-flex gap-2">
            <button
              type="button"
              className="btn btn-sm btn-outline-primary d-flex align-items-center gap-1"
              onClick={() => setShowLogModal(true)}
            >
              <i className="bi bi-journal-plus"></i>
              <span>Log Mentoring Session</span>
            </button>
            <button
              type="button"
              className="btn btn-sm btn-primary d-flex align-items-center gap-1"
              onClick={() => setActiveTab('attendance')}
            >
              <i className="bi bi-check2-square"></i>
              <span>Take Attendance Now</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. CORE STAT CARDS & WHAT TO DO TODAY */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="erp-stat-card h-100">
            <span className="text-muted small fw-semibold">Today's Lectures</span>
            <h3 className="fw-bold my-1 text-primary">{facultyTodaySchedule.length}</h3>
            <span className="badge bg-primary-subtle text-primary border border-primary-subtle">
              Next: 11:15 AM (Lab 102)
            </span>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-xl-3">
          <div className="erp-stat-card h-100">
            <span className="text-muted small fw-semibold">Assigned Courses & Sections</span>
            <h3 className="fw-bold my-1" style={{ color: 'var(--text-primary)' }}>{handledCourses.length}</h3>
            <span className="badge bg-light text-muted border">Term 2024–2025</span>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-xl-3">
          <div className="erp-stat-card h-100">
            <span className="text-muted small fw-semibold">Total Students Enrolled</span>
            <h3 className="fw-bold my-1 text-success">{enrolledStudents.length}</h3>
            <span className="badge bg-success-subtle text-success border border-success-subtle">
              Avg Attendance: {activeCourse.average_attendance || 78.4}%
            </span>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-xl-3">
          <div className="erp-stat-card h-100">
            <span className="text-muted small fw-semibold">At-Risk Debarment Alerts</span>
            <h3 className="fw-bold my-1 text-danger">{atRiskStudents.length}</h3>
            <span className="badge bg-danger-subtle text-danger border border-danger-subtle">
              &lt; 75% Attendance
            </span>
          </div>
        </div>
      </div>

      {/* 4. NAVIGATION TABS */}
      <div className="d-flex flex-wrap gap-1 mb-4 pb-2 border-bottom" style={{ borderColor: 'var(--border-color)' }}>
        {[
          { key: 'roster', label: 'Course Roster & Schedule', icon: 'bi-grid-fill' },
          { key: 'attendance', label: 'Take Attendance (Marker Tool)', icon: 'bi-check2-square' },
          { key: 'marks', label: 'Enter Internal Marks (Grading Sheet)', icon: 'bi-pencil-square' },
          { key: 'warnings', label: `Low Attendance Warnings (${atRiskStudents.length})`, icon: 'bi-exclamation-triangle-fill' },
          { key: 'mentoring', label: 'Mentorship & Counseling Log', icon: 'bi-chat-left-text-fill' }
        ].map(tab => (
          <button
            key={tab.key}
            type="button"
            className={`btn btn-sm d-flex align-items-center gap-2 px-3 py-2 rounded-pill fw-semibold transition-all ${
              activeTab === tab.key ? 'btn-primary text-white shadow-sm' : 'btn-light border'
            }`}
            style={{
              fontSize: '0.82rem',
              backgroundColor: activeTab === tab.key ? '#4f46e5' : 'var(--surface-elevated)',
              borderColor: activeTab === tab.key ? '#4f46e5' : 'var(--border-color)',
              color: activeTab === tab.key ? '#ffffff' : 'var(--text-secondary)'
            }}
            onClick={() => setActiveTab(tab.key)}
          >
            <i className={`bi ${tab.icon}`}></i>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* =================================================================== */}
      {/* SUB-VIEW 1: COURSE ROSTER & TODAY'S SCHEDULE */}
      {/* =================================================================== */}
      {activeTab === 'roster' && (
        <div className="d-flex flex-column gap-4">
          {/* Handled Course Selector Cards */}
          <div>
            <h6 className="fw-bold mb-3" style={{ color: 'var(--text-primary)' }}>
              Assigned Teaching Courses (Select to Switch Active Roster)
            </h6>
            <div className="row g-3">
              {handledCourses.map((c, idx) => {
                const isSelected = selectedCourseIndex === idx;
                return (
                  <div key={c.course_code} className="col-12 col-md-6">
                    <div
                      className={`erp-card p-3 transition-all ${isSelected ? 'border-primary ring-2' : ''}`}
                      style={{
                        cursor: 'pointer',
                        borderWidth: isSelected ? '2px' : '1px',
                        borderColor: isSelected ? '#4f46e5' : 'var(--border-color)'
                      }}
                      onClick={() => setSelectedCourseIndex(idx)}
                    >
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <div>
                          <span className="badge bg-light text-dark border font-mono">{c.course_code}</span>
                          <h6 className="fw-bold my-1" style={{ color: 'var(--text-primary)' }}>{c.course_title}</h6>
                          <span className="text-muted small">{c.section} • Semester {c.semester}</span>
                        </div>
                        <span className={`badge ${isSelected ? 'bg-primary' : 'bg-light text-muted border'}`}>
                          {isSelected ? 'Active Selection' : 'Select'}
                        </span>
                      </div>
                      <div className="d-flex justify-content-between text-muted small pt-2 border-top" style={{ borderColor: 'var(--border-color)' }}>
                        <span>Schedule: <strong>{c.schedule}</strong></span>
                        <span>Hall: <strong>{c.classroom}</strong></span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Today's Lectures Timeline */}
          <div className="erp-card p-4">
            <h6 className="fw-bold mb-3" style={{ color: 'var(--text-primary)' }}>
              <i className="bi bi-clock-history text-primary me-2"></i> Today's Lecture Schedule
            </h6>
            <div className="row g-3">
              {facultyTodaySchedule.map((cls, idx) => (
                <div key={idx} className="col-12 col-md-4">
                  <div className="p-3 rounded-3 border bg-light h-100 d-flex flex-column justify-content-between">
                    <div>
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <span className="badge bg-secondary font-mono">{cls.course}</span>
                        <span className={`badge ${cls.status === 'COMPLETED' ? 'bg-secondary' : cls.status === 'IN_PROGRESS' ? 'bg-primary' : 'bg-light text-dark border'}`}>
                          {cls.status}
                        </span>
                      </div>
                      <div className="fw-bold small mb-1">{cls.title}</div>
                      <div className="text-muted small"><i className="bi bi-geo-alt me-1"></i> {cls.room} ({cls.section})</div>
                    </div>
                    <div className="mt-3 pt-2 border-top text-muted small fw-semibold font-mono">
                      <i className="bi bi-clock me-1"></i> {cls.time}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Enrolled Student Roster Table */}
          <div className="erp-card p-4">
            <div className="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom" style={{ borderColor: 'var(--border-color)' }}>
              <div>
                <h6 className="fw-bold mb-0" style={{ color: 'var(--text-primary)' }}>
                  Enrolled Students — {activeCourse.course_title} ({enrolledStudents.length} Students)
                </h6>
                <span className="text-muted small">Course section roster with aggregate attendance and internal marks</span>
              </div>
              <div className="d-flex gap-2">
                <button
                  type="button"
                  className="btn btn-sm btn-outline-primary"
                  onClick={() => setActiveTab('attendance')}
                >
                  <i className="bi bi-check2-square me-1"></i> Mark Attendance
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-outline-info"
                  onClick={() => setActiveTab('marks')}
                >
                  <i className="bi bi-pencil-square me-1"></i> Enter Marks
                </button>
              </div>
            </div>

            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0 small">
                <thead className="table-light">
                  <tr>
                    <th>Student ID</th>
                    <th>Full Name</th>
                    <th>Section</th>
                    <th className="text-center">Attended / Total</th>
                    <th className="text-center">Attendance %</th>
                    <th className="text-center">Internal Score (30)</th>
                    <th className="text-center">Compliance</th>
                    <th className="text-center">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {enrolledStudents.map(s => {
                    const isShort = s.is_shortage || s.attendance_percentage < 75.0;
                    return (
                      <tr key={s.student_id}>
                        <td className="font-mono fw-bold text-primary">{s.student_id}</td>
                        <td className="fw-semibold" style={{ color: 'var(--text-primary)' }}>{s.student_name}</td>
                        <td>{s.section}</td>
                        <td className="text-center font-mono">{s.classes_attended} / {s.total_classes}</td>
                        <td className="text-center">
                          <span className={`fw-bold font-mono ${isShort ? 'text-danger' : 'text-success'}`}>
                            {s.attendance_percentage}%
                          </span>
                        </td>
                        <td className="text-center font-mono fw-bold">{s.internal_marks} / 30</td>
                        <td className="text-center">
                          <span className={!isShort ? 'status-badge-healthy' : 'status-badge-critical'}>
                            {!isShort ? 'Satisfied' : 'Debarment Risk'}
                          </span>
                        </td>
                        <td className="text-center">
                          {isShort && (
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-danger py-0 px-2"
                              style={{ fontSize: '0.72rem' }}
                              onClick={() => setSelectedStudentForWarning(s)}
                            >
                              Dispatch Notice
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* SUB-VIEW 2: DAILY ATTENDANCE MARKER TOOL */}
      {/* =================================================================== */}
      {activeTab === 'attendance' && (
        <div className="erp-card p-4">
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4 pb-3 border-bottom" style={{ borderColor: 'var(--border-color)' }}>
            <div>
              <h5 className="fw-bold mb-1" style={{ color: 'var(--text-primary)' }}>
                <i className="bi bi-check2-square text-primary me-2"></i> Daily Class Attendance Marker
              </h5>
              <span className="text-muted small">Select class, date, and toggle attendance records for {activeCourse.course_title}</span>
            </div>

            {/* Attendance Controls */}
            <div className="d-flex flex-wrap align-items-center gap-2">
              <div className="d-flex align-items-center gap-1">
                <label className="text-muted small fw-semibold">Date:</label>
                <input
                  type="date"
                  className="form-control form-control-sm font-mono"
                  value={attendanceDate}
                  onChange={e => setAttendanceDate(e.target.value)}
                  style={{ width: '150px' }}
                />
              </div>
              <button
                type="button"
                className="btn btn-sm btn-outline-success"
                onClick={() => handleBulkAttendance('PRESENT')}
              >
                Mark All Present
              </button>
              <button
                type="button"
                className="btn btn-sm btn-outline-danger"
                onClick={() => handleBulkAttendance('ABSENT')}
              >
                Mark All Absent
              </button>
            </div>
          </div>

          {/* Student Search in Attendance */}
          <div className="mb-3">
            <input
              type="text"
              className="form-control form-control-sm"
              placeholder="Filter student by name or ID..."
              value={attendanceSearch}
              onChange={e => setAttendanceSearch(e.target.value)}
              style={{ maxWidth: '300px' }}
            />
          </div>

          {/* Student Toggle Table */}
          <div className="table-responsive mb-4">
            <table className="table table-hover align-middle mb-0 small">
              <thead className="table-light">
                <tr>
                  <th>Student ID</th>
                  <th>Student Name</th>
                  <th>Current Aggregate %</th>
                  <th className="text-center">Attendance for {attendanceDate}</th>
                </tr>
              </thead>
              <tbody>
                {enrolledStudents
                  .filter(s => !attendanceSearch || s.student_name.toLowerCase().includes(attendanceSearch.toLowerCase()) || s.student_id.toLowerCase().includes(attendanceSearch.toLowerCase()))
                  .map(s => {
                    const status = dailyAttendanceMap[s.student_id] || 'PRESENT';
                    return (
                      <tr key={s.student_id}>
                        <td className="font-mono fw-bold text-primary">{s.student_id}</td>
                        <td className="fw-semibold" style={{ color: 'var(--text-primary)' }}>{s.student_name}</td>
                        <td className="font-mono">{s.attendance_percentage}%</td>
                        <td className="text-center">
                          <div className="btn-group btn-group-sm" role="group">
                            <button
                              type="button"
                              className={`btn ${status === 'PRESENT' ? 'btn-success' : 'btn-outline-secondary'}`}
                              onClick={() => setDailyAttendanceMap({ ...dailyAttendanceMap, [s.student_id]: 'PRESENT' })}
                            >
                              <i className="bi bi-check-lg me-1"></i> Present
                            </button>
                            <button
                              type="button"
                              className={`btn ${status === 'ABSENT' ? 'btn-danger' : 'btn-outline-secondary'}`}
                              onClick={() => setDailyAttendanceMap({ ...dailyAttendanceMap, [s.student_id]: 'ABSENT' })}
                            >
                              <i className="bi bi-x-lg me-1"></i> Absent
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>

          <div className="d-flex justify-content-between align-items-center pt-3 border-top" style={{ borderColor: 'var(--border-color)' }}>
            <span className="text-muted small">
              Present: <strong>{Object.values(dailyAttendanceMap).filter(v => v === 'PRESENT').length}</strong> | Absent: <strong className="text-danger">{Object.values(dailyAttendanceMap).filter(v => v === 'ABSENT').length}</strong>
            </span>
            <div className="d-flex gap-2">
              <button type="button" className="btn btn-sm btn-secondary" onClick={() => setActiveTab('roster')}>Cancel</button>
              <button type="button" className="btn btn-sm btn-primary" onClick={handleSaveDailyAttendance}>
                <i className="bi bi-cloud-check-fill me-1"></i> Save Attendance Session
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* SUB-VIEW 3: INTERNAL ASSESSMENT MARKS ENTRY MODULE */}
      {/* =================================================================== */}
      {activeTab === 'marks' && (
        <div className="erp-card p-4">
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4 pb-3 border-bottom" style={{ borderColor: 'var(--border-color)' }}>
            <div>
              <h5 className="fw-bold mb-1" style={{ color: 'var(--text-primary)' }}>
                <i className="bi bi-pencil-square text-primary me-2"></i> Internal Assessment Grading Sheet
              </h5>
              <span className="text-muted small">Enter continuous internal assessment scores (Maximum Marks: {MAX_MARKS})</span>
            </div>

            {/* Assessment Type Selector & Class Average */}
            <div className="d-flex align-items-center gap-3">
              <select
                className="form-select form-select-sm"
                value={selectedAssessmentType}
                onChange={e => setSelectedAssessmentType(e.target.value)}
                style={{ width: '200px' }}
              >
                <option value="INTERNAL_1">Internal Assessment 1 (30 M)</option>
                <option value="INTERNAL_2">Internal Assessment 2 (30 M)</option>
                <option value="ASSIGNMENT">Assignment & Term Paper (10 M)</option>
                <option value="LAB_PRACTICAL">Laboratory Continuous Eval (25 M)</option>
              </select>
              <div className="p-2 rounded bg-light border text-center font-mono small">
                <span className="text-muted d-block" style={{ fontSize: '0.65rem' }}>Class Average</span>
                <strong className="text-primary">{classAvgMark} / {MAX_MARKS}</strong>
              </div>
            </div>
          </div>

          {/* Student Marks Table with Live Max-Mark Validation */}
          <div className="table-responsive mb-4">
            <table className="table table-hover align-middle mb-0 small">
              <thead className="table-light">
                <tr>
                  <th>Student ID</th>
                  <th>Student Name</th>
                  <th>Internal Score (out of {MAX_MARKS})</th>
                  <th>Performance Standing</th>
                </tr>
              </thead>
              <tbody>
                {enrolledStudents.map(s => {
                  const val = editingMarks[s.student_id] ?? s.internal_marks ?? 20;
                  const err = marksErrors[s.student_id];
                  return (
                    <tr key={s.student_id}>
                      <td className="font-mono fw-bold text-primary">{s.student_id}</td>
                      <td className="fw-semibold" style={{ color: 'var(--text-primary)' }}>{s.student_name}</td>
                      <td style={{ width: '220px' }}>
                        <div className="input-group input-group-sm">
                          <input
                            type="number"
                            className={`form-control font-mono ${err ? 'is-invalid border-danger' : ''}`}
                            min="0"
                            max={MAX_MARKS}
                            value={val}
                            onChange={e => handleMarkChange(s.student_id, e.target.value)}
                          />
                          <span className="input-group-text">/ {MAX_MARKS}</span>
                        </div>
                        {err && (
                          <div className="text-danger small mt-1" style={{ fontSize: '0.72rem' }}>
                            <i className="bi bi-exclamation-circle me-1"></i> {err}
                          </div>
                        )}
                      </td>
                      <td>
                        {val >= 25 ? (
                          <span className="badge bg-success-subtle text-success border border-success-subtle">Distinction (&ge; 85%)</span>
                        ) : val >= 15 ? (
                          <span className="badge bg-primary-subtle text-primary border border-primary-subtle">Good Standing</span>
                        ) : (
                          <span className="badge bg-danger-subtle text-danger border border-danger-subtle">Remedial Support (&lt; 50%)</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="d-flex justify-content-end gap-2 pt-3 border-top" style={{ borderColor: 'var(--border-color)' }}>
            <button type="button" className="btn btn-sm btn-secondary" onClick={() => setActiveTab('roster')}>Cancel</button>
            <button type="button" className="btn btn-sm btn-primary" onClick={handleSaveMarks}>
              <i className="bi bi-save-fill me-1"></i> Submit Grade Sheet
            </button>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* SUB-VIEW 4: AT-RISK ATTENDANCE WARNINGS */}
      {/* =================================================================== */}
      {activeTab === 'warnings' && (
        <div className="erp-card p-4">
          <div className="mb-4 pb-2 border-bottom" style={{ borderColor: 'var(--border-color)' }}>
            <h5 className="fw-bold mb-1" style={{ color: 'var(--text-primary)' }}>
              <i className="bi bi-exclamation-triangle-fill text-danger me-2"></i> Attendance Shortage & Debarment Warnings
            </h5>
            <span className="text-muted small">
              Students in {activeCourse.course_code} ({activeCourse.section}) with aggregate attendance below the statutory 75% threshold
            </span>
          </div>

          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0 small">
              <thead className="table-light">
                <tr>
                  <th>Student ID</th>
                  <th>Student Name</th>
                  <th>Classes Attended</th>
                  <th>Classes Missed</th>
                  <th className="text-center">Current %</th>
                  <th className="text-center">Classes Needed to Reach 75%</th>
                  <th className="text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                {atRiskStudents.map(s => {
                  const needed = Math.max(0, Math.ceil((0.75 * s.total_classes - s.classes_attended) / 0.25));
                  return (
                    <tr key={s.student_id}>
                      <td className="font-mono fw-bold text-primary">{s.student_id}</td>
                      <td className="fw-semibold" style={{ color: 'var(--text-primary)' }}>{s.student_name}</td>
                      <td className="font-mono text-center">{s.classes_attended}</td>
                      <td className="font-mono text-center text-danger">{s.total_classes - s.classes_attended}</td>
                      <td className="text-center font-mono fw-bold text-danger">{s.attendance_percentage}%</td>
                      <td className="text-center">
                        <span className="badge bg-danger-subtle text-danger border border-danger-subtle">
                          Must attend {needed} consecutive classes
                        </span>
                      </td>
                      <td className="text-center">
                        <button
                          type="button"
                          className="btn btn-sm btn-danger py-1 px-2"
                          style={{ fontSize: '0.75rem' }}
                          onClick={() => handleDispatchWarning(s)}
                        >
                          <i className="bi bi-send-fill me-1"></i> Dispatch Notice
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* SUB-VIEW 5: MENTORSHIP & COUNSELING LOGS */}
      {/* =================================================================== */}
      {activeTab === 'mentoring' && (
        <div className="erp-card p-4">
          <div className="d-flex justify-content-between align-items-center mb-4 pb-2 border-bottom" style={{ borderColor: 'var(--border-color)' }}>
            <div>
              <h5 className="fw-bold mb-1" style={{ color: 'var(--text-primary)' }}>
                <i className="bi bi-chat-left-text-fill text-primary me-2"></i> Faculty Advisee Mentorship & Counseling Log
              </h5>
              <span className="text-muted small">Record and track academic guidance sessions and remediation plans</span>
            </div>
            <button
              type="button"
              className="btn btn-sm btn-primary"
              onClick={() => setShowLogModal(true)}
            >
              <i className="bi bi-plus-lg me-1"></i> New Counseling Entry
            </button>
          </div>

          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0 small">
              <thead className="table-light">
                <tr>
                  <th>Date</th>
                  <th>Student ID</th>
                  <th>Student Name</th>
                  <th>Course</th>
                  <th>Discussion Topic</th>
                  <th>Agreed Remedial Action</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {mentorshipLogs.map(log => (
                  <tr key={log.id}>
                    <td>{log.date}</td>
                    <td className="font-mono fw-bold text-primary">{log.student_id}</td>
                    <td className="fw-semibold" style={{ color: 'var(--text-primary)' }}>{log.student_name}</td>
                    <td><span className="badge bg-light text-dark border font-mono">{log.course_code}</span></td>
                    <td className="fw-semibold">{log.topic}</td>
                    <td className="text-muted">{log.action}</td>
                    <td>
                      <span className="badge bg-warning-subtle text-warning border border-warning-subtle">
                        {log.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL: LOG COUNSELING SESSION */}
      {showLogModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(15,23,42,0.65)', backdropFilter: 'blur(6px)' }} tabIndex="-1">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
              <div className="modal-header bg-dark text-white p-3 px-4">
                <h6 className="modal-title fw-bold">Log Advisee Counseling Session</h6>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowLogModal(false)}></button>
              </div>
              <form onSubmit={handleSaveLog}>
                <div className="modal-body p-4 bg-light small">
                  <div className="mb-3">
                    <label className="form-label fw-semibold">Student ID & Name</label>
                    <select
                      className="form-select form-select-sm"
                      value={newLog.student_id}
                      onChange={e => {
                        const s = enrolledStudents.find(stu => stu.student_id === e.target.value);
                        setNewLog({ ...newLog, student_id: e.target.value, student_name: s ? s.student_name : '' });
                      }}
                      required
                    >
                      <option value="">Select Enrolled Advisee Student...</option>
                      {enrolledStudents.map(s => (
                        <option key={s.student_id} value={s.student_id}>
                          {s.student_id} — {s.student_name} ({s.attendance_percentage}%)
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-semibold">Counseling Topic</label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      placeholder="e.g. Attendance Shortage & Remedial Makeup Plan"
                      value={newLog.topic}
                      onChange={e => setNewLog({ ...newLog, topic: e.target.value })}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-semibold">Agreed Action Plan</label>
                    <textarea
                      className="form-control form-control-sm"
                      rows="3"
                      placeholder="e.g. Student agreed to attend Saturday lab sessions and submit assignments by Friday."
                      value={newLog.action}
                      onChange={e => setNewLog({ ...newLog, action: e.target.value })}
                    />
                  </div>
                </div>
                <div className="modal-footer bg-white p-3">
                  <button type="button" className="btn btn-sm btn-secondary" onClick={() => setShowLogModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-sm btn-primary">Save Session Record</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: DISPATCH ATTENDANCE WARNING */}
      {selectedStudentForWarning && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(15,23,42,0.65)', backdropFilter: 'blur(6px)' }} tabIndex="-1">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
              <div className="modal-header bg-danger text-white p-3 px-4">
                <h6 className="modal-title fw-bold">Official Statutory Attendance Warning</h6>
                <button type="button" className="btn-close btn-close-white" onClick={() => setSelectedStudentForWarning(null)}></button>
              </div>
              <div className="modal-body p-4 bg-light small">
                <p>
                  You are preparing to dispatch a formal <strong>Statutory Debarment Warning</strong> to:
                </p>
                <div className="p-3 bg-white rounded-3 border mb-3">
                  <div><strong>Student Name:</strong> {selectedStudentForWarning.student_name}</div>
                  <div><strong>Student ID:</strong> <span className="font-mono">{selectedStudentForWarning.student_id}</span></div>
                  <div><strong>Course Code:</strong> {activeCourse.course_code} - {activeCourse.course_title}</div>
                  <div><strong>Current Attendance:</strong> <span className="text-danger fw-bold">{selectedStudentForWarning.attendance_percentage}%</span> (Minimum 75% required)</div>
                </div>
                <p className="text-muted mb-0">
                  This notice will be recorded on the student's institutional dashboard and dispatched to their registered email address.
                </p>
              </div>
              <div className="modal-footer bg-white p-3">
                <button type="button" className="btn btn-sm btn-secondary" onClick={() => setSelectedStudentForWarning(null)}>Cancel</button>
                <button type="button" className="btn btn-sm btn-danger" onClick={() => handleDispatchWarning(selectedStudentForWarning)}>
                  Confirm & Dispatch Notice
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
