# Frontend Integration Guide - Parser Service

## Overview
The frontend has been updated to use the new parser service integration. Resume parsing is now automatic when adding candidates, with skill extraction and deduplication built-in.

---

## 📝 Files Updated/Created

### Updated Files

#### 1. AddCandidate Component
**File:** `client/src/components/candidates/AddCandidate.jsx`

**Changes:**
- Updated `handleSubmit()` to send resume to `/api/parser/parse-candidate` instead of `/api/candidates`
- The form now sends:
  - `firstName`, `lastName`, `email`, `phone`
  - `jobRole`, `experience`
  - `skills` (manual entry - can be empty)
  - `resume` file
- Response includes parsed data and extracted skills automatically
- Deduplication handled on backend (by email)

**Code Change:**
```javascript
// OLD: POST /candidates
await API.post('/candidates', formData)

// NEW: POST /parser/parse-candidate
await API.post('/parser/parse-candidate', formData)
```

### New Files Created

#### 2. ParsedResumeCard Component
**File:** `client/src/components/candidates/ParsedResumeCard.jsx`

**Purpose:** Display AI-extracted resume data in candidate profiles

**Features:**
- Shows skill sources (manual vs AI-extracted)
- Displays parsed work experience with company, role, duration, skills used
- Displays parsed projects with descriptions and skills
- **Reparse button** - Allows HR to re-extract data from new resume
- Color-coded skill badges to show origin

**Props:**
```javascript
<ParsedResumeCard
  candidate={candidateData}           // Candidate object with hasParseData
  onReparseSuccess={handleRefresh}    // Callback when reparse succeeds
  showReparseButton={true}            // Show/hide reparse button
/>
```

**Usage in CandidateProfile:**
```javascript
import { ParsedResumeCard } from './ParsedResumeCard';

// Inside CandidateProfile render:
{candidate && <ParsedResumeCard candidate={candidate} />}
```

---

## 🔄 User Workflows

### Adding a New Candidate (with auto-parsing)

**Before:**
1. HR manually enters: First name, Last name, Email, Phone
2. HR manually enters: Target role, Experience
3. HR manually adds skills one by one
4. HR uploads resume

**After:**
1. HR enters: First name, Last name, Email, Phone ✅ (same)
2. HR enters: Target role, Experience ✅ (same)
3. HR adds OPTIONAL manual skills (can be empty) ✅ **OPTIONAL NOW**
4. HR uploads resume ✅
5. **System automatically extracts skills from resume** 🤖
6. Manual skills + parsed skills = combined list (no duplicates)
7. **If candidate with same email exists → candidate is linked instead** 🔗

**Result:** Single candidate record with combined skills from both sources

---

### Viewing Parsed Resume Data

1. HR navigates to candidate profile
2. Sees "AI Parsed Resume Data" card showing:
   - ✍️ Manually Added Skills (blue badges)
   - 🤖 AI Extracted Skills (indigo badges)
   - Work experience with companies, roles, durations
   - Projects with descriptions
   - Target role inferred by AI

**Edit/Update Options:**
- Edit skills manually in main form (as before)
- **Reparse button** to extract fresh data from new resume

---

## 💡 Implementation Tips

### How to integrate ParsedResumeCard in CandidateProfile

**Step 1:** Import the component
```javascript
import ParsedResumeCard from '../candidates/ParsedResumeCard';
```

**Step 2:** Add state for re-fetch after reparse
```javascript
const handleReparseSuccess = (updatedCandidate) => {
  setCandidate(updatedCandidate);
  // Optionally show success toast
};
```

**Step 3:** Add component to render
```javascript
{candidate && (
  <>
    {/* ... existing candidate content ... */}
    <ParsedResumeCard 
      candidate={candidate}
      onReparseSuccess={handleReparseSuccess}
    />
  </>
)}
```

---

## 🧪 Testing Checklist

### ✅ AddCandidate Form
- [ ] Form submission sends to `/api/parser/parse-candidate`
- [ ] Resume file is required
- [ ] Skills can be left empty (optional)
- [ ] Candidate is created with parsed skills
- [ ] Navigation to candidates page after success

### ✅ Skill Extraction
- [ ] Parsed skills appear in candidate record
- [ ] Manual skills + parsed skills combine (no duplicates)
- [ ] Skills array in candidate shows union of both sources

### ✅ Deduplication
- [ ] Add candidate with email "john@test.com"
- [ ] Try adding another candidate with same email
- [ ] System should **update existing** candidate (check backend logs)
- [ ] No duplicate records created

### ✅ ParsedResumeCard Component
- [ ] Component shows when `hasParseData: true`
- [ ] Component hides when `hasParseData: false`
- [ ] Displays manual skills in blue
- [ ] Displays parsed skills in indigo
- [ ] Shows work experience items
- [ ] Shows projects (if any)
- [ ] Reparse button opens dialog and works correctly

### ✅ Reparse Functionality
- [ ] Reparse button accessible in card
- [ ] File upload dialog opens
- [ ] File selection works
- [ ] Submit triggers `/parser/candidates/:id/reparse` endpoint
- [ ] New parsed data refreshes on success
- [ ] Skills are updated after reparse

