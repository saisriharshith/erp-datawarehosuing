"""
Synthetic ERP Data Generator
----------------------------
Generates realistic heterogeneous multi-department university ERP datasets with
controlled, quantifiable data quality anomalies to demonstrate ETL cleansing,
data quality scoring, and data warehouse ingestion.
"""

import json
import random
import os
from datetime import datetime, timedelta

# Seed for reproducibility
random.seed(42)

DEPARTMENTS_CONFIG = [
    {
        "dept_id": "DEPT_CSE",
        "name": "Computer Science & Engineering",
        "short_code": "CSE",
        "hod": "Dr. R. Ramanujan",
        "intake": 180,
        "established": 2002,
        "raw_synonyms": ["Computer Science", "CSE", "Comp Sci", "cs", "Computer Science & Engg", "CS-ENG"]
    },
    {
        "dept_id": "DEPT_ECE",
        "name": "Electronics & Communication Engineering",
        "short_code": "ECE",
        "hod": "Dr. Meenakshi Sundaram",
        "intake": 140,
        "established": 2004,
        "raw_synonyms": ["ECE", "Electronics", "Electronics & Comm", "E&CE", "ece dept"]
    },
    {
        "dept_id": "DEPT_MECH",
        "name": "Mechanical Engineering",
        "short_code": "MECH",
        "hod": "Dr. K. Vikram",
        "intake": 120,
        "established": 2001,
        "raw_synonyms": ["Mechanical", "MECH", "Mechanical Engg", "mech", "Mech Dept"]
    },
    {
        "dept_id": "DEPT_CIVIL",
        "name": "Civil Engineering",
        "short_code": "CIVIL",
        "hod": "Dr. S. Ananth",
        "intake": 100,
        "established": 2003,
        "raw_synonyms": ["Civil", "CIVIL", "Civil Engg", "civil", "Civil Dept"]
    },
    {
        "dept_id": "DEPT_AIDS",
        "name": "Artificial Intelligence & Data Science",
        "short_code": "AI&DS",
        "hod": "Dr. Priya Venkatesh",
        "intake": 120,
        "established": 2021,
        "raw_synonyms": ["AI & DS", "AIDS", "AI-DS", "Data Science", "Artificial Intelligence"]
    }
]

