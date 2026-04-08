from fastapi import FastAPI, UploadFile, File, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from pymongo import MongoClient
from datetime import datetime

import shutil
import os
import re
import json
import jwt
from model import call_ollama

# ------------------ APP INIT ------------------
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# ------------------ JWT CONFIG ------------------
JWT_SECRET = os.getenv(
    "JWT_SECRET",
    "24577cc33d1e6be5bdde23fdae34c85810674271db246a58ddfe960298b2c59f01c07a7ea1f9776baaf0102d26103b413c3523f9740026d9bf1bcb448d48e534"
)
JWT_ALGORITHM = "HS256"

security = HTTPBearer()

# ------------------ AUTH ------------------
async def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials

    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")


def require_roles(allowed_roles: list):
    def role_checker(user: dict = Depends(verify_token)):
        if user.get("role") not in allowed_roles:
            raise HTTPException(
                status_code=403,
                detail="You do not have permission to access this resource"
            )
        return user
    return role_checker


# ------------------ MONGODB ------------------
MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017/")
client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=5000)
db = client["resume_db"]
collection = db["resumes"]

# Lazy index creation to avoid startup crash
try:
    # We do a quick check but don't block the whole app if it fails
    collection.create_index("skills")
except Exception as e:
    print(f"⚠️ Warning: Could not create MongoDB index on startup: {e}")

# ------------------ DOCLING ------------------
converter = None

def get_converter():
    global converter
    if converter is None:
        from docling.document_converter import DocumentConverter
        converter = DocumentConverter()
    return converter

def extract_text(file_path):
    try:
        conv = get_converter()
        result = conv.convert(file_path)
        return result.document.export_to_text()
    except Exception as e:
        print("Docling error:", e)
        return ""


# ------------------ REGEX EXTRACTION ------------------
def extract_with_regex(text):
    info = {"name": None, "email": None, "phone": None, "github": None, "linkedin": None, "portfolio": None}

    email_match = re.search(r'[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}', text)
    if email_match:
        info["email"] = email_match.group()

    phone_match = re.search(r'(?:\+?\d{1,3}[\s\-]?)?(?:\(?\d{2,5}\)?[\s\-]?)?\d{5}[\s\-]?\d{5}', text)
    if not phone_match:
        phone_match = re.search(r'(?:\+?\d{1,3}[\s\-]?)?\d{10}', text)
    if phone_match:
        digits = re.sub(r'\D', '', phone_match.group())
        if len(digits) >= 10:
            info["phone"] = digits[-10:]

    # GitHub profile URL
    github_match = re.search(r'(?:https?://)?(?:www\.)?github\.com/[a-zA-Z0-9_\-]+', text)
    if github_match:
        url = github_match.group()
        if not url.startswith('http'):
            url = 'https://' + url
        info["github"] = url

    # LinkedIn profile URL
    linkedin_match = re.search(r'(?:https?://)?(?:www\.)?linkedin\.com/in/[a-zA-Z0-9_\-]+', text)
    if linkedin_match:
        url = linkedin_match.group()
        if not url.startswith('http'):
            url = 'https://' + url
        info["linkedin"] = url

    # Portfolio / personal website (common patterns)
    portfolio_match = re.search(
        r'(?:https?://)?(?:www\.)?(?!github\.com|linkedin\.com)[a-zA-Z0-9_\-]+\.(?:dev|io|me|com|net|org|portfolio|site|vercel\.app|netlify\.app|pages\.dev)(?:/[^\s]*)?',
        text
    )
    if portfolio_match:
        url = portfolio_match.group()
        if not url.startswith('http'):
            url = 'https://' + url
        info["portfolio"] = url

    # Name — typically the first non-empty line
    lines = text.strip().split('\n')
    for line in lines:
        cleaned = line.strip()
        if not cleaned:
            continue
        if '@' in cleaned or re.match(r'^[\d\+\(\)\-\s]+$', cleaned):
            continue
        if re.match(r'^(http|www|resume|curriculum|cv\b)', cleaned, re.IGNORECASE):
            continue
        if len(cleaned) < 50 and re.match(r'^[A-Za-z\s\.\-]+$', cleaned):
            info["name"] = cleaned.strip()
            break

    return info


