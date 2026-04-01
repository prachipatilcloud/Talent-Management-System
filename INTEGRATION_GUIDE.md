# Parser-Service Integration Guide
**For: Talent Management System (TMS)**

---

## 📋 Current Architecture Analysis

### **Parser Service (Python - FastAPI)**
- **Location:** `parser-service/app.py`
- **Functionality:** Extracts structured data from resumes using Docling + Ollama LLM
- **Database:** Separate MongoDB collection (`resume_db.resumes`)
- **Endpoints:**
  - `POST /parse` - Parses resume and stores in MongoDB
  - `GET /resumes` - Fetches all parsed resumes
  - `GET /search?skill=X` - Single skill search
  - `GET /search-multiple?skills=X,Y,Z` - Multiple skills search

**Parsed Resume Structure:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "skills": ["Python", "React", "MongoDB"],
  "experience": [
    {
      "company": "Tech Corp",
      "role": "Developer",
      "duration": "2020-2023",
      "skills_used": ["Python", "FastAPI"]
    }
  ],
  "projects": [
    {
      "name": "Project Name",
      "skills_used": ["React", "Node.js"]
    }
  ],
  "target_role": "Full-Stack Developer",
  "uploaded_at": "2024-01-15T10:30:00Z"
}
```

### **Backend Server (Node.js - Express)**
- **Location:** `server/src`
- **Database:** MongoDB (candidates collection)
- **Current Resume Handling:**
  - Candidates are added manually via `POST /api/candidates`
  - Resume file uploaded → Google Drive
  - Skills added manually as an array

**Current Candidate Model:**
```javascript
{
  firstName, lastName, email, phone,
  skills: [String],           // Manual entry only
  experience: Number,
  jobRole: String,
  resume: { fileName, driveFileId, url },
  status: String,
  interviewRounds: Array,
  addedBy: ObjectId,
  timestamps
}
```

---

## ⚠️ Current Issues

1. **Data Silos:** Parsed resume data is in separate collection (`resume_db.resumes`)
2. **No Integration:** Candidate model doesn't have parsed data
3. **Duplicate Candidates:** If someone uploads a resume + HR also adds manually → two separate records
4. **Search Problem:** Skills search only works for manually added candidates OR parsed resumes, not both
5. **No Auto-population:** When resume is parsed, skills aren't automatically added to candidate

---

## ✅ Integration Solution

### **Step 1: Extend Candidate Model**
Add parsed resume data to the Candidate schema:

```javascript
// Additional fields in candidateSchema
parsedResumeData: {
  name: String,
  aiExtractedSkills: [String],           // Skills from parsed resume
  aiExtractedExperience: [
    {
      company: String,
      role: String,
      duration: String,
      description: String,
      skills_used: [String]
    }
  ],
  aiExtractedProjects: [
    {
      name: String,
      description: String,
      skills_used: [String]
    }
  ],
  targetRole: String,
  parsedAt: Date
},

// Track data source
skillsSources: {
  manual: [String],                     // HR manually added
  parsed: [String]                      // From parsed resume
},

hasParseData: {
  type: Boolean,
  default: false
}
```

### **Step 2: Create Parse & Create/Link Candidate Endpoint**
New endpoint to handle resume upload → parse → store integrated data

```
POST /api/candidates/parse-resume
- Accepts: Resume file + basic candidate info
- Flow:
  1. Check if candidate exists by email
  2. Send resume to parser-service
  3. Get parsed data
  4. Store all data (manual + parsed) in Candidate model
  5. Deduplicate skills
  6. Return combined candidate record
```

### **Step 3: Unified Skills Search**
Modify `getAllCandidates` to search both manual AND parsed skills:

```javascript
// Current: Only searches manual skills
// query.skills = { $in: skillsArray }

// NEW: Search from both sources
if (skills) {
  const skillsArray = skills.split(',').map(s => s.trim());
  query.$or = [
    { 'skillsSources.manual': { $in: skillsArray } },
    { 'skillsSources.parsed': { $in: skillsArray } }
  ];
}
```

### **Step 4: Deduplication by Email**
When searching, ensure no duplicate candidates:

```javascript
// Use aggregation pipeline to deduplicate by email
const aggregationPipeline = [
  { $match: query },
  { 
    $group: {
      _id: { $toLower: '$email' },  // Group by email (case-insensitive)
      candidate: { $first: '$$ROOT' },
      count: { $sum: 1 }
    }
  },
  { $replaceRoot: { newRoot: '$candidate' } },
  { $sort: sortOption },
  { $skip: skip },
  { $limit: Number(limit) }
];

