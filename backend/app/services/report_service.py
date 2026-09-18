"""
Multi-Format Attendance Reporting and Export Service
Supports CSV, Excel (.xlsx), and PDF generation with academic styling.
"""

import csv
import io
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase
import openpyxl
from openpyxl.styles import Alignment, Border, Font, PatternFill, Side
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle
from ..schemas.analytics_reports import ReportFilter, ReportRow, ReportSummaryResponse


class ReportService:
    async def get_report_data(
        self,
        db: AsyncIOMotorDatabase,
        filters: ReportFilter
    ) -> List[Dict[str, Any]]:
        """Queries attendance records with dynamic filtering and joins metadata."""
        query: Dict[str, Any] = {}

        if filters.course_id:
            query["course_id"] = filters.course_id
        if filters.unit_id:
            query["unit_id"] = filters.unit_id
        if filters.venue_id:
            query["venue_id"] = filters.venue_id
        if filters.lecturer_id:
            query["lecturer_id"] = filters.lecturer_id
        if filters.student_id:
            query["student_id"] = filters.student_id

        if filters.start_date or filters.end_date:
            date_filter: Dict[str, Any] = {}
            if filters.start_date:
                s_dt = datetime(filters.start_date.year, filters.start_date.month, filters.start_date.day, 0, 0, 0, tzinfo=timezone.utc)
                date_filter["$gte"] = s_dt
            if filters.end_date:
                e_dt = datetime(filters.end_date.year, filters.end_date.month, filters.end_date.day, 23, 59, 59, tzinfo=timezone.utc)
                date_filter["$lte"] = e_dt
            query["marked_at"] = date_filter

        cursor = db.attendance_records.find(query).sort("marked_at", -1)
        records = await cursor.to_list(length=10000)

        # Pre-cache lookup maps to enrich records
        courses = {str(c["_id"]): c for c in await db.courses.find().to_list(1000)}
        units = {str(u["_id"]): u for u in await db.units.find().to_list(1000)}
        venues = {str(v["_id"]): v for v in await db.venues.find().to_list(1000)}
        lecturers = {str(l["user_id"]): l for l in await db.lecturers.find().to_list(1000)}
        sessions = {str(s["_id"]): s for s in await db.attendance_sessions.find().to_list(5000)}

        enriched_rows = []
        for r in records:
            cid = r.get("course_id", "")
            uid = r.get("unit_id", "")
            vid = r.get("venue_id", "")
            lid = r.get("lecturer_id", "")
            sid = r.get("session_id", "")

            course = courses.get(cid, {})
            unit = units.get(uid, {})
            venue = venues.get(vid, {})
            lecturer = lecturers.get(lid, {})
            session = sessions.get(sid, {})

            marked_dt = r.get("marked_at")
            date_str = marked_dt.strftime("%Y-%m-%d") if marked_dt else ""
            time_str = marked_dt.strftime("%H:%M:%S") if marked_dt else ""
            marked_at_str = f"{date_str} {time_str}".strip() or "N/A"

            enriched_rows.append({
                "date": date_str,
                "time": time_str,
                "marked_at": marked_at_str,
                "student_id": r.get("student_id", ""),
                "student_name": r.get("student_name", "Unknown"),
                "course_code": course.get("course_code", cid),
                "course_title": course.get("title", ""),
                "unit_code": unit.get("unit_code", uid),
                "unit_name": unit.get("name", ""),
                "venue_code": venue.get("venue_code", vid),
                "lecturer_name": lecturer.get("full_name", lid),
                "session_code": session.get("session_code", sid),
                "status": r.get("status", "PRESENT"),
                "similarity_score": round(r.get("similarity_score", 1.0), 4),
            })
        return enriched_rows

    def export_csv(self, records: List[Dict[str, Any]]) -> io.BytesIO:
        """Generates a comma-separated attendance CSV file."""
        output = io.StringIO()
        fieldnames = [
            "Date", "Time", "Student ID", "Student Name",
            "Course Code", "Unit Code", "Unit Name", "Venue",
            "Lecturer", "Session Code", "Status", "Confidence"
        ]
        writer = csv.DictWriter(output, fieldnames=fieldnames)
        writer.writeheader()

        for r in records:
            writer.writerow({
                "Date": r["date"],
                "Time": r["time"],
                "Student ID": r["student_id"],
                "Student Name": r["student_name"],
                "Course Code": r["course_code"],
                "Unit Code": r["unit_code"],
                "Unit Name": r["unit_name"],
                "Venue": r["venue_code"],
                "Lecturer": r["lecturer_name"],
                "Session Code": r["session_code"],
                "Status": r["status"],
                "Confidence": f"{r['similarity_score'] * 100:.1f}%"
            })

        bytes_io = io.BytesIO()
        bytes_io.write(output.getvalue().encode("utf-8"))
        bytes_io.seek(0)
        return bytes_io

    def export_excel(
        self,
        records: List[Dict[str, Any]],
        title: str = "Attendance Report"
    ) -> io.BytesIO:
        """Generates a styled Excel sheet (.xlsx) using openpyxl."""
        wb = openpyxl.Workbook()
        ws = wb.active
        ws.title = "Attendance Records"

        # University Header
        ws.merge_cells("A1:K1")
        ws["A1"] = "COLLEGE ATTENDANCE MANAGEMENT SYSTEM"
        ws["A1"].font = Font(name="Calibri", size=16, bold=True, color="1E3A8A")
        ws["A1"].alignment = Alignment(horizontal="center", vertical="center")

        ws.merge_cells("A2:K2")
        ws["A2"] = f"Report: {title} | Generated: {datetime.now().strftime('%Y-%m-%d %H:%M')}"
        ws["A2"].font = Font(name="Calibri", size=11, italic=True, color="4B5563")
        ws["A2"].alignment = Alignment(horizontal="center", vertical="center")

        # Table Column Headers
        headers = [
            "Date", "Time", "Student ID", "Student Name",
            "Course", "Unit Code", "Unit Name", "Venue",
            "Lecturer", "Status", "Match Score"
        ]
        header_font = Font(name="Calibri", size=11, bold=True, color="FFFFFF")
        header_fill = PatternFill(start_color="1E3A8A", end_color="1E3A8A", fill_type="solid")
        thin_border = Border(
            left=Side(style='thin', color='D1D5DB'),
            right=Side(style='thin', color='D1D5DB'),
            top=Side(style='thin', color='D1D5DB'),
            bottom=Side(style='thin', color='D1D5DB')
        )

        for col_num, header_title in enumerate(headers, 1):
            cell = ws.cell(row=4, column=col_num)
            cell.value = header_title
            cell.font = header_font
            cell.fill = header_fill
            cell.alignment = Alignment(horizontal="center", vertical="center")
            cell.border = thin_border

        # Populate Data Rows
        present_fill = PatternFill(start_color="DCFCE7", end_color="DCFCE7", fill_type="solid")
        for row_idx, r in enumerate(records, 5):
            values = [
                r["date"], r["time"], r["student_id"], r["student_name"],
                r["course_code"], r["unit_code"], r["unit_name"], r["venue_code"],
                r["lecturer_name"], r["status"], f"{r['similarity_score'] * 100:.1f}%"
            ]
            for col_idx, val in enumerate(values, 1):
                cell = ws.cell(row=row_idx, column=col_idx)
                cell.value = val
                cell.border = thin_border
                cell.alignment = Alignment(horizontal="center" if col_idx in [1, 2, 8, 10, 11] else "left")
                if col_idx == 10 and val == "PRESENT":
                    cell.fill = present_fill

        # Auto-adjust column widths
        for col_idx in range(1, len(headers) + 1):
            col_letter = openpyxl.utils.get_column_letter(col_idx)
            max_len = 12
            for row in range(4, len(records) + 5):
                val = ws.cell(row=row, column=col_idx).value
                if val:
                    max_len = max(max_len, len(str(val)))
            ws.column_dimensions[col_letter].width = max_len + 3

        output = io.BytesIO()
        wb.save(output)
        output.seek(0)
        return output

    def export_pdf(
        self,
        records: List[Dict[str, Any]],
        title: str = "Official Attendance Report"
    ) -> io.BytesIO:
        """Generates a professional academic PDF document using ReportLab."""
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=letter,
            rightMargin=36,
            leftMargin=36,
            topMargin=36,
            bottomMargin=36
        )

        styles = getSampleStyleSheet()
        title_style = ParagraphStyle(
            'TitleStyle',
            parent=styles['Heading1'],
            fontSize=16,
            leading=20,
            textColor=colors.HexColor('#1E3A8A'),
            alignment=1
        )
        subtitle_style = ParagraphStyle(
            'SubStyle',
            parent=styles['Normal'],
            fontSize=10,
            leading=14,
            textColor=colors.HexColor('#4B5563'),
            alignment=1
        )

        elements = []
        elements.append(Paragraph("<b>INSTITUTE OF TECHNOLOGY & SCIENCE</b>", title_style))
        elements.append(Paragraph(f"<b>{title}</b>", subtitle_style))
        elements.append(Paragraph(f"Generated on {datetime.now().strftime('%B %d, %Y at %H:%M:%S')}", subtitle_style))
        elements.append(Spacer(1, 16))

        # Table data
        table_data = [
            ["Date", "Student ID", "Student Name", "Course", "Unit", "Venue", "Status"]
        ]
        for r in records[:500]:  # Limit to 500 records per PDF for memory
            table_data.append([
                r["date"],
                r["student_id"],
                r["student_name"][:16],
                r["course_code"],
                r["unit_code"],
                r["venue_code"],
                r["status"]
            ])

        t = Table(table_data, colWidths=[65, 80, 110, 60, 65, 60, 60])
        t.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1E3A8A')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('ALIGN', (2, 1), (2, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 8),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
            ('TOPPADDING', (0, 0), (-1, -1), 4),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#E5E7EB')),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#F9FAFB')])
        ]))
        elements.append(t)
        elements.append(Spacer(1, 20))
        elements.append(Paragraph(f"<b>Total Present Recorded:</b> {len(records)}", styles['Normal']))

        doc.build(elements)
        buffer.seek(0)
        return buffer


report_service = ReportService()
