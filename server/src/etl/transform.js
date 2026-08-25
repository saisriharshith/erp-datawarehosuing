/**
 * ETL Transform Stage (Pure Node.js)
 * Transforms raw ERP datasets into Star Schema Dimensions & Facts.
 */

const DEPT_MAP = {
  "CSE": "DEPT_CSE", "Computer Science": "DEPT_CSE", "Comp Sci": "DEPT_CSE", "CS": "DEPT_CSE", "CSE Dept": "DEPT_CSE", "DEPT_CSE": "DEPT_CSE",
  "ECE": "DEPT_ECE", "Electronics": "DEPT_ECE", "ECE Dept": "DEPT_ECE", "ECE Engg": "DEPT_ECE", "Electronics & Comm": "DEPT_ECE", "DEPT_ECE": "DEPT_ECE",
  "MECH": "DEPT_MECH", "Mechanical": "DEPT_MECH", "Mech Dept": "DEPT_MECH", "Mechanical Engg": "DEPT_MECH", "Mech": "DEPT_MECH", "DEPT_MECH": "DEPT_MECH",
  "Civil": "DEPT_CIVIL", "CIVIL": "DEPT_CIVIL", "Civil Engg": "DEPT_CIVIL", "civil": "DEPT_CIVIL", "Civil Dept": "DEPT_CIVIL", "DEPT_CIVIL": "DEPT_CIVIL",
  "AI & DS": "DEPT_AIDS", "AIDS": "DEPT_AIDS", "AI-DS": "DEPT_AIDS", "Data Science": "DEPT_AIDS", "Artificial Intelligence": "DEPT_AIDS", "DEPT_AIDS": "DEPT_AIDS"
};

const DEPT_NAMES = {
  "DEPT_CSE": "Computer Science & Engineering",
  "DEPT_ECE": "Electronics & Communication Engineering",
  "DEPT_MECH": "Mechanical Engineering",
  "DEPT_CIVIL": "Civil Engineering",
  "DEPT_AIDS": "Artificial Intelligence & Data Science"
};