SUBJECT_TEMPLATES = {
    "DEPT_CSE": [
        {"code": "CS101", "title": "Programming in Python", "sem": 1, "credits": 4},
        {"code": "MA101", "title": "Engineering Mathematics I", "sem": 1, "credits": 4},
        {"code": "PH101", "title": "Engineering Physics", "sem": 1, "credits": 3},
        {"code": "CS201", "title": "Data Structures & Algorithms", "sem": 2, "credits": 4},
        {"code": "MA201", "title": "Discrete Mathematics", "sem": 2, "credits": 4},
        {"code": "CS202", "title": "Digital Logic & Computer Design", "sem": 2, "credits": 3},
        {"code": "CS301", "title": "Computer Organization & Architecture", "sem": 3, "credits": 3},
        {"code": "CS302", "title": "Object Oriented Programming in Java", "sem": 3, "credits": 4},
        {"code": "CS401", "title": "Database Management Systems", "sem": 4, "credits": 4},
        {"code": "CS402", "title": "Design & Analysis of Algorithms", "sem": 4, "credits": 4},
        {"code": "CS501", "title": "Operating Systems", "sem": 5, "credits": 4},
        {"code": "CS502", "title": "Computer Networks", "sem": 5, "credits": 4},
        {"code": "CS503", "title": "Software Engineering & Agile", "sem": 5, "credits": 3},
        {"code": "CS601", "title": "Web Technologies & Fullstack", "sem": 6, "credits": 3},
        {"code": "CS602", "title": "Compiler Design", "sem": 6, "credits": 4},
        {"code": "CS701", "title": "Cloud Computing & Distributed Systems", "sem": 7, "credits": 3},
        {"code": "CS801", "title": "Information Security & Cryptography", "sem": 8, "credits": 3}
    ],
    "DEPT_ECE": [
        {"code": "EC101", "title": "Basic Electrical & Electronics", "sem": 1, "credits": 4},
        {"code": "MA101", "title": "Engineering Mathematics I", "sem": 1, "credits": 4},
        {"code": "EC201", "title": "Electronic Circuits & Devices", "sem": 2, "credits": 4},
        {"code": "EC202", "title": "Network Analysis & Synthesis", "sem": 2, "credits": 3},
        {"code": "EC301", "title": "Signals & Systems", "sem": 3, "credits": 4},
        {"code": "EC302", "title": "Electromagnetic Fields", "sem": 3, "credits": 3},
        {"code": "EC401", "title": "Analog Communication Systems", "sem": 4, "credits": 3},
        {"code": "EC402", "title": "Linear Integrated Circuits", "sem": 4, "credits": 4},
        {"code": "EC501", "title": "Digital Signal Processing", "sem": 5, "credits": 4},
        {"code": "EC502", "title": "Microprocessors & Microcontrollers", "sem": 5, "credits": 4},
        {"code": "EC601", "title": "VLSI Design & Embedded Systems", "sem": 6, "credits": 3},
        {"code": "EC701", "title": "Wireless Communications & 5G", "sem": 7, "credits": 3},
        {"code": "EC801", "title": "Radar & Satellite Systems", "sem": 8, "credits": 3}
    ],
    "DEPT_MECH": [
        {"code": "ME101", "title": "Engineering Graphics & Design", "sem": 1, "credits": 4},
        {"code": "MA101", "title": "Engineering Mathematics I", "sem": 1, "credits": 4},
        {"code": "ME201", "title": "Engineering Mechanics", "sem": 2, "credits": 4},
        {"code": "ME202", "title": "Material Science & Metallurgy", "sem": 2, "credits": 3},
        {"code": "ME301", "title": "Thermodynamics & Heat Transfer", "sem": 3, "credits": 4},
        {"code": "ME401", "title": "Fluid Mechanics & Machinery", "sem": 4, "credits": 4},
        {"code": "ME501", "title": "Manufacturing Technology", "sem": 5, "credits": 4},
        {"code": "ME502", "title": "Kinematics & Dynamics of Machinery", "sem": 5, "credits": 3},
        {"code": "ME601", "title": "Heat & Mass Transfer", "sem": 6, "credits": 4},
        {"code": "ME701", "title": "Automobile Engineering", "sem": 7, "credits": 3},
        {"code": "ME801", "title": "Robotics & Automation Systems", "sem": 8, "credits": 3}
    ],
    "DEPT_CIVIL": [
        {"code": "CE101", "title": "Basic Civil Engineering", "sem": 1, "credits": 4},
        {"code": "MA101", "title": "Engineering Mathematics I", "sem": 1, "credits": 4},
        {"code": "CE201", "title": "Surveying & Geomatics", "sem": 2, "credits": 4},
        {"code": "CE301", "title": "Strength of Materials", "sem": 3, "credits": 4},
        {"code": "CE401", "title": "Building Construction & Materials", "sem": 4, "credits": 3},
        {"code": "CE501", "title": "Structural Analysis I", "sem": 5, "credits": 4},
        {"code": "CE502", "title": "Geotechnical Engineering", "sem": 5, "credits": 4},
        {"code": "CE601", "title": "Environmental Engineering", "sem": 6, "credits": 3},
        {"code": "CE701", "title": "Transportation Engineering", "sem": 7, "credits": 3},
        {"code": "CE801", "title": "Estimation & Costing", "sem": 8, "credits": 3}
    ],
    "DEPT_AIDS": [
        {"code": "AD101", "title": "Foundations of Data Science", "sem": 1, "credits": 4},
        {"code": "MA101", "title": "Engineering Mathematics I", "sem": 1, "credits": 4},
        {"code": "AD201", "title": "Data Structures & Python for AI", "sem": 2, "credits": 4},
        {"code": "AD301", "title": "Statistical Methods for AI", "sem": 3, "credits": 4},
        {"code": "AD401", "title": "Applied Machine Learning", "sem": 4, "credits": 4},
        {"code": "AD501", "title": "Deep Learning & Neural Networks", "sem": 5, "credits": 4},
        {"code": "AD502", "title": "Big Data Analytics & Spark", "sem": 5, "credits": 3},
        {"code": "AD601", "title": "Natural Language Processing", "sem": 6, "credits": 3},
        {"code": "AD701", "title": "Computer Vision & Generative AI", "sem": 7, "credits": 3},
        {"code": "AD801", "title": "AI Ethics, Governance & MLOps", "sem": 8, "credits": 3}
    ]
}