# ------------------ PROMPT ------------------
def build_prompt(text):
    return f"""Extract all structured data from this resume.
Return ONLY a valid JSON object with these keys:

- name: string
- email: string
- phone: string
- github: string (GitHub profile URL, or null if not found)
- linkedin: string (LinkedIn profile URL, or null if not found)
- portfolio: string (personal website / portfolio URL, or null if not found)
- skills: array of ALL technical skills (strings)
- experience: array of ALL jobs, each with keys: company, role, duration, description, skills_used (array)
- projects: array of ALL projects, each with keys: name, description, skills_used (array), github_link (string or null), live_demo (string or null)
- target_role: single string, best job title for this person

For projects:
- github_link: the GitHub repository URL for this specific project (NOT the profile URL)
- live_demo: the deployed/live URL for this project (e.g. vercel, netlify, heroku links)
- If no link is found, set to null

INCLUDE EVERY experience and EVERY project. Do not skip any.
Extract ONLY from the resume text. Do not make up data.
Return valid JSON only. No explanation.

RESUME:
{text}

JSON:
"""


# ------------------ CLEAN JSON ------------------
def clean_json(text):
    try:
        return json.loads(text)
    except:
        try:
            start = text.find("{")
            end = text.rfind("}")
            if start != -1 and end != -1:
                return json.loads(text[start:end+1])
        except:
            pass

    return {"error": "Invalid JSON", "raw": text}


# ------------------ SKILL NORMALIZATION ------------------
def normalize_skills(skills):
    mapping = {
        "react.js": "React",
        "reactjs": "React",
        "nodejs": "Node.js",
    }

    return list(set([
        mapping.get(skill.lower(), skill)
        for skill in skills
    ]))


# ------------------ PARSE ROUTE ------------------
@app.post("/parse")
async def parse_resume(
    file: UploadFile = File(...)
):
    file_path = os.path.join(UPLOAD_DIR, file.filename)

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    text = extract_text(file_path)[:6000]
    print("Extracted Text:", text[:500])

    # Step 1: Regex extraction (reliable for name/email/phone)
    regex_data = extract_with_regex(text)
    print("Regex extracted:", regex_data)

    # Step 2: LLM extraction (skills/experience/projects)
    prompt = build_prompt(text)
    print("Prompt Length:", len(prompt))

    result = call_ollama(prompt)
    llm_data = clean_json(result)
    print("LLM extracted keys:", list(llm_data.keys()) if isinstance(llm_data, dict) else "error")

    # Step 3: Normalize skills
    skills = normalize_skills(llm_data.get("skills", []))

    # Step 4: Merge — regex values always override LLM values
    final = {
        "name": regex_data["name"] or llm_data.get("name"),
        "email": regex_data["email"] or llm_data.get("email"),
        "phone": regex_data["phone"] or llm_data.get("phone"),
        "github": regex_data["github"] or llm_data.get("github"),
        "linkedin": regex_data["linkedin"] or llm_data.get("linkedin"),
        "portfolio": regex_data["portfolio"] or llm_data.get("portfolio"),
        "skills": skills,
        "experience": llm_data.get("experience", []),
        "projects": llm_data.get("projects", []),
        "target_role": llm_data.get("target_role"),
    }

    # Step 5: Save to MongoDB (use a copy so _id doesn't leak into response)
    doc_to_save = {
        **final,
        "uploaded_at": datetime.utcnow(),
    }
    collection.insert_one(doc_to_save)

    print("Final merged data:", json.dumps(final, indent=2, default=str))

    return {"success": True, "data": final}


# ------------------ SEARCH (HR / ADMIN / INTERVIEWER) ------------------
@app.get("/search")
def search_resumes(
    skill: str,
    user: dict = Depends(require_roles(["hr", "admin", "interviewer"]))
):
    results = list(
        collection.find(
            {"skills": {"$regex": skill, "$options": "i"}},
            {"_id": 0}
        )
    )

    return {"success": True, "count": len(results), "data": results}


# ------------------ MULTI SEARCH ------------------
@app.get("/search-multiple")
def search_multiple(
    skills: str,
    user: dict = Depends(require_roles(["hr", "admin", "interviewer"]))
):
    skill_list = skills.split(",")

    query = {
        "skills": {
            "$elemMatch": {
                "$regex": "|".join(skill_list),
                "$options": "i"
            }
        }
    }

    results = list(collection.find(query, {"_id": 0}))

    return {"success": True, "count": len(results), "data": results}


# ------------------ ADMIN ONLY ------------------
@app.get("/admin")
def admin_only(user: dict = Depends(require_roles(["admin"]))):
    return {"message": "Admin access granted"}
