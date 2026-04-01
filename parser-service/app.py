from fastapi import FastAPI, UploadFile, File
from docling.document_converter import DocumentConverter
from pymongo import MongoClient
from datetime import datetime

import shutil
import os
import re
import requests
import json
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()
cors_origins = ["*"]  # Allow all origins for simplicity
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)


# -------- TEXT EXTRACTION (Docling) --------
converter = DocumentConverter()
def extract_text(file_path):
    try:
        result = converter.convert(file_path)
        return result.document.export_to_text()
    except Exception as e:
        print("Docling error:", e)
        return ""


# -------- REGEX EXTRACTION (reliable for name/email/phone) --------
def extract_with_regex(text):
    """Extract name, email, phone using regex — never hallucinates."""
    info = {"name": None, "email": None, "phone": None}

    # Email — very reliable
    email_match = re.search(r'[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}', text)
    if email_match:
        info["email"] = email_match.group()

    # Phone — Indian (10-digit) or international formats
    phone_match = re.search(r'(?:\+?\d{1,3}[\s\-]?)?(?:\(?\d{2,5}\)?[\s\-]?)?\d{5}[\s\-]?\d{5}', text)
    if not phone_match:
        phone_match = re.search(r'(?:\+?\d{1,3}[\s\-]?)?\d{10}', text)
    if phone_match:
        digits = re.sub(r'\D', '', phone_match.group())
        # Take last 10 digits for Indian numbers
        if len(digits) >= 10:
            info["phone"] = digits[-10:]

    # Name — typically the first non-empty line of a resume
    lines = text.strip().split('\n')
    for line in lines:
        cleaned = line.strip()
        # Skip empty lines, lines that look like emails/phones/URLs/headers
        if not cleaned:
            continue
        if '@' in cleaned or re.match(r'^[\d\+\(\)\-\s]+$', cleaned):
            continue
        if re.match(r'^(http|www|resume|curriculum|cv\b)', cleaned, re.IGNORECASE):
            continue
        # A name line is usually short (< 50 chars) and mostly letters
        if len(cleaned) < 50 and re.match(r'^[A-Za-z\s\.\-]+$', cleaned):
            info["name"] = cleaned.strip()
            break

    return info


# -------- LLM PROMPT (only for skills/experience/projects) --------
def build_prompt(text):
    return f"""Extract skills, work experience, projects, and target role from this resume.
Return ONLY a valid JSON object with these keys:

- skills: array of ALL technical skills (strings)
- experience: array of ALL jobs, each with keys: company, role, duration, description, skills_used (array)
- projects: array of ALL projects, each with keys: name, description, skills_used (array)
- target_role: single string, best job title for this person

INCLUDE EVERY experience and EVERY project. Do not skip any.
Extract ONLY from the resume text. Do not make up data.
Return valid JSON only. No explanation.

RESUME:
{text}

JSON:
"""


# -------- OLLAMA CALL --------
def call_ollama(prompt):
    try:
        response = requests.post(
            "http://localhost:11434/api/generate",
            json={
                "model": "gemma:2b",
                "prompt": prompt,
                "stream": False,
                "options": {
                  "temperature": 0,
                  "num_predict": 2048
                }
            }
        )

        data = response.json()

        print("Ollama RAW response:", data)  # DEBUG

        if "response" in data:
            return data["response"]
        else:
            return json.dumps(data)

    except Exception as e:
        return json.dumps({"error": str(e)})


# -------- CLEAN JSON --------
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

    return {
        "error": "Invalid JSON",
        "raw_output": text
    }


# -------- API ROUTE --------
@app.post("/parse")
async def parse_resume(file: UploadFile = File(...)):
    file_path = os.path.join(UPLOAD_DIR, file.filename)

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Extract text
    text = extract_text(file_path)

    # Limit text (important for LLM)
    text = text[:6000]
    print("Extracted Text:", text[:500])

    # Step 1: Regex extraction for name/email/phone (reliable)
    regex_data = extract_with_regex(text)
    print("Regex extracted:", regex_data)

    # Step 2: LLM extraction for skills/experience/projects
    prompt = build_prompt(text)
    print("Prompt Length:", len(prompt))

    result = call_ollama(prompt)
    llm_data = clean_json(result)
    print("LLM extracted keys:", list(llm_data.keys()) if isinstance(llm_data, dict) else "error")

    # Step 3: Merge — regex values always override LLM values
    final = {
        "name": regex_data["name"] or llm_data.get("name"),
        "email": regex_data["email"] or llm_data.get("email"),
        "phone": regex_data["phone"] or llm_data.get("phone"),
        "skills": llm_data.get("skills", []),
        "experience": llm_data.get("experience", []),
        "projects": llm_data.get("projects", []),
        "target_role": llm_data.get("target_role"),
    }

    print("Final merged data:", json.dumps(final, indent=2, default=str))

    # Save to MongoDB
    collection.insert_one({
        **final,
        "uploaded_at": datetime.utcnow()
    })

    return {
        "success": True,
        "data": final
    }

client = MongoClient("mongodb://localhost:27017/")
db = client["resume_db"]
collection = db["resumes"]


@app.get("/resumes")
def get_resumes():
    resumes = list(collection.find({}, {"_id":0}))
    return{
        "success": True,
        "count": len(resumes),
        "data":resumes
    }

@app.get("/search")
def search_resumes(skill:str):
    results = list(
        collection.find(
            {"skills" : {"$regex": skill, "$options": "i"}},
            {"_id":0}
        )
    )
    return{
        "success": True,
        "count": len(results),
        "data": results
    }

@app.get("/search-multiple")
def search_multiple(skills, str):
    skill_list = skills.split(",")

    results = list(
        collection.find(
            {"skills": {"$in": skill_list}},
            {"_id":0}
        )
    )

    return{
        "success": True,
        "count": len(results),
        "data": results
    }
