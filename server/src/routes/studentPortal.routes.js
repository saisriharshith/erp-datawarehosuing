/**
 * Personalized Student Hub & Goal Planner Routes
 * -----------------------------------------------
 * Returns strictly student-scoped profile, attendance compliance, examination history,
 * fee transactions, library loans, and plain-English academic health.
 */

import express from 'express';
import { getStudentProfile } from './students.routes.js';
import { successResponse, errorResponse } from '../utils/helpers.js';

const router = express.Router();

router.get('/student/portal-summary', async (req, res) => {
  const studentId = (req.query.student_id || 'STU20210001').trim().toUpperCase();

  try {
    const profile = await getStudentProfile(studentId);
    if (!profile) {
      return errorResponse(res, `Student record '${studentId}' not found`, 404);
    }

    const st = profile.student;
    const att = profile.attendance;
    const exams = profile.examinations;
    const fees = profile.fees;
    const lib = profile.library;
    const risk = profile.risk_assessment;

    const subjectDetails = [];
    const shortageAlerts = [];

    (att.subject_records || []).forEach(rec => {
      const pct = rec.attendance_percentage || 0;
      const total = rec.total_classes || 60;
      const attended = rec.classes_attended || 45;

      let needed = 0;
      if (pct < 75.0) {
        needed = Math.max(0, Math.ceil((0.75 * total - attended) / 0.25));
        shortageAlerts.push({
          subject_id: rec.subject_id,
          current_percentage: pct,
          classes_needed: needed
        });
      }

      subjectDetails.push({
        subject_id: rec.subject_id,
        semester: rec.semester,
        total_classes: total,
        classes_attended: attended,
        attendance_percentage: pct,
        status: rec.status,
        classes_needed_for_75: needed
      });
    });

    // SGPA trend by semester
    const semGpas = {};
    (exams.exam_records || []).forEach(ex => {
      const s = ex.semester || 1;
      if (!semGpas[s]) semGpas[s] = [];
      semGpas[s].push(ex.grade_point || 7.0);
    });

    const sgpaTrend = Object.keys(semGpas).sort((a, b) => Number(a) - Number(b)).map(s => {
      const vals = semGpas[s];
      return {
        semester: `Sem ${s}`,
        sgpa: Number((vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(2))
      };
    });

    // Personalized Recommendations
    const recs = [];
    if (att.overall_percentage < 75.0) {
      recs.push("Urgent: Attend all upcoming lectures to meet the mandatory 75% end-semester exam threshold.");
    } else {
      recs.push("Good job! Your attendance satisfies institutional exam eligibility criteria.");
    }

    if (exams.backlogs > 0) {
      recs.push(`You have ${exams.backlogs} pending backlog(s). Register for remedial classes during office hours.`);
    } else {
      recs.push("Academic standing is clear with zero active subject backlogs.");
    }

    if (fees.outstanding_balance > 0) {
      recs.push(`Fee reminder: An outstanding balance of ₹${fees.outstanding_balance.toLocaleString()} is pending for the semester.`);
    } else {
      recs.push("Semester tuition fees are fully settled with zero arrears.");
    }

    let evaluatedRisk = risk.risk_level;
    if (!evaluatedRisk || evaluatedRisk === 'LOW') {
      if (att.overall_percentage < 65 || exams.backlogs >= 2 || exams.cgpa < 6.0) {
        evaluatedRisk = 'HIGH';
      } else if (att.overall_percentage < 75 || exams.backlogs === 1 || exams.cgpa < 7.0) {
        evaluatedRisk = 'MEDIUM';
      } else {
        evaluatedRisk = 'LOW';
      }
    }

    return successResponse(res, {
      student: {
        student_id: st.student_id,
        full_name: st.full_name,
        department_id: st.department_id,
        department_name: st.department_name,
        semester: st.current_semester,
        batch_year: st.batch_year,
        email: st.email,
        admission_year: st.admission_year,
        admission_quota: st.admission_quota
      },
      summary_cards: {
        attendance_percentage: att.overall_percentage,
        is_exam_eligible: att.overall_percentage >= 75.0,
        cgpa: exams.cgpa,
        backlogs_count: exams.backlogs,
        fee_status: fees.status,
        fee_outstanding: fees.outstanding_balance,
        total_fee_due: fees.total_due,
        total_fee_paid: fees.total_paid,
        books_borrowed: lib.total_books_borrowed || 0,
        unpaid_fines: lib.unpaid_fines || 0,
        risk_level: evaluatedRisk
      },
      subject_attendance: subjectDetails,
      shortage_alerts: shortageAlerts,
      examination_records: exams.exam_records || [],
      sgpa_trend: sgpaTrend,
      fee_summary: fees,
      fee_transactions: fees.transactions || [],
      library_summary: lib,
      personalized_recommendations: recs
    }, 'Personal student portal summary fetched');
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
});

export default router;
