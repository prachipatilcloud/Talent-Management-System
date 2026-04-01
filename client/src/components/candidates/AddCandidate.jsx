import { Box, Button, Chip, Divider, FormControl, IconButton, InputLabel, MenuItem, Paper, Select, TextField, Typography, CircularProgress, Dialog, DialogTitle, DialogContent, DialogActions, Accordion, AccordionSummary, AccordionDetails, Alert } from "@mui/material"
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../api/axios";
import { Add, ChevronLeft, Close, CloudUpload, ExpandMore, Visibility } from "@mui/icons-material";

const PRIMARY = '#1334ec';

const statusOptions = [
  'Applied', 'Shortlisted', 'Interviewing', 'Selected',
  'Rejected', 'On Hold', 'Talent Pool',
];

const getExperienceLevel = (years) => {
  const y = Number(years);
  if (isNaN(y) || years === '') return null;
  if (y <= 2) return { label: 'Junior', color: '#15803d', bg: '#f0fdf4' };
  if (y <= 5) return { label: 'Mid-Level', color: '#1d4ed8', bg: '#eff6ff' };
  if (y <= 10) return { label: 'Senior', color: '#7c3aed', bg: '#f5f3ff' };
  return { label: 'Lead', color: '#a16207', bg: '#fefce8' };
};

const skillColors = [
  { bg: 'rgba(19,52,236,0.08)', color: PRIMARY },
  { bg: '#eff6ff', color: '#1d4ed8' },
  { bg: '#f5f3ff', color: '#7c3aed' },
  { bg: '#f0fdf4', color: '#15803d' },
];

const inputSx = {
  '& .MuiOutlinedInput-root': {
    borderRadius: '8px',
    fontSize: '0.9rem',
    bgcolor: 'transparent',
    '& fieldset': { borderColor: '#cbd5e1' },
    '&:hover fieldset': { borderColor: PRIMARY },
    '&.Mui-focused fieldset': { borderColor: PRIMARY, borderWidth: 2 },
  },
  '& .MuiInputLabel-root.Mui-focused': { color: PRIMARY },
};

const SectionTitle = ({ children }) => (
  <Typography sx={{
    fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase',
    letterSpacing: '0.08em', color: '#94a3b8', mb: 2,
  }}>
    {children}
  </Typography>
);

