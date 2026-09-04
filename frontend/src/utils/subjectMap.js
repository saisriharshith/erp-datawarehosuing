export const SUBJECT_MAP = {
  // Mechanical Engineering
  "ME101": "Engineering Graphics & CAD",
  "MA101": "Engineering Mathematics I",
  "PH101": "Engineering Physics",
  "ME201": "Engineering Mechanics",
  "ME202": "Material Science & Metallurgy",
  "ME301": "Thermodynamics & Heat Transfer",
  "ME401": "Fluid Mechanics & Turbo Machinery",
  "ME501": "Manufacturing Technology & Processes",
  "ME502": "Kinematics & Dynamics of Machinery",
  "ME601": "Heat & Mass Transfer",
  "ME701": "Automobile Engineering & Powertrains",
  "ME801": "Robotics & Industrial Automation",

  // Computer Science & Engineering
  "CS101": "Programming in Python",
  "CS201": "Data Structures & Algorithms",
  "MA201": "Discrete Mathematics & Graph Theory",
  "CS202": "Digital Logic & Computer Design",
  "CS301": "Computer Organization & Architecture",
  "CS302": "Object Oriented Programming in Java",
  "CS401": "Database Management Systems",
  "CS402": "Design & Analysis of Algorithms",
  "CS501": "Operating Systems & Virtualization",
  "CS502": "Computer Networks & Security",
  "CS503": "Software Engineering & Agile",
  "CS601": "Full-Stack Web Technologies",
  "CS602": "Compiler Design & Language Trans",
  "CS701": "Cloud Computing & Distributed Systems",
  "CS801": "Cryptography & Network Defense",

  // Electronics & Communication Engineering
  "EC101": "Basic Electrical & Electronic Engg",
  "EC201": "Electronic Circuits & Solid State",
  "EC202": "Network Analysis & Filter Synthesis",
  "EC301": "Signals, Systems & Transforms",
  "EC302": "Electromagnetic Fields & Waves",
  "EC401": "Analog Communication Systems",
  "EC402": "Linear Integrated Circuits (Op-Amps)",
  "EC501": "Digital Signal Processing (DSP)",
  "EC502": "Microprocessors & Embedded ARM",
  "EC601": "VLSI Design & CMOS Circuits",
  "EC701": "Wireless Communications & 5G MIMO",
  "EC801": "Radar & Satellite Navigation",

  // Civil Engineering
  "CE101": "Basic Civil & Environmental Engg",
  "CE201": "Surveying & Geomatics",
  "CE301": "Strength of Materials & Mechanics",
  "CE401": "Building Construction & Concrete Tech",
  "CE501": "Structural Analysis I (Indeterminate)",
  "CE502": "Geotechnical & Soil Mechanics",
  "CE601": "Environmental Engg & Waste Treatment",
  "CE701": "Transportation & Highway Engg",
  "CE801": "Estimation, Costing & Valuation",

  // Artificial Intelligence & Data Science
  "AD101": "Foundations of AI & Data Science",
  "AD201": "Advanced Python & Scientific Computing",
  "AD301": "Statistical Inference & Probabilistic AI",
  "AD401": "Supervised & Unsupervised ML",
  "AD501": "Deep Learning & Transformer Models",
  "AD502": "Big Data Processing & Distributed Spark",
  "AD601": "Natural Language Processing (NLP)",
  "AD701": "Computer Vision & Visual Generative AI",
  "AD801": "MLOps, AI Ethics & Trustworthy AI"
};

export function getSubjectTitle(subjectId, departmentName = 'Engineering') {
  if (!subjectId) return 'Engineering Course';
  const cleanId = String(subjectId).trim().toUpperCase();
  if (SUBJECT_MAP[cleanId]) return SUBJECT_MAP[cleanId];
  return `${departmentName} Course (${cleanId})`;
}