---

## 📊 Testing Data Flow

### End-to-End Test Scenario

1. **Create Candidate with Parsed Data:**
   ```
   POST /api/parser/parse-candidate
   ├─ firstName: "Alice"
   ├─ lastName: "Johnson"
   ├─ email: "alice@test.com"
   ├─ phone: "9876543210"
   ├─ jobRole: "Senior Developer"
   ├─ experience: "5"
   ├─ skills: ["React"]        (manual)
   └─ resume: <PDF FILE>       (gets parsed)
   
   Expected Response:
   {
     success: true,
     candidate: {
       _id: "...",
       email: "alice@test.com",
       skills: ["React", "MongoDB", "Node.js"],  // Combined
       skillsSources: {
         manual: ["React"],
         parsed: ["MongoDB", "Node.js"]
       },
       parsedResumeData: {
         aiExtractedSkills: ["MongoDB", "Node.js"],
         aiExtractedExperience: [...],
         ...
       },
       hasParseData: true
     }
   }
   ```

2. **View Candidate Profile:**
   - Click on candidate → Profile page
   - See "AI Parsed Resume Data" card
   - Shows manual skills (blue) + parsed skills (indigo)
   - Shows experience and projects

3. **Reparse Resume:**
   - Click "Reparse" button in parsed data card
   - Select new resume file
   - Submit
   - Card updates with new data

4. **Search by Skills:**
   ```
   GET /api/candidates?skills=React,MongoDB
   
   Returns candidates with either skill from:
   ✅ Manual list OR
   ✅ Parsed list
   ✅ NO DUPLICATES (same person appears once)
   ```

---

## 🔗 API Endpoints Used by Frontend

### Create/Link Candidate with Parsing
```
POST /api/parser/parse-candidate
Headers: Authorization: Bearer <token>
Body: FormData {
  firstName, lastName, email, phone,
  jobRole, experience, skills, resume
}
Response: { success, candidate, parseStatus, parseError }
```

### Get Parsed Data
```
GET /api/parser/candidates/:id/parsed-data
Response: { success, data: { parsedResumeData, skillsSources } }
```

### Reparse Resume
```
POST /api/parser/candidates/:id/reparse
Body: FormData { resume }
Response: { success, candidate, parseStatus }
```

### Search Candidates (Updated)
```
GET /api/candidates?skills=React,MongoDB
Returns: Candidates with those skills from BOTH manual & parsed sources
```

---

## 🎨 UI Components Used

- **ParsedResumeCard:** Displays parsed resume data
- **Chip:** Shows skills with color-coding
- **Dialog:** Reparse file upload modal
- **Paper:** Card containers
- **Alert:** Error messages
- **Button:** Reparse button

---

## 🐛 Common Issues & Solutions

### Issue: Skills not appearing after creation
**Cause:** Parser service didn't respond  
**Solution:** Check `parseStatus` in response. If "partial" or error, skills only contain manual entry. Backend logs show parse error.

### Issue: Duplicate candidates showing
**Cause:** Database already had this email before integration  
**Solution:** Run data migration to deduplicate by email, or update via UI (triggers reparse)

### Issue: Reparse button not working
**Cause:** Missing candidate ID in URL  
**Solution:** Ensure candidateProfile passes `id` param correctly

### Issue: Skills not combining correctly
**Cause:** `skillsSources` format issue  
**Solution:** Check candidate model has `skillsSources.manual` and `skillsSources.parsed` arrays

---

## 📚 Backend Endpoints for Reference

All endpoints require authentication (`Authorization: Bearer <token>`)

| Method | Endpoint | Protected By | Purpose |
|--------|----------|--------------|---------|
| POST | `/api/parser/parse-candidate` | HR/Admin | Create/link candidate with parsing |
| GET | `/api/parser/candidates/:id/parsed-data` | Any Auth | Get parsed resume data |
| POST | `/api/parser/candidates/:id/reparse` | HR/Admin | Re-extract data from new resume |
| GET | `/api/candidates?skills=X,Y` | Any Auth | Search with combined skill sources |

---

## ✨ Next Steps (Optional Enhancements)

1. **Add Toast Notifications:**
   - Show success when candidate created
   - Show parse status (success/partial/failure)

2. **Add Skill Source Filter:**
   - Filter candidates by skill source (manual only, parsed only, both)

3. **Add Export Feature:**
   - Export candidate with parsed data as JSON

4. **Bulk Operations:**
   - Batch reparse multiple candidates' resumes

5. **Parse Analytics:**
   - Show stats on how many candidates have parsed data
   - Show most common extracted skills

---

## 🚀 Deployment Notes

1. **No breaking changes:** AddCandidate form looks identical to users
2. **Backward compatible:** Existing manually-added candidates still work
3. **Parser service requirement:** Must be running on `http://127.0.0.1:8001` or set `PARSER_SERVICE_URL` env var
4. **MongoDB migration:** Old candidates without `parsedResumeData` work fine (fields default to null/empty)

---

**Ready to test! Let me know if you need help integrating ParsedResumeCard into CandidateProfile** 🎉