const AddCandidate = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '',
    phone: '', jobRole: '', experience: '',
    status: 'Applied',
  });

  const [errors, setErrors] = useState({});
  const [skills, setSkills] = useState([]);
  const [skillInput, setSkillInput] = useState('');
  const [resumeFile, setResumeFile] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [loading, setLoading] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [parsedData, setParsedData] = useState(null);
  const [experiences, setExperiences] = useState([]);
  const [projects, setProjects] = useState([]);
  const [parseError, setParseError] = useState('');
  const [previewOpen, setPreviewOpen] = useState(false);

  const handleChange = (field) => (e) => {
    let value = e.target.value;

    if (field === 'phone') {
      value = value.replace(/\D/g, '');
      if (value.length > 10) return;
      if (value.length === 1 && !/[6-9]/.test(value)) return;
    }

    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const handleExperienceChange = (e) => {
    const val = e.target.value;
    if (val !== '' && (isNaN(val) || Number(val) < 0)) return;
    setForm(prev => ({ ...prev, experience: val }));
    if (errors.experience) setErrors(prev => ({ ...prev, experience: '' }));
  };

  const addSkill = () => {
    const trimmed = skillInput.trim();
    if (trimmed && !skills.includes(trimmed)) {
      setSkills(prev => [...prev, trimmed]);
    }
    setSkillInput('');
  };

  const removeSkill = (skill) => {
    setSkills(prev => prev.filter(s => s !== skill));
  };

  // Helper to normalize skills_used (could be string or array from LLM)
  const normalizeSkillsArray = (val) => {
    if (Array.isArray(val)) return val.filter(s => typeof s === 'string' && s.trim());
    if (typeof val === 'string' && val.trim()) return val.split(',').map(s => s.trim()).filter(Boolean);
    return [];
  };

  // ✅ NEW: Parse resume and auto-fill form
  const parseResumeFile = async (file) => {
    if (!file) return;

    setParsing(true);
    setParseError('');
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('http://127.0.0.1:8001/parse', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!result.success) {
        setParseError(result.error || 'Failed to parse resume');
        setParsing(false);
        return;
      }

      const data = result.data;
      console.log('✅ Parsed resume data:', JSON.stringify(data, null, 2));

      // Auto-fill form fields
      const nameParts = (data.name || '').trim().split(/\s+/);
      setForm(prev => ({
        ...prev,
        firstName: nameParts[0] || prev.firstName,
        lastName: nameParts.slice(1).join(' ') || prev.lastName,
        email: data.email || prev.email,
        phone: data.phone ? String(data.phone).replace(/\D/g, '').slice(-10) : prev.phone,
        jobRole: data.target_role || prev.jobRole,
      }));

      // Add skills from parsed data
      const parsedSkills = normalizeSkillsArray(data.skills);
      if (parsedSkills.length > 0) {
        setSkills(prev => [...new Set([...prev, ...parsedSkills])]);
      }

      // Store experience with normalized skills_used
      if (data.experience && Array.isArray(data.experience)) {
        const normalizedExp = data.experience.map(exp => ({
          ...exp,
          skills_used: normalizeSkillsArray(exp.skills_used),
        }));
        setExperiences(normalizedExp);
      }

      // Store projects with normalized skills_used
      if (data.projects && Array.isArray(data.projects)) {
        const normalizedProj = data.projects.map(proj => ({
          ...proj,
          skills_used: normalizeSkillsArray(proj.skills_used),
        }));
        setProjects(normalizedProj);
      }

      setParsedData(data);
    } catch (error) {
      console.error('❌ Parse error:', error);
      setParseError('Failed to parse resume: ' + error.message);
    } finally {
      setParsing(false);
    }
  };

  const handleFileDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer?.files?.[0] || e.target.files?.[0];
    if (file) {
      setResumeFile(file);
      // Parse resume immediately on upload
      parseResumeFile(file);
    }
  };

  const validate = () => {
    const errs = {};
    if (!form.firstName.trim()) errs.firstName = 'First name is required';
    if (!form.lastName.trim()) errs.lastName = 'Last name is required';
    if (!form.email.trim()) errs.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Invalid email';
    if (!form.jobRole.trim()) errs.jobRole = 'Target role is required';
    if (!form.experience) errs.experience = 'Please select an experience level';
    return errs;
  };

  const handleSubmit = async () => {
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    if (!resumeFile) {
      setErrors({ submit: 'Resume file is required' });
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('firstName', form.firstName.trim());
      formData.append('lastName', form.lastName.trim());
      formData.append('email', form.email.trim());
      formData.append('phone', form.phone.trim());
      formData.append('jobRole', form.jobRole.trim());
      formData.append('experience', form.experience);
      formData.append('skills', JSON.stringify(skills));
      formData.append('resume', resumeFile);

      // ✅ Use parser endpoint for automatic parsing
      await API.post('/parser/parse-candidate', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      navigate('/hr/candidates');
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to add candidate';
      setErrors({ submit: msg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ height: '100%', overflow: 'auto', bgcolor: '#f6f6f8' }}>
      <Box sx={{ maxWidth: 860, mx: 'auto', px: 4, py: 5 }}>

        {/* Back Nav */}
        <Box
          onClick={() => navigate('/hr/candidates')}
          sx={{
            display: 'inline-flex', alignItems: 'center', gap: 0.25,
            color: PRIMARY, fontWeight: 600, fontSize: '0.9rem',
            cursor: 'pointer', mb: 3,
            '&:hover': { textDecoration: 'underline' },
          }}
        >
          <ChevronLeft sx={{ fontSize: 20 }} />
          Back to Dashboard
        </Box>

        {/* Main Card */}
        <Paper elevation={0} sx={{
          borderRadius: '16px',
          border: '1px solid rgba(226,232,240,0.5)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          bgcolor: 'white', overflow: 'hidden',
        }}>
          {/* Card Header */}
          <Box sx={{ px: 5, pt: 5, pb: 4 }}>
            <Typography sx={{ fontSize: '1.5rem', fontWeight: 800, color: PRIMARY, letterSpacing: '-0.02em' }}>
              Create New Candidate Profile
            </Typography>
            <Typography sx={{ color: '#64748b', fontSize: '0.9rem', mt: 0.75 }}>
              Complete the information below to register a new candidate in the talent pipeline.
            </Typography>
          </Box>

          <Box sx={{ px: 5, pb: 5 }}>

            {/* ── Resume & Documents ── */}
            <SectionTitle>Resume & Documents</SectionTitle>
            <Box
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleFileDrop}
              onClick={() => document.getElementById('resume-upload').click()}
              sx={{
                position: 'relative',
                border: `2px dashed ${dragOver ? PRIMARY : '#e2e8f0'}`,
                borderRadius: '12px', p: 6, mb: 2.5,
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                bgcolor: dragOver ? 'rgba(19,52,236,0.03)' : '#f8fafc',
                cursor: 'pointer', transition: 'all 0.2s',
                '&:hover': { bgcolor: 'rgba(19,52,236,0.02)', borderColor: PRIMARY },
              }}
            >
              <input id="resume-upload" type="file" accept=".pdf,.doc,.docx"
                style={{ display: 'none' }} onChange={handleFileDrop} />
              <Box sx={{
                width: 64, height: 64, borderRadius: '50%',
                bgcolor: 'rgba(19,52,236,0.08)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                mb: 2, transition: 'transform 0.2s',
                '&:hover': { transform: 'scale(1.1)' },
              }}>
                <CloudUpload sx={{ fontSize: 30, color: PRIMARY }} />
              </Box>
              {parsing && (
                <Box sx={{
                  position: 'absolute', inset: 0, bgcolor: 'rgba(255,255,255,0.85)',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  borderRadius: '12px', zIndex: 2,
                }}>
                  <CircularProgress size={32} sx={{ color: PRIMARY, mb: 1.5 }} />
                  <Typography sx={{ fontWeight: 600, color: PRIMARY, fontSize: '0.85rem' }}>
                    Parsing Resume...
                  </Typography>
                  <Typography sx={{ color: '#64748b', fontSize: '0.75rem', mt: 0.25 }}>
                    Extracting details with AI
                  </Typography>
                </Box>
              )}
              {resumeFile ? (
                <>
                  <Typography sx={{ fontWeight: 600, color: '#0f172a', fontSize: '0.9rem' }}>
                    {resumeFile.name}
                  </Typography>
                  <Typography sx={{ color: '#64748b', fontSize: '0.8rem', mt: 0.5 }}>
                    {(resumeFile.size / 1024 / 1024).toFixed(2)} MB — click to replace
                  </Typography>
                </>
              ) : (
                <>
                  <Typography sx={{ fontWeight: 600, color: '#374151', fontSize: '0.9rem' }}>
                    Click or drag resume file to this area to upload
                  </Typography>
                  <Typography sx={{ color: '#94a3b8', fontSize: '0.8125rem', mt: 0.5 }}>
                    Support for PDF, DOCX (Max 10MB)
                  </Typography>
                </>
              )}
            </Box>

            {/* Parse status & Preview button */}
            {parseError && (
              <Alert severity="error" sx={{ mb: 2 }} onClose={() => setParseError('')}>
                {parseError}
              </Alert>
            )}
            {parsedData && !parsing && (
              <Alert severity="success" sx={{ mb: 2 }}>
                Resume parsed successfully — form fields have been auto-filled.
              </Alert>
            )}
            {resumeFile && (
              <Box sx={{ display: 'flex', gap: 1.5, mb: 2.5 }}>
                <Button
                  startIcon={<Visibility />}
                  onClick={(e) => { e.stopPropagation(); setPreviewOpen(true); }}
                  sx={{
                    textTransform: 'none', fontWeight: 600, fontSize: '0.85rem',
                    color: PRIMARY, border: `1px solid ${PRIMARY}`,
                    borderRadius: '8px', px: 2.5, py: 0.75,
                    '&:hover': { bgcolor: 'rgba(19,52,236,0.04)' },
                  }}
                >
                  Preview Resume
                </Button>
              </Box>
            )}

            {/* ── Personal Information ── */}
            <SectionTitle>Personal Information</SectionTitle>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2.5, mb: 4 }}>
              <TextField
                label="First Name" placeholder="e.g. Jane"
                value={form.firstName} onChange={handleChange('firstName')}
                error={!!errors.firstName} helperText={errors.firstName}
                fullWidth size="small" sx={inputSx}
                autoComplete="given-name"
              />
              <TextField
                label="Last Name" placeholder="e.g. Doe"
                value={form.lastName} onChange={handleChange('lastName')}
                error={!!errors.lastName} helperText={errors.lastName}
                fullWidth size="small" sx={inputSx}
                autoComplete="family-name"
              />
              <TextField
                label="Email Address" placeholder="jane.doe@example.com" type="email"
                value={form.email} onChange={handleChange('email')}
                error={!!errors.email} helperText={errors.email}
                fullWidth size="small" sx={inputSx}
                autoComplete="email"
              />
              <TextField
                label="Phone Number" placeholder="9876543210" type="tel"
                value={form.phone} onChange={handleChange('phone')}
                fullWidth size="small" sx={inputSx}
                inputProps={{ maxLength: 10 }}
                autoComplete="tel"
              />
            </Box>

            <Divider sx={{ borderColor: '#f1f5f9', mb: 4 }} />

            {/* ── Professional Background ── */}
            <SectionTitle>Professional Background</SectionTitle>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2.5, mb: 4 }}>

              <TextField
                label="Target Role" placeholder="e.g. Senior Frontend Engineer"
                value={form.jobRole} onChange={handleChange('jobRole')}
                error={!!errors.jobRole} helperText={errors.jobRole}
                fullWidth size="small" sx={inputSx}
                autoComplete="off"
              />

              {/* ── Experience Level — number input ── */}
              <Box sx={{ position: 'relative' }}>
                <TextField
                  label="Years of Experience"
                  placeholder="e.g. 4"
                  value={form.experience}
                  onChange={handleExperienceChange}
                  type="number"
                  inputProps={{
                    min: 0,
                    max: 50,
                    style: { paddingRight: form.experience !== '' ? '85px' : '12px' }
                  }}
                  fullWidth
                  size="small"
                  error={!!errors.experience}
                  helperText={errors.experience || '0–2 yrs → Junior · 3–5 → Mid · 6–10 → Senior · 10+ → Lead'}
                  autoComplete="off"
                  sx={{
                    ...inputSx,
                    '& input::-webkit-outer-spin-button, & input::-webkit-inner-spin-button': { display: 'none' },
                    '& input[type=number]': { MozAppearance: 'textfield' },
                  }}
                />
                {/* Live level badge */}
                {form.experience !== '' && (() => {
                  const level = getExperienceLevel(form.experience);
                  return level ? (
                    <Box sx={{
                      position: 'absolute',
                      right: 14,
                      top: '27px',
                      transform: 'translateY(-90%)',
                      px: 1.25,
                      py: 0.25,
                      borderRadius: '999px',
                      bgcolor: level.bg,
                      color: level.color,
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      pointerEvents: 'none',
                    }}>
                      {level.label}
                    </Box>
                  ) : null;
                })()}
              </Box>

              {/* Skills — full width */}
              <Box sx={{ gridColumn: '1 / -1' }}>
                <Typography sx={{ fontSize: '0.875rem', fontWeight: 500, color: '#374151', mb: 0.75 }}>
                  Skills & Tech Stack
                </Typography>
                <Box sx={{
                  minHeight: 48, px: 1.5, py: 1,
                  borderRadius: '8px', border: '1px solid #cbd5e1',
                  display: 'flex', flexWrap: 'wrap', gap: 0.75, alignItems: 'center',
                  transition: 'all 0.2s',
                  '&:focus-within': { borderColor: PRIMARY, boxShadow: `0 0 0 2px ${PRIMARY}30` },
                }}>
                  {skills.map((skill, i) => {
                    const col = skillColors[i % skillColors.length];
                    return (
                      <Chip
                        key={skill} label={skill}
                        onDelete={() => removeSkill(skill)}
                        deleteIcon={<Close sx={{ fontSize: '13px !important' }} />}
                        size="small"
                        sx={{
                          bgcolor: col.bg, color: col.color, fontWeight: 700,
                          fontSize: '0.75rem', borderRadius: '999px',
                          '& .MuiChip-deleteIcon': { color: col.color, opacity: 0.7, '&:hover': { opacity: 1 } },
                        }}
                      />
                    );
                  })}
                  <Box
                    component="input"
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addSkill(); } }}
                    placeholder={skills.length === 0 ? 'Add skill...' : ''}
                    autoComplete="off"
                    sx={{
                      flex: 1, minWidth: 80, border: 'none', outline: 'none',

                      fontSize: '0.875rem', bgcolor: 'transparent', color: '#374151',
                      '&::placeholder': { color: '#94a3b8' },
                    }}
                  />
                  {skillInput && (
                    <IconButton size="small" onClick={addSkill} sx={{ color: PRIMARY, p: 0.25 }}>
                      <Add sx={{ fontSize: 16 }} />
                    </IconButton>
                  )}
                </Box>
                <Typography sx={{ fontSize: '0.7rem', color: '#94a3b8', mt: 0.5 }}>
                  Press Enter or comma to add a skill
                </Typography>
              </Box>
            </Box>

            <Divider sx={{ borderColor: '#f1f5f9', mb: 4 }} />

            {/* ── Work Experience ── */}
            {(experiences.length > 0 || parsing) && (
              <Box sx={{ mb: 4 }}>
                <SectionTitle>Work Experience</SectionTitle>
                {parsing && experiences.length === 0 && (
                  <Alert severity="info" sx={{ mb: 2 }}>
                    Parsing resume... Extracting work experience
                  </Alert>
                )}
                {experiences.map((exp, idx) => (
                  <Accordion key={idx} defaultExpanded={idx === 0} sx={{ mb: 1.5, bgcolor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <AccordionSummary expandIcon={<ExpandMore />}>
                      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', width: '100%' }}>
                        <Box>
                          <Typography sx={{ fontWeight: 600, color: PRIMARY }}>
                            {exp.role || exp.title || exp.position || 'Position'}
                          </Typography>
                          <Typography sx={{ fontSize: '0.85rem', color: '#64748b' }}>
                            {exp.company} {exp.duration && `• ${exp.duration}`}
                          </Typography>
                        </Box>
                      </Box>
                    </AccordionSummary>
                    <AccordionDetails sx={{ backgroundColor: '#ffffff' }}>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                        {exp.description && (
                          <Box>
                            <Typography sx={{ fontSize: '0.875rem', fontWeight: 600, color: '#374151', mb: 0.5 }}>
                              Description
                            </Typography>
                            <Typography sx={{ fontSize: '0.875rem', color: '#64748b', whiteSpace: 'pre-wrap' }}>
                              {exp.description}
                            </Typography>
                          </Box>
                        )}
                        {exp.skills_used && exp.skills_used.length > 0 && (
                          <Box>
                            <Typography sx={{ fontSize: '0.875rem', fontWeight: 600, color: '#374151', mb: 0.5 }}>
                              Skills Used
                            </Typography>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
                              {exp.skills_used.map((skill, i) => (
                                <Chip
                                  key={i}
                                  label={skill}
                                  size="small"
                                  sx={{
                                    bgcolor: '#dbeafe', color: '#1d4ed8', fontWeight: 600,
                                    fontSize: '0.75rem', borderRadius: '999px',
                                  }}
                                />
                              ))}
                            </Box>
                          </Box>
                        )}
                      </Box>
                    </AccordionDetails>
                  </Accordion>
                ))}
              </Box>
            )}

            {/* ── Projects ── */}
            {(projects.length > 0 || parsing) && (
              <Box sx={{ mb: 4 }}>
                <SectionTitle>Projects</SectionTitle>
                {parsing && projects.length === 0 && (
                  <Alert severity="info" sx={{ mb: 2 }}>
                    Parsing resume... Extracting projects
                  </Alert>
                )}
                {projects.map((proj, idx) => (
                  <Accordion key={idx} defaultExpanded={idx === 0} sx={{ mb: 1.5, bgcolor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <AccordionSummary expandIcon={<ExpandMore />}>
                      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', width: '100%' }}>
                        <Box>
                          <Typography sx={{ fontWeight: 600, color: PRIMARY }}>
                            {proj.name || proj.title || 'Project'}
                          </Typography>
                          {proj.date && (
                            <Typography sx={{ fontSize: '0.85rem', color: '#64748b' }}>
                              {proj.date}
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    </AccordionSummary>
                    <AccordionDetails sx={{ backgroundColor: '#ffffff' }}>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                        {proj.description && (
                          <Box>
                            <Typography sx={{ fontSize: '0.875rem', fontWeight: 600, color: '#374151', mb: 0.5 }}>
                              Description
                            </Typography>
                            <Typography sx={{ fontSize: '0.875rem', color: '#64748b', whiteSpace: 'pre-wrap' }}>
                              {proj.description}
                            </Typography>
                          </Box>
                        )}
                        {proj.skills_used && proj.skills_used.length > 0 && (
                          <Box>
                            <Typography sx={{ fontSize: '0.875rem', fontWeight: 600, color: '#374151', mb: 0.5 }}>
                              Technologies & Tools
                            </Typography>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
                              {proj.skills_used.map((skill, i) => (
                                <Chip
                                  key={i}
                                  label={skill}
                                  size="small"
                                  sx={{
                                    bgcolor: '#f5f3ff', color: '#7c3aed', fontWeight: 600,
                                    fontSize: '0.75rem', borderRadius: '999px',
                                  }}
                                />
                              ))}
                            </Box>
                          </Box>
                        )}
                      </Box>
                    </AccordionDetails>
                  </Accordion>
                ))}
              </Box>
            )}

            <Divider sx={{ borderColor: '#f1f5f9', mb: 4 }} />

            {/* ── Initial Status ── */}
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2.5 }}>
              <FormControl size="small" sx={inputSx}>
                <InputLabel>Initial Status</InputLabel>
                <Select
                  value={form.status} onChange={handleChange('status')}
                  label="Initial Status" sx={{ borderRadius: '8px' }}
                >
                  {statusOptions.map(s => (
                    <MenuItem key={s} value={s}>{s}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            {errors.submit && (
              <Typography sx={{ color: '#ef4444', fontSize: '0.8125rem', mt: 2 }}>
                {errors.submit}
              </Typography>
            )}

            {/* ── Footer Actions ── */}
            <Divider sx={{ borderColor: '#f1f5f9', mt: 4, mb: 3 }} />
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
              <Button
                onClick={() => navigate('/hr/candidates')}
                sx={{
                  textTransform: 'none', color: '#64748b', fontWeight: 600,
                  fontSize: '0.9rem', px: 3, py: 1.25, borderRadius: '8px',
                  '&:hover': { bgcolor: '#f1f5f9' },
                }}
              >
                Cancel
              </Button>
              <Button
                variant="contained"
                onClick={handleSubmit}
                disabled={loading}
                sx={{
                  textTransform: 'none', fontWeight: 700, fontSize: '0.9rem',
                  px: 4, py: 1.25, borderRadius: '8px', bgcolor: PRIMARY,
                  boxShadow: '0 4px 14px rgba(19,52,236,0.25)',
                  '&:hover': { bgcolor: '#0f28d6', transform: 'translateY(-1px)' },
                  '&:active': { transform: 'translateY(0)' },
                  '&.Mui-disabled': { bgcolor: '#93c5fd', color: 'white' },
                  transition: 'all 0.2s',
                }}
              >
                {loading
                  ? <CircularProgress size={18} sx={{ color: 'white' }} />
                  : 'Save & Add Candidate'
                }
              </Button>
            </Box>

          </Box>
        </Paper>

        <Typography sx={{ mt: 3, textAlign: 'center', color: '#94a3b8', fontSize: '0.75rem' }}>
          © 2024 TalentFlow Enterprise ATS. All candidate data is processed according to internal privacy policies.
        </Typography>

      </Box>

      {/* ── Resume Preview Dialog ── */}
      <Dialog
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '16px', overflow: 'hidden',
            height: '85vh', display: 'flex', flexDirection: 'column',
          },
        }}
      >
        <DialogTitle sx={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          px: 3, py: 2, bgcolor: '#f8fafc', borderBottom: '1px solid #e2e8f0',
        }}>
          <Box>
            <Typography sx={{ fontWeight: 700, color: '#0f172a', fontSize: '1.1rem' }}>
              Resume Preview
            </Typography>
            {resumeFile && (
              <Typography sx={{ color: '#64748b', fontSize: '0.8rem' }}>
                {resumeFile.name}
              </Typography>
            )}
          </Box>
          <IconButton onClick={() => setPreviewOpen(false)} size="small">
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ flex: 1, p: 0, overflow: 'hidden' }}>
          {resumeFile && resumeFile.type === 'application/pdf' ? (
            <iframe
              src={URL.createObjectURL(resumeFile)}
              title="Resume Preview"
              style={{ width: '100%', height: '100%', border: 'none' }}
            />
          ) : resumeFile ? (
            <Box sx={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              justifyContent: 'center', height: '100%', p: 4, color: '#64748b',
            }}>
              <Typography sx={{ fontWeight: 600, mb: 1 }}>
                Preview not available for this file type
              </Typography>
              <Typography sx={{ fontSize: '0.85rem' }}>
                {resumeFile.name} ({(resumeFile.size / 1024 / 1024).toFixed(2)} MB)
              </Typography>
              <Button
                variant="outlined"
                sx={{ mt: 2, textTransform: 'none', borderRadius: '8px' }}
                onClick={() => {
                  const url = URL.createObjectURL(resumeFile);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = resumeFile.name;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
              >
                Download File
              </Button>
            </Box>
          ) : null}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2, borderTop: '1px solid #e2e8f0' }}>
          <Button
            onClick={() => setPreviewOpen(false)}
            sx={{
              textTransform: 'none', fontWeight: 600, color: '#64748b',
              borderRadius: '8px',
            }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AddCandidate;