const candidates = await Candidate.aggregate(aggregationPipeline);
```

---

## 🔄 Implementation Steps

### **Phase 1: Backend Updates**

#### 1.1 Update Candidate Model
**File:** `server/src/models/Candidate.js`

Add to schema:
```javascript
// Parsed resume integration
parsedResumeData: {
  name: String,
  aiExtractedSkills: [String],
  aiExtractedExperience: [Object],
  aiExtractedProjects: [Object],
  targetRole: String,
  parsedAt: Date
},

skillsSources: {
  manual: [String],
  parsed: [String]
},

hasParseData: {
  type: Boolean,
  default: false
}
```

#### 1.2 Create Parser Integration Service
**File:** `server/src/services/parserService.js` (NEW)

```javascript
import axios from 'axios';

const PARSER_SERVICE_URL = process.env.PARSER_SERVICE_URL || 'http://127.0.0.1:8001';

export const parseResumeFile = async (fileBuffer, fileName, mimeType) => {
  try {
    const formData = new FormData();
    
    // Create blob from buffer
    const blob = new Blob([fileBuffer], { type: mimeType });
    formData.append('file', blob, fileName);
    
    const response = await axios.post(
      `${PARSER_SERVICE_URL}/parse`,
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' }
      }
    );
    
    return response.data.data;
  } catch (error) {
    console.error('Parser service error:', error.message);
    throw new Error(`Failed to parse resume: ${error.message}`);
  }
};

export const searchParsedSkills = async (skills) => {
  try {
    const skillsString = Array.isArray(skills) 
      ? skills.join(',') 
      : skills;
    
    const response = await axios.get(
      `${PARSER_SERVICE_URL}/search-multiple?skills=${skillsString}`
    );
    
    return response.data.data;
  } catch (error) {
    console.error('Parser search error:', error.message);
    return [];
  }
};
```

#### 1.3 Create Parser Controller
**File:** `server/src/controllers/parserController.js` (NEW)

```javascript
import Candidate from "../models/Candidate.js";
import { getGoogleDriveInstance } from '../config/googleDrive.js';
import { parseResumeFile } from '../services/parserService.js';

export const parseAndCreateCandidate = async (req, res, next) => {
  try {
    const { firstName, lastName, experience, jobRole } = req.body;
    let { email, skills } = req.body;

    if (!firstName || !lastName || !email || !req.file) {
      return res.status(400).json({
        success: false,
        message: 'firstName, lastName, email, and resume file are required'
      });
    }

    email = email.toLowerCase();

    // ✅ Check for existing candidate (deduplication)
    let candidate = await Candidate.findOne({ email });

    // Parse resume
    let parsedData = {};
    try {
      parsedData = await parseResumeFile(
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype
      );
    } catch (error) {
      console.warn('Resume parsing failed, continuing without parsed data:', error.message);
    }

    // Upload resume to Google Drive
    let driveFileId = null;
    let fileUrl = null;

    try {
      const gdrive = getGoogleDriveInstance();
      if (gdrive.isAuthenticated()) {
        const result = await gdrive.uploadFile(
          req.file.buffer,
          req.file.originalname,
          req.file.mimetype
        );
        driveFileId = result.id;
        fileUrl = `https://drive.google.com/file/d/${result.id}/view`;
      }
    } catch (error) {
      console.warn('Google Drive upload failed:', error.message);
    }

    // Combine skills: manual + parsed
    const manualSkills = skills ? JSON.parse(skills) : [];
    const parsedSkills = parsedData.skills || [];
    
    // Deduplicate skills
    const allSkills = [...new Set([...manualSkills, ...parsedSkills])];

    if (!candidate) {
      // Create new candidate
      candidate = await Candidate.create({
        firstName,
        lastName,
        email,
        phone: req.body.phone || '',
        skills: allSkills,
        experience: experience || parsedData.experience?.length || 0,
        jobRole: jobRole || parsedData.target_role || '',
        resume: {
          fileName: req.file.originalname,
          driveFileId: driveFileId || '',
          url: fileUrl || ''
        },
        parsedResumeData: {
          name: parsedData.name || '',
          aiExtractedSkills: parsedSkills,
          aiExtractedExperience: parsedData.experience || [],
          aiExtractedProjects: parsedData.projects || [],
          targetRole: parsedData.target_role || '',
          parsedAt: new Date()
        },
        skillsSources: {
          manual: manualSkills,
          parsed: parsedSkills
        },
        hasParseData: Object.keys(parsedData).length > 0,
        addedBy: req.user._id
      });
    } else {
      // Update existing candidate with parsed data
      candidate.firstName = firstName;
      candidate.lastName = lastName;
      candidate.experience = experience || parsedData.experience?.length || candidate.experience;
      candidate.jobRole = jobRole || parsedData.target_role || candidate.jobRole;
      
      // Update skills combining both sources
      candidate.skills = allSkills;
      candidate.skillsSources = {
        manual: manualSkills,
        parsed: parsedSkills
      };

      // Update parsed data
      if (Object.keys(parsedData).length > 0) {
        candidate.parsedResumeData = {
          name: parsedData.name || '',
          aiExtractedSkills: parsedSkills,
          aiExtractedExperience: parsedData.experience || [],
          aiExtractedProjects: parsedData.projects || [],
          targetRole: parsedData.target_role || '',
          parsedAt: new Date()
        };
        candidate.hasParseData = true;
      }

      // Update resume if new one uploaded
      if (driveFileId) {
        candidate.resume = {
          fileName: req.file.originalname,
          driveFileId,
          url: fileUrl
        };
      }

      await candidate.save();
    }

    res.status(201).json({
      success: true,
      message: 'Candidate created/updated with parsed resume data',
      candidate,
      parseStatus: Object.keys(parsedData).length > 0 ? 'success' : 'warning'
    });

  } catch (error) {
    next(error);
  }
};
```

#### 1.4 Update Candidate Controller
**File:** `server/src/controllers/candidateController.js`

Modify the `getAllCandidates` function to search both skill sources:

```javascript
// Find this section in getAllCandidates:
if (skills) {
  const skillsArray = skills.split(',').map(s => s.trim());
  query.skills = { $in: skillsArray };
}

