"""
Analytics Aggregation Service
Extracts live statistics and trends directly from MongoDB collections.
Never uses hardcoded mock numbers.
"""

from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase
from ..models.attendance import SessionStatus
from ..schemas.analytics_reports import (
    AdminDashboardMetrics,
    AtRiskStudent,
    CourseAttendanceStat,
    DailyTrendPoint,
    LecturerDashboardMetrics
)


class AnalyticsService:
    async def get_admin_dashboard(self, db: AsyncIOMotorDatabase) -> AdminDashboardMetrics:
        """Calculates live institutional attendance metrics for administrators."""
        total_students = await db.students.count_documents({})
        enrolled_students = await db.students.count_documents({
            "$or": [
                {"face_enrollment_status": "ENROLLED"},
                {"enrolled_samples_count": {"$gte": 1}}
            ]
        })
        total_lecturers = await db.lecturers.count_documents({})
        total_courses = await db.courses.count_documents({})
        total_units = await db.units.count_documents({})
        total_sessions = await db.attendance_sessions.count_documents({})

        now = datetime.now(timezone.utc)
        today_start = datetime(now.year, now.month, now.day, 0, 0, 0, tzinfo=timezone.utc)

        # Today's sessions
        today_sessions_count = await db.attendance_sessions.count_documents({
            "created_at": {"$gte": today_start}
        })
        active_sessions_now = await db.attendance_sessions.count_documents({
            "status": SessionStatus.ACTIVE
        })

        # Today's attendance records
        today_present_count = await db.attendance_records.count_documents({
            "marked_at": {"$gte": today_start},
            "status": "PRESENT"
        })

        # Calculate today's percentage based on total eligible students
        if total_students > 0 and today_sessions_count > 0:
            expected_total = total_students * today_sessions_count
            today_percentage = min(100.0, round((today_present_count / max(1, expected_total)) * 100.0, 1))
            today_absent_count = max(0, expected_total - today_present_count)
        else:
            today_percentage = 0.0
            today_absent_count = 0

        # Calculate institutional overall attendance rate across all historical sessions
        total_present_all_time = await db.attendance_records.count_documents({"status": "PRESENT"})
        all_sessions_cursor = db.attendance_sessions.find({})
        all_sessions = await all_sessions_cursor.to_list(length=1000)

        course_enrolled_cache: Dict[str, int] = {}
        total_expected_slots = 0
        for s in all_sessions:
            c_id = s.get("course_id")
            if c_id:
                if c_id not in course_enrolled_cache:
                    course_enrolled_cache[c_id] = await db.students.count_documents({
                        "$or": [{"course_id": c_id}, {"course_code": c_id}]
                    })
                total_expected_slots += course_enrolled_cache[c_id]
            else:
                total_expected_slots += total_students

        if total_expected_slots > 0:
            overall_attendance_rate = min(100.0, round((total_present_all_time / total_expected_slots) * 100.0, 1))
        elif total_students > 0 and total_sessions > 0:
            overall_attendance_rate = min(100.0, round((total_present_all_time / (total_students * total_sessions)) * 100.0, 1))
        else:
            overall_attendance_rate = 0.0

        # 7-day attendance trend trajectory
        trends: List[DailyTrendPoint] = []
        for i in range(6, -1, -1):
            day = now - timedelta(days=i)
            d_start = datetime(day.year, day.month, day.day, 0, 0, 0, tzinfo=timezone.utc)
            d_end = d_start + timedelta(days=1)
            date_str = d_start.strftime("%b %d")

            day_present = await db.attendance_records.count_documents({
                "marked_at": {"$gte": d_start, "$lt": d_end},
                "status": "PRESENT"
            })
            day_sessions = await db.attendance_sessions.count_documents({
                "created_at": {"$gte": d_start, "$lt": d_end}
            })

            rate = round((day_present / max(1, total_students * max(1, day_sessions))) * 100.0, 1)
            point = DailyTrendPoint(
                date=date_str,
                present=day_present,
                present_count=day_present,
                total_sessions=day_sessions,
                attendance_rate=min(100.0, rate)
            )
            trends.append(point)

        # Course attendance statistics
        course_stats: List[CourseAttendanceStat] = []
        courses_cursor = db.courses.find({"is_active": True}).limit(20)
        courses = await courses_cursor.to_list(length=20)

        for c in courses:
            cid = str(c["_id"])
            c_code = c.get("course_code", "")
            c_title = c.get("title") or c.get("name") or c_code
            enrolled = await db.students.count_documents({
                "$or": [{"course_id": cid}, {"course_id": c_code}]
            })
            course_records = await db.attendance_records.count_documents({
                "$or": [{"course_id": cid}, {"course_id": c_code}],
                "status": "PRESENT"
            })
            course_sessions = await db.attendance_sessions.count_documents({
                "$or": [{"course_id": cid}, {"course_id": c_code}]
            })

            if enrolled > 0 and course_sessions > 0:
                c_rate = min(100.0, round((course_records / (enrolled * course_sessions)) * 100.0, 1))
            else:
                c_rate = 0.0

            stat_obj = CourseAttendanceStat(
                course_code=c_code,
                course_title=c_title,
                course_name=c_title,
                total_enrolled=enrolled,
                attendance_rate=c_rate
            )
            course_stats.append(stat_obj)

        # Calculate At-Risk Students (< 75% attendance)
        at_risk_students: List[AtRiskStudent] = []
        all_students_cursor = db.students.find({}).limit(200)
        all_students = await all_students_cursor.to_list(length=200)

        courses_map: Dict[str, Any] = {str(c["_id"]): c for c in courses}
        for c in courses:
            if c.get("course_code"):
                courses_map[c["course_code"]] = c

        for s in all_students:
            s_id_str = str(s["_id"])
            s_reg = s.get("student_id") or s.get("registration_number") or ""
            s_name = s.get("full_name") or f"{s.get('first_name', '')} {s.get('last_name', '')}".strip() or s_reg
            cid = s.get("course_id")

            c_info = courses_map.get(str(cid)) if cid else None
            c_title = (c_info.get("title") or c_info.get("name") or cid or "General") if c_info else "General"
            c_code = (c_info.get("course_code") or "") if c_info else ""

            if cid:
                c_sess_count = await db.attendance_sessions.count_documents({
                    "$or": [{"course_id": str(cid)}, {"course_id": c_code}]
                })
            else:
                c_sess_count = 0

            id_matches = [m for m in [s_reg, s_id_str, s.get("student_id"), s.get("registration_number")] if m]
            attended_count = await db.attendance_records.count_documents({
                "student_id": {"$in": id_matches},
                "status": "PRESENT"
            })

            if c_sess_count > 0:
                student_total_sessions = c_sess_count
            elif total_sessions > 0:
                student_total_sessions = total_sessions
            else:
                student_total_sessions = 0

            if student_total_sessions > 0:
                rate = min(100.0, round((attended_count / student_total_sessions) * 100.0, 1))
            else:
                rate = 0.0

            if rate < 75.0:
                at_risk_students.append(
                    AtRiskStudent(
                        student_id=s_id_str,
                        student_name=s_name,
                        student_reg_no=s_reg,
                        course_name=c_title,
                        course_code=c_code,
                        attended_sessions=attended_count,
                        total_sessions=student_total_sessions,
                        attendance_rate=rate
                    )
                )

        at_risk_students.sort(key=lambda x: (x.attendance_rate, -x.total_sessions))

        return AdminDashboardMetrics(
            total_students=total_students,
            enrolled_students=enrolled_students,
            total_lecturers=total_lecturers,
            total_courses=total_courses,
            total_units=total_units,
            total_sessions=total_sessions,
            active_sessions_now=active_sessions_now,
            today_sessions_count=today_sessions_count,
            today_attendance_percentage=today_percentage,
            overall_attendance_rate=overall_attendance_rate,
            today_present_count=today_present_count,
            today_absent_count=today_absent_count,
            attendance_trends=trends,
            attendance_by_day=trends,
            course_stats=course_stats,
            course_attendance=course_stats,
            at_risk_students=at_risk_students
        )

    async def get_lecturer_dashboard(
        self,
        db: AsyncIOMotorDatabase,
        user_id: str
    ) -> LecturerDashboardMetrics:
        """Calculates live dashboard metrics for a specific lecturer."""
        lecturer = await db.lecturers.find_one({"user_id": user_id})
        assigned_courses = lecturer.get("assigned_courses", []) if lecturer else []
        assigned_units = lecturer.get("assigned_units", []) if lecturer else []

        total_sessions = await db.attendance_sessions.count_documents({"lecturer_id": user_id})
        active_session = await db.attendance_sessions.find_one({
            "lecturer_id": user_id,
            "status": SessionStatus.ACTIVE
        })
        active_id = str(active_session["_id"]) if active_session else None

        # Average attendance percentage across lecturer's sessions
        recent_cursor = db.attendance_sessions.find({"lecturer_id": user_id}).sort("created_at", -1).limit(5)
        recent_sessions_raw = await recent_cursor.to_list(length=5)

        recent_sessions = []
        total_present_sum = 0
        for s in recent_sessions_raw:
            s_dict = {
                "id": str(s["_id"]),
                "session_code": s.get("session_code"),
                "status": s.get("status"),
                "total_present": s.get("total_present", 0),
                "created_at": s.get("created_at").strftime("%Y-%m-%d %H:%M") if s.get("created_at") else ""
            }
            total_present_sum += s.get("total_present", 0)
            recent_sessions.append(s_dict)

        avg_attendance = round((total_present_sum / max(1, len(recent_sessions_raw))), 1)

        # Unit attendance stats
        unit_stats = []
        for uid in assigned_units:
            unit = await db.units.find_one({"_id": ObjectId(uid)}) if ObjectId.is_valid(uid) else None
            if unit:
                count = await db.attendance_records.count_documents({"unit_id": uid})
                unit_stats.append({
                    "unit_code": unit.get("unit_code"),
                    "name": unit.get("name"),
                    "total_marked": count
                })

        total_present_marked = await db.attendance_records.count_documents({
            "lecturer_id": user_id,
            "status": "PRESENT"
        })

        return LecturerDashboardMetrics(
            assigned_courses_count=len(assigned_courses),
            assigned_units_count=len(assigned_units),
            total_sessions_conducted=total_sessions,
            total_sessions=total_sessions,
            active_session_id=active_id,
            average_attendance_percentage=avg_attendance,
            average_turnout_rate=avg_attendance,
            total_present_marked=total_present_marked,
            recent_sessions=recent_sessions,
            unit_attendance_stats=unit_stats
        )


analytics_service = AnalyticsService()