FIRST_NAMES = [
    "Aarav", "Vivaan", "Aditya", "Vihaan", "Arjun", "Sai", "Reyansh", "Ayaan", "Krishna", "Ishaan",
    "Shaurya", "Atharv", "Ananya", "Diya", "Saanvi", "Aadhya", "Pari", "Anika", "Navya", "Riya",
    "Sneha", "Pooja", "Rahul", "Rohan", "Tanvi", "Kavya", "Varun", "Karthik", "Manish", "Naveen",
    "Divya", "Swati", "Neha", "Pranav", "Nikhil", "Deepak", "Vikram", "Shreya", "Meera", "Tarun"
]

LAST_NAMES = [
    "Sharma", "Verma", "Patel", "Reddy", "Rao", "Nair", "Iyer", "Gupta", "Singh", "Kumar",
    "Das", "Choudhury", "Bose", "Menon", "Joshi", "Kulkarni", "Deshmukh", "Pillai", "Bhat", "Mehta"
]

FACULTY_NAMES = [
    ("Dr. Rajeshwar Rao", "Professor", 18),
    ("Dr. Sunita Deshmukh", "Professor", 16),
    ("Dr. Amitabha Bose", "Associate Professor", 12),
    ("Dr. Kavita Kulkarni", "Associate Professor", 10),
    ("Mr. Senthil Kumar", "Assistant Professor", 6),
    ("Ms. Ananya Roy", "Assistant Professor", 4),
    ("Dr. Venkatesh Prasad", "Professor", 20),
    ("Dr. Preeti Shenoy", "Associate Professor", 11),
    ("Mr. Alok Mishra", "Assistant Professor", 5),
    ("Ms. Deepa Natarajan", "Assistant Professor", 7)
]

def format_date_with_noise(dt: datetime, anomaly_rate: float = 0.15) -> str:
    """Format date with intentional format variations."""
    if random.random() < anomaly_rate:
        fmt = random.choice([
            "%d/%m/%Y",       # 15/08/2024
            "%m-%d-%Y",       # 08-15-2024
            "%d-%m-%Y",       # 15-08-2024
            "%Y/%m/%d %H:%M"  # 2024/08/15 10:30
        ])
        return dt.strftime(fmt)
    return dt.strftime("%Y-%m-%d")