export function transformData(rawData) {
  console.log('[ETL-TRANSFORM] Standardizing schema into Star Schema Dimensions and Fact tables...');

  // 1. dim_departments
  const dimDepartments = (rawData.departments || []).map(d => ({
    _id: d.code,
    department_id: d.code,
    department_name: d.dept_name,
    short_code: d.short_name,
    hod_name: d.hod_incharge,
    intake_capacity: d.intake_capacity,
    established_year: d.est_year
  }));

  // 2. dim_subjects
  const dimSubjects = (rawData.subjects || []).map(s => ({
    _id: s.sub_code,
    subject_id: s.sub_code,
    subject_name: s.title,
    department_id: s.dept_code,
    semester: s.semester,
    credits: s.credits,
    is_elective: false
  }));

  // 3. dim_faculty
  const dimFaculty = (rawData.faculty || []).map(f => {
    const dId = DEPT_MAP[f.assigned_dept] || "DEPT_CSE";
    return {
      _id: f.fac_id,
      faculty_id: f.fac_id,
      faculty_name: f.faculty_name,
      department_id: dId,
      department_name: DEPT_NAMES[dId] || "Engineering",
      designation: f.designation,
      experience_years: f.experience_years,
      email: f.email,
      workload_hours_per_week: f.workload_hours_per_week
    };
  });

  // 4. dim_students (Deduplication by business student_id)
  const studentMap = {};
  const admissionsMap = {};
  (rawData.admissions || []).forEach(a => { admissionsMap[a.student_ref] = a; });

  (rawData.students || []).forEach(s => {
    const sId = s.raw_student_id;
    if (!studentMap[sId]) {
      const dId = DEPT_MAP[s.department] || "DEPT_CSE";
      const adm = admissionsMap[sId] || {};
      studentMap[sId] = {
        _id: sId,
        student_id: sId,
        first_name: s.first_name,
        last_name: s.last_name,
        full_name: `${s.first_name} ${s.last_name}`,
        gender: s.gender,
        date_of_birth: s.date_of_birth,
        email: s.contact_email || `${s.first_name.toLowerCase()}.${s.last_name.toLowerCase()}@example.com`,
        phone: s.contact_phone,
        department_id: dId,
        department_name: DEPT_NAMES[dId] || "Engineering",
        batch_year: s.admission_batch,
        current_semester: s.current_term,
        admission_quota: adm.entry_category || "Merit",
        merit_rank: adm.merit_score_rank || 15000,
        is_active: true,
        created_at: s.created_timestamp
      };
    }
  });
  const dimStudents = Object.values(studentMap);

  // 5. fact_attendance
  const factAttendance = (rawData.attendance || []).map(a => {
    const total = Math.max(1, a.total_conducted);
    const attended = Math.min(total, Math.max(0, a.attended_count));
    const pct = Number(((attended / total) * 100).toFixed(2));
    const status = pct >= 75.0 ? "Adequate" : (pct >= 65.0 ? "Shortage" : "Critical");

    return {
      _id: a.att_record_id,
      record_id: a.att_record_id,
      student_id: a.student_id,
      subject_id: a.subject_code,
      department_id: a.dept_id,
      semester: a.semester,
      academic_year: a.academic_year,
      total_classes: total,
      classes_attended: attended,
      attendance_percentage: pct,
      status,
      recorded_date: a.last_recorded_date
    };
  });

  // 6. fact_examinations
  const factExaminations = (rawData.examinations || []).map(e => {
    const internal = Math.min(30, Math.max(0, e.internal_marks_scored));
    const endSem = Math.min(70, Math.max(0, e.end_semester_marks_scored));
    const total = internal + endSem;

    let gradeLetter = "F";
    let gradePoint = 0.0;
    if (total >= 90) { gradeLetter = "O"; gradePoint = 10.0; }
    else if (total >= 80) { gradeLetter = "A+"; gradePoint = 9.0; }
    else if (total >= 70) { gradeLetter = "A"; gradePoint = 8.0; }
    else if (total >= 60) { gradeLetter = "B+"; gradePoint = 7.0; }
    else if (total >= 50) { gradeLetter = "B"; gradePoint = 6.0; }
    else if (total >= 40) { gradeLetter = "C"; gradePoint = 5.0; }

    return {
      _id: e.exam_record_id,
      exam_id: e.exam_record_id,
      student_id: e.student_id,
      subject_id: e.subject_code,
      department_id: e.dept_code,
      semester: e.semester,
      academic_year: e.academic_year,
      internal_marks_scored: internal,
      internal_marks_max: 30,
      end_semester_marks_scored: endSem,
      end_semester_marks_max: 70,
      total_marks: total,
      grade_letter: gradeLetter,
      grade_point: gradePoint,
      is_passed: total >= 40 && endSem >= 28
    };
  });

  // 7. fact_fees
  const factFees = (rawData.fees || []).map(f => {
    const due = f.fee_structure_total || 65000.0;
    const paid = Math.min(due, Math.max(0, f.amount_remitted || 0));
    const outstanding = due - paid;
    const status = outstanding === 0 ? "PAID" : (paid > 0 ? "PARTIAL" : "OVERDUE");

    return {
      _id: f.transaction_id,
      transaction_id: f.transaction_id,
      student_id: f.student_identifier,
      semester: f.semester_term,
      total_due: due,
      total_paid: paid,
      outstanding_balance: outstanding,
      payment_status: status,
      payment_mode: f.payment_mode,
      receipt_date: f.receipt_date
    };
  });

  // 8. fact_library
  const factLibrary = (rawData.library || []).map(l => ({
    _id: l.lib_card_id,
    card_id: l.lib_card_id,
    student_id: l.student_id,
    total_books_borrowed: l.lifetime_issues_count,
    active_borrowed_count: l.current_active_loans,
    overdue_books_count: l.overdue_items_count,
    unpaid_fines: l.fine_dues_amount
  }));

  return {
    dimensions: {
      dim_departments: dimDepartments,
      dim_subjects: dimSubjects,
      dim_faculty: dimFaculty,
      dim_students: dimStudents
    },
    facts: {
      fact_attendance: factAttendance,
      fact_examinations: factExaminations,
      fact_fees: factFees,
      fact_library: factLibrary
    }
  };
}
