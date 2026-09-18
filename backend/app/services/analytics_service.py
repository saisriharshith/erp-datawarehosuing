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
    CourseAttendanceStat,
    DailyTrendPoint,
    LecturerDashboardMetrics
)


class AnalyticsService:
    async def get_admin_dashboard(self, db: AsyncIOMotorDatabase) -> AdminDashboardMetrics:
        """Calculates live institutional attendance metrics for administrators."""
        total_students = await db.students.count_documents({})
        total_lecturers = await db.lecturers.count_documents({})
        total_courses = await db.courses.count_documents({})
        total_units = await db.units.count_documents({})

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
            "marked_at": {"$gte": today_start}
        })

        # Calculate today's percentage based on total eligible students
        if total_students > 0 and today_sessions_count > 0:
            expected_total = total_students * today_sessions_count
            today_percentage = round((today_present_count / expected_total) * 100.0, 1)
            today_percentage = min(100.0, today_percentage)
            today_absent_count = max(0, expected_total - today_present_count)
        else:
            today_percentage = 0.0
            today_absent_count = 0

        # 7-day attendance trend
        trends: List[DailyTrendPoint] = []
        for i in range(6, -1, -1):
            day = now - timedelta(days=i)
            d_start = datetime(day.year, day.month, day.day, 0, 0, 0, tzinfo=timezone.utc)
            d_end = d_start + timedelta(days=1)
            date_str = d_start.strftime("%b %d")

            day_present = await db.attendance_records.count_documents({
                "marked_at": {"$gte": d_start, "$lt": d_end}
            })
            day_sessions = await db.attendance_sessions.count_documents({
                "created_at": {"$gte": d_start, "$lt": d_end}
            })

            rate = round((day_present / max(1, total_students * max(1, day_sessions))) * 100.0, 1)
            trends.append(
                DailyTrendPoint(
                    date=date_str,
                    present=day_present,
                    total_sessions=day_sessions,
                    attendance_rate=min(100.0, rate)
                )
            )

        # Course attendance statistics
        course_stats: List[CourseAttendanceStat] = []
        courses_cursor = db.courses.find({"is_active": True}).limit(10)
        courses = await courses_cursor.to_list(length=10)

        for c in courses:
            cid = str(c["_id"])
            enrolled = await db.students.count_documents({"course_id": cid})
            course_records = await db.attendance_records.count_documents({"course_id": cid})
            course_sessions = await db.attendance_sessions.count_documents({"course_id": cid})

            if enrolled > 0 and course_sessions > 0:
                c_rate = round((course_records / (enrolled * course_sessions)) * 100.0, 1)
            else:
                c_rate = 0.0

            course_stats.append(
                CourseAttendanceStat(
                    course_code=c.get("course_code", ""),
                    course_title=c.get("title", ""),
                    total_enrolled=enrolled,
                    attendance_rate=min(100.0, c_rate)
                )
            )

        return AdminDashboardMetrics(
            total_students=total_students,
            total_lecturers=total_lecturers,
            total_courses=total_courses,
            total_units=total_units,
            active_sessions_now=active_sessions_now,
            today_sessions_count=today_sessions_count,
            today_attendance_percentage=today_percentage,
            today_present_count=today_present_count,
            today_absent_count=today_absent_count,
            attendance_trends=trends,
            course_stats=course_stats
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

        return LecturerDashboardMetrics(
            assigned_courses_count=len(assigned_courses),
            assigned_units_count=len(assigned_units),
            total_sessions_conducted=total_sessions,
            active_session_id=active_id,
            average_attendance_percentage=avg_attendance,
            recent_sessions=recent_sessions,
            unit_attendance_stats=unit_stats
        )


analytics_service = AnalyticsService()