def generate_synthetic_erp_data(num_students: int = 600) -> dict:
    """
    Generates realistic ERP raw collections with controlled data anomalies.
    """
    print(f"Generating synthetic ERP dataset for {num_students} students...")
    
    # 1. Departments
    raw_departments = []
    for d in DEPARTMENTS_CONFIG:
        raw_departments.append({
            "code": d["dept_id"],
            "dept_name": d["name"],
            "short_name": d["short_code"],
            "hod_incharge": d["hod"],
            "intake_capacity": d["intake"],
            "est_year": d["established"]
        })

    # 2. Subjects
    raw_subjects = []
    for dept_id, subjects in SUBJECT_TEMPLATES.items():
        for sub in subjects:
            raw_subjects.append({
                "sub_code": sub["code"],
                "title": sub["title"],
                "dept_code": dept_id,
                "semester": sub["sem"],
                "credits": sub["credits"],
                "is_active": True
            })

    # 3. Faculty
    raw_faculty = []
    fac_counter = 100
    for dept in DEPARTMENTS_CONFIG:
        for name, desig, exp in FACULTY_NAMES[:6]:
            fac_counter += 1
            raw_faculty.append({
                "fac_id": f"FAC{fac_counter}",
                "faculty_name": name,
                "assigned_dept": random.choice(dept["raw_synonyms"]),  # Noise: synonym dept names
                "designation": desig,
                "experience_years": exp,
                "email": f"{name.lower().replace(' ', '.').replace('dr.', '').replace('mr.', '').replace('ms.', '').strip('.')}@univ.edu",
                "workload_hours_per_week": random.randint(12, 20)
            })

    # 4. Students & Admissions
    raw_students = []
    raw_admissions = []
    student_records_map = {}

    batch_years = [2021, 2022, 2023, 2024]
    quotas = ["Merit", "Merit", "Merit", "Management", "Sports", "NRI"]

    for i in range(1, num_students + 1):
        stu_id = f"STU{2020 + (i % 4) + 1}{i:04d}"
        fname = random.choice(FIRST_NAMES)
        lname = random.choice(LAST_NAMES)
        gender = "Female" if fname in ["Ananya", "Diya", "Saanvi", "Aadhya", "Pari", "Anika", "Navya", "Riya", "Sneha", "Pooja", "Tanvi", "Kavya", "Divya", "Swati", "Neha", "Shreya", "Meera"] else "Male"
        
        dept_obj = random.choice(DEPARTMENTS_CONFIG)
        batch = random.choice(batch_years)
        
        # Calculate semester based on batch year
        current_sem = min(8, max(1, (2025 - batch) * 2 - (1 if random.random() < 0.3 else 0)))
        
        dob_year = batch - 18
        dob_dt = datetime(dob_year, random.randint(1, 12), random.randint(1, 28))
        
        # Controlled anomalies: missing email in ~4%
        email = None if random.random() < 0.04 else f"{fname.lower()}.{lname.lower()}{random.randint(10, 99)}@example.com"
        # Noise: synonym dept
        dept_str = random.choice(dept_obj["raw_synonyms"])
        
        # Quota and rank
        quota = random.choice(quotas)
        entrance_rank = random.randint(500, 45000) if quota == "Merit" else random.randint(40000, 95000)
        adm_date = datetime(batch, random.randint(6, 8), random.randint(1, 28))

        student_doc = {
            "raw_student_id": stu_id,
            "first_name": fname,
            "last_name": lname,
            "gender": gender,
            "date_of_birth": format_date_with_noise(dob_dt, 0.20),
            "contact_email": email,
            "contact_phone": f"+91-{random.randint(7000000000, 9999999999)}",
            "department": dept_str,
            "admission_batch": batch,
            "current_sem": current_sem,
            "created_timestamp": datetime.now().isoformat()
        }
        raw_students.append(student_doc)

        # Admission document
        raw_admissions.append({
            "application_number": f"APP{batch}{i:05d}",
            "student_id": stu_id,
            "applicant_name": f"{fname} {lname}",
            "applied_department": dept_str,
            "quota_category": quota,
            "merit_rank": entrance_rank,
            "admission_date": format_date_with_noise(adm_date, 0.15),
            "verification_status": "VERIFIED"
        })

        # Save for fact generations
        student_records_map[stu_id] = {
            "dept_id": dept_obj["dept_id"],
            "semester": current_sem,
            "batch": batch,
            "quota": quota,
            # Base academic capability latent variable (0.4 to 1.0)
            "latent_ability": random.uniform(0.45, 0.95)
        }

    # Intentional Duplicate Students (~3% duplicates with duplicate IDs or re-registrations)
    duplicate_count = int(num_students * 0.03)
    for _ in range(duplicate_count):
        dup_source = random.choice(raw_students)
        dup_clone = dup_source.copy()
        # Slight variation in created timestamp or casing
        dup_clone["created_timestamp"] = (datetime.now() + timedelta(minutes=random.randint(1, 1000))).isoformat()
        raw_students.append(dup_clone)

    # 5. Attendance Records
    print("Generating attendance facts with realistic variance...")
    raw_attendance = []
    att_id_counter = 1

    for stu_id, meta in student_records_map.items():
        dept_id = meta["dept_id"]
        sem = meta["semester"]
        ability = meta["latent_ability"]
        
        # Get subjects for this semester (and earlier semesters)
        dept_subs = [s for s in SUBJECT_TEMPLATES[dept_id] if s["sem"] <= sem]
        
        for sub in dept_subs:
            total_classes = random.choice([50, 54, 60, 64])
            # Attendance correlates with student ability + random noise
            base_att_rate = min(0.98, max(0.40, ability + random.uniform(-0.25, 0.15)))
            classes_attended = int(total_classes * base_att_rate)
            
            # Controlled anomaly: ~2% out-of-range (> total_classes or < 0)
            anomaly_rand = random.random()
            if anomaly_rand < 0.015:
                classes_attended = total_classes + random.randint(2, 10)  # > 100% anomaly
            elif anomaly_rand < 0.025:
                classes_attended = -random.randint(1, 5)  # negative anomaly

            att_id_counter += 1
            raw_attendance.append({
                "att_record_id": f"ATT_{meta['batch']}_{att_id_counter:06d}",
                "student_id": stu_id,
                "subject_code": sub["code"],
                "dept_id": dept_id,
                "semester": sub["sem"],
                "academic_year": f"{meta['batch'] + (sub['sem'] - 1)//2}-{meta['batch'] + (sub['sem'] - 1)//2 + 1}",
                "total_conducted": total_classes,
                "attended_count": classes_attended,
                "last_recorded_date": format_date_with_noise(datetime(2024, random.randint(9, 11), random.randint(1, 28)), 0.10)
            })

    # 6. Examination Records
    print("Generating examination facts and grades...")
    raw_examinations = []
    exam_id_counter = 1

    for stu_id, meta in student_records_map.items():
        dept_id = meta["dept_id"]
        sem = meta["semester"]
        ability = meta["latent_ability"]
        
        dept_subs = [s for s in SUBJECT_TEMPLATES[dept_id] if s["sem"] <= sem]
        for sub in dept_subs:
            exam_id_counter += 1
            # Normal distribution around ability
            raw_internal = int(30 * min(0.98, max(0.30, ability + random.uniform(-0.20, 0.15))))
            raw_endsem = int(70 * min(0.98, max(0.25, ability + random.uniform(-0.22, 0.15))))

            # Controlled anomaly: ~2% out-of-range marks (> 70 or < 0 or missing)
            anom = random.random()
            if anom < 0.01:
                raw_endsem = 85  # Out of max 70
            elif anom < 0.02:
                raw_internal = -5  # Negative score

            raw_examinations.append({
                "exam_record_id": f"EXM_{meta['batch']}_{exam_id_counter:06d}",
                "student_id": stu_id,
                "subject_code": sub["code"],
                "semester": sub["sem"],
                "dept_code": dept_id,
                "academic_year": f"{meta['batch'] + (sub['sem'] - 1)//2}-{meta['batch'] + (sub['sem'] - 1)//2 + 1}",
                "internal_marks_scored": raw_internal,
                "internal_marks_max": 30,
                "end_semester_marks_scored": raw_endsem,
                "end_semester_marks_max": 70,
                "exam_month_year": "Nov-2024" if sub["sem"] % 2 != 0 else "May-2024"
            })

    # 7. Fees Records
    print("Generating fee billing and transaction facts...")
    raw_fees = []
    txn_id_counter = 1000

    for stu_id, meta in student_records_map.items():
        sem = meta["semester"]
        quota = meta["quota"]
        
        # Fee rates
        base_sem_fee = 75000 if quota == "Merit" else (125000 if quota == "Management" else 175000)
        
        for s in range(1, sem + 1):
            txn_id_counter += 1
            txn_id = f"TXN_{2024}_{txn_id_counter}"
            
            # Most students pay on time, some have partial or pending dues
            pay_behavior = random.random()
            if pay_behavior < 0.82:
                amount_paid = base_sem_fee
                status = "PAID"
            elif pay_behavior < 0.94:
                amount_paid = base_sem_fee - random.choice([15000, 25000, 35000])
                status = "PARTIAL"
            else:
                amount_paid = 0
                status = "OVERDUE"

            pay_date = datetime(2024, random.randint(7, 9), random.randint(1, 28))

            raw_fees.append({
                "transaction_id": txn_id,
                "student_id": stu_id,
                "semester": s,
                "academic_year": f"{meta['batch'] + (s - 1)//2}-{meta['batch'] + (s - 1)//2 + 1}",
                "total_due_amount": base_sem_fee,
                "amount_paid": amount_paid,
                "payment_status": status,
                "payment_mode": random.choice(["UPI", "NetBanking", "DemandDraft", "CreditCard"]),
                "transaction_date": format_date_with_noise(pay_date, 0.15)
            })

    # Duplicate Fee Transactions (~2% duplicates for testing deduplication)
    for _ in range(int(len(raw_fees) * 0.02)):
        dup_fee = random.choice(raw_fees).copy()
        raw_fees.append(dup_fee)

    # 8. Library Records
    print("Generating library circulation facts...")
    raw_library = []
    lib_id_counter = 1

    for stu_id, meta in student_records_map.items():
        ability = meta["latent_ability"]
        # Higher ability students tend to borrow more library books
        num_books = max(1, int(15 * ability + random.randint(-3, 5)))
        
        for _ in range(num_books):
            lib_id_counter += 1
            is_overdue = random.random() < 0.18
            fine_amount = random.choice([20, 50, 100]) if is_overdue else 0
            
            issue_dt = datetime(2024, random.randint(8, 10), random.randint(1, 25))
            return_dt = issue_dt + timedelta(days=random.randint(10, 30))

            raw_library.append({
                "trans_id": f"LIB_TXN_{lib_id_counter:06d}",
                "student_id": stu_id,
                "book_isbn": f"978-0-{random.randint(100000, 999999)}-{random.randint(0, 9)}",
                "issue_date": format_date_with_noise(issue_dt, 0.10),
                "return_date": format_date_with_noise(return_dt, 0.10) if not is_overdue else None,
                "is_overdue": is_overdue,
                "fine_charged": fine_amount,
                "fine_paid": fine_amount if (is_overdue and random.random() < 0.70) else 0
            })

    print(f"Data Generation Completed Successfully:")
    print(f"  • Students: {len(raw_students)} (Includes intentional duplicates)")
    print(f"  • Admissions: {len(raw_admissions)}")
    print(f"  • Departments: {len(raw_departments)}")
    print(f"  • Subjects: {len(raw_subjects)}")
    print(f"  • Faculty: {len(raw_faculty)}")
    print(f"  • Attendance Logs: {len(raw_attendance)}")
    print(f"  • Examination Logs: {len(raw_examinations)}")
    print(f"  • Fee Transactions: {len(raw_fees)}")
    print(f"  • Library Logs: {len(raw_library)}")

    return {
        "departments": raw_departments,
        "subjects": raw_subjects,
        "faculty": raw_faculty,
        "students": raw_students,
        "admissions": raw_admissions,
        "attendance": raw_attendance,
        "examinations": raw_examinations,
        "fees": raw_fees,
        "library": raw_library
    }

if __name__ == "__main__":
    data = generate_synthetic_erp_data(600)
    out_dir = os.path.join(os.path.dirname(__file__), "..", "data", "raw")
    os.makedirs(out_dir, exist_ok=True)
    out_file = os.path.join(out_dir, "raw_erp_data.json")
    with open(out_file, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)
    print(f"Saved raw snapshot to {out_file}")