// Replace with:
if (skills) {
  const skillsArray = skills.split(',').map(s => s.trim());
  query.$or = [
    { 'skillsSources.manual': { $in: skillsArray } },
    { 'skillsSources.parsed': { $in: skillsArray } }
  ];
}
```

**Optional: Add aggregation for deduplication**

```javascript
// Optional: Add deduplication by email
const aggregationPipeline = [
  { $match: query },
  { 
    $group: {
      _id: { $toLower: '$email' },
      candidate: { $first: '$$ROOT' },
      count: { $sum: 1 }
    }
  },
  { $replaceRoot: { newRoot: '$candidate' } },
  { $sort: sortOption },
  { $skip: skip },
  { $limit: Number(limit) }
];

const candidates = await Candidate.aggregate(aggregationPipeline);
```

#### 1.5 Create New Route
**File:** `server/src/routes/parserRoute.js` (NEW)

```javascript
import express from 'express';
import multer from 'multer';
import { protect, authorize } from '../middlewares/auth.js';
import { parseAndCreateCandidate } from '../controllers/parserController.js';

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }
});

router.use(protect);

// Parse resume and create/link candidate
router.post(
  '/parse-candidate',
  authorize('admin', 'hr'),
  upload.single('resume'),
  parseAndCreateCandidate
);

export default router;
```

#### 1.6 Register Route in App
**File:** `server/src/app.js`

```javascript
import parserRoute from './routes/parserRoute.js';

// Add this line with other routes:
app.use('/api/parser', parserRoute);
```

---

### **Phase 2: Frontend Updates**

#### 2.1 Update Candidate Addition Form
**File:** `client/src/components/candidates/AddCandidate.jsx`

```javascript
// When user uploads resume, it will:
// 1. Call POST /api/parser/parse-candidate
// 2. Get parsed skills automatically
// 3. Still allow manual skill adjustment
// 4. No duplicate candidates (email-based deduplication)
```

#### 2.2 Update Candidate Search/Filter
**File:** Wherever you have skill search

```javascript
// Skills filter now works for:
// 1. Manually added skills
// 2. AI-extracted skills from parsed resumes
// 3. No duplicates (same candidate appears once)
```

---

## 📊 Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                   CANDIDATE UPLOAD FLOW                      │
└─────────────────────────────────────────────────────────────┘

USER UPLOADS RESUME
↓
[POST] /api/parser/parse-candidate
  ├─ Check if candidate exists (by email)
  ├─ Send file to Parser Service (Python)
  │  ├─ Extract text with Docling
  │  ├─ Parse with Ollama LLM
  │  └─ Return: {name, email, skills, experience, projects, target_role}
  ├─ Upload resume to Google Drive
  ├─ Combine skills (manual + parsed)
  ├─ Deduplicate skills
  └─ Save to MongoDB
      ├─ skills: [all unique skills]
       ├─ skillsSources: {manual: [...], parsed: [...]}
      ├─ parsedResumeData: {...}
      ├─ hasParseData: true/false
      └─ timestamps
↓
CANDIDATE CREATED/UPDATED
  - Single record per person (email-based)
  - Contains both manual and parsed data
  - Skills combined from both sources

┌─────────────────────────────────────────────────────────────┐
│              CANDIDATE SEARCH/FILTER FLOW                    │
└─────────────────────────────────────────────────────────────┘

USER SEARCHES BY SKILLS: ["React", "MongoDB"]
↓
[GET] /api/candidates?skills=React,MongoDB
  ├─ Query: {$or: [
  │   {skillsSources.manual: {$in: ["React", "MongoDB"]}},
  │   {skillsSources.parsed: {$in: ["React", "MongoDB"]}}
  │ ]}
  ├─ Deduplication by email (optional aggregation)
  └─ Return candidates with BOTH sources of skills
↓
RESULTS
  - Candidates with manually added React/MongoDB
  - Candidates with parsed React/MongoDB
  - No duplicates (same person appears once)
```

---

## 🗄️ Updated Database Schema

```javascript
{
  _id: ObjectId,
  
  // Basic Info
  firstName: String,
  lastName: String,
  email: String (unique, indexed),
  phone: String,
  
  // Skills - COMBINED from both sources
  skills: [String],              // All unique skills
  
  // Experience & Role
  experience: Number,            // Years or count
  jobRole: String,
  
  // Resume Files
  resume: {
    fileName: String,
    driveFileId: String,
    url: String
  },
  
  // ✅ NEW: Parsed Resume Data
  parsedResumeData: {
    name: String,
    aiExtractedSkills: [String],
    aiExtractedExperience: [{
      company: String,
      role: String,
      duration: String,
      description: String,
      skills_used: [String]
    }],
    aiExtractedProjects: [{
      name: String,
      description: String,
      skills_used: [String]
    }],
    targetRole: String,
    parsedAt: Date
  },
  
  // ✅ NEW: Track Skill Sources
  skillsSources: {
    manual: [String],            // From HR input
    parsed: [String]             // From parsed resume
  },
  
  // ✅ NEW: Flag for parsed data
  hasParseData: Boolean,
  
  // Status & Interview
  status: String enum,
  interviewRounds: [Object],
  
  // Meta
  addedBy: ObjectId (ref: User),
  createdAt: Date,
  updatedAt: Date
}
```

---

## 📝 Environment Variables

Add to `.env` in server folder:

```
PARSER_SERVICE_URL=http://127.0.0.1:8001
```

---

## 🚀 Deployment Checklist

- [ ] Update Candidate model with new fields
- [ ] Create parserService.js integration
- [ ] Create parserController.js
- [ ] Create parserRoute.js
- [ ] Register route in app.js
- [ ] Update candidateController.js search logic
- [ ] Add indexes for new fields
- [ ] Update frontend AddCandidate form
- [ ] Test parse + create flow
- [ ] Test skill search from both sources
- [ ] Verify no duplicates with email

---

## 🔍 API Endpoints Summary

### New Endpoint:
```
POST /api/parser/parse-candidate
Body: {
  firstName: String,
  lastName: String,
  email: String,
  phone: String (optional),
  skills: JSON string of array (optional - can be empty),
  experience: Number (optional),
  jobRole: String (optional),
  file: Resume file
}
Response: { success, message, candidate, parseStatus }
```

### Updated Endpoint:
```
GET /api/candidates?skills=React,MongoDB
- Now searches BOTH manual AND parsed skills
- Returns deduplicated candidates (by email)
```

---

## ⚠️ Important Notes

1. **Email is the unique identifier** - Deduplication works by email (case-insensitive)
2. **Skills are deduplicated** - Same skill from manual + parsed won't appear twice
3. **Parser service must be running** - If it fails, candidate still gets created with manual data
4. **Backward compatible** - Existing candidates work fine; new parsing features are additive
5. **Aggregation vs Query** - For large datasets, use aggregation pipeline for better deduplication

---

## 📚 File Changes Summary

| File | Action | Type |
|------|--------|------|
| `server/src/models/Candidate.js` | Update schema | Modify |
| `server/src/services/parserService.js` | Create new file | NEW |
| `server/src/controllers/parserController.js` | Create new file | NEW |
| `server/src/controllers/candidateController.js` | Update search logic | Modify |
| `server/src/routes/parserRoute.js` | Create new file | NEW |
| `server/src/app.js` | Register parser route | Modify |
| `server/.env` | Add parser URL | Modify |
| `client/src/components/candidates/AddCandidate.jsx` | Update form | Modify (optional) |

---

## 🎯 Expected Results After Integration

✅ Single candidate record per person (no duplicates)  
✅ Skills combined from manual + parsed sources  
✅ Search includes both manual and parsed candidates  
✅ Parser service seamlessly integrated  
✅ Backward compatible with existing data  
✅ Full audit trail (skillsSources shows origin)  
