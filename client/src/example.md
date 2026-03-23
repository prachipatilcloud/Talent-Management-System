// import { useState, useEffect } from 'react';
// import { useNavigate, useLocation, useParams } from 'react-router-dom';
// import {
//   Box, Typography, Paper, TextField, Button, Chip, Avatar,
//   IconButton, InputAdornment, CircularProgress, Divider,
//   MenuItem, Select, FormControl, InputLabel, Autocomplete,
// } from '@mui/material';
// import {
//   ChevronLeft, Close, Person, Link as LinkIcon,
//   Videocam, Business, CalendarMonth, AccessTime, Add,
// } from '@mui/icons-material';
// import API from '../../api/axios';

// const PRIMARY = '#3b4eba';

// const inputSx = {
//   '& .MuiOutlinedInput-root': {
//     borderRadius: '8px', fontSize: '0.875rem', bgcolor: '#f8fafc',
//     '& fieldset': { borderColor: '#e2e8f0' },
//     '&:hover fieldset': { borderColor: PRIMARY },
//     '&.Mui-focused fieldset': { borderColor: PRIMARY, borderWidth: 2 },
//   },
//   '& .MuiInputLabel-root.Mui-focused': { color: PRIMARY },
// };

// const SectionLabel = ({ children }) => (
//   <Typography sx={{
//     fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase',
//     letterSpacing: '0.08em', color: '#94a3b8', mb: 1.25,
//   }}>
//     {children}
//   </Typography>
// );

// const TIME_SLOTS = [
//   '09:00 AM - 10:00 AM', '10:00 AM - 11:00 AM', '11:00 AM - 12:00 PM',
//   '12:00 PM - 01:00 PM', '01:00 PM - 02:00 PM', '02:00 PM - 03:00 PM',
//   '03:00 PM - 04:00 PM', '04:00 PM - 05:00 PM', '05:00 PM - 06:00 PM',
// ];

// const ROUND_NAMES = [
//   'Initial Screening', 'Technical Round', 'HR Round',
// ];

// const getAvatarColor = (name) => {
//   const colors = ['#4f46e5', '#0891b2', '#059669', '#d97706', '#dc2626', '#7c3aed'];
//   return colors[(name?.charCodeAt(0) || 0) % colors.length];
// };

// const ScheduleInterview = () => {
//   const navigate = useNavigate();
//   const location = useLocation();
//   const { id } = useParams(); // candidate id from URL

//   // Pre-filled from navigation state (passed from CandidatesPage / CandidateProfile)
//   const prefilled = location.state || {};

//   const [candidate, setCandidate] = useState(prefilled.candidate || null);
//   const [candidateSearch, setCandidateSearch] = useState('');
//   const [candidateOptions, setCandidateOptions] = useState([]);
//   const [candidateLoading, setCandidateLoading] = useState(false);

//   const [interviewers, setInterviewers] = useState([]);           // selected interviewers
//   const [interviewerOptions, setInterviewerOptions] = useState([]);  // all available interviewers
//   const [interviewerInput, setInterviewerInput] = useState('');

//   const [form, setForm] = useState({
//     roundName: prefilled.roundName || 'Initial Screening',
//     date: prefilled.date || new Date().toISOString().split('T')[0],
//     timeSlot: prefilled.timeSlot || '10:00 AM - 11:00 AM',
//     mode: prefilled.mode || 'In-office',
//     meetingLink: prefilled.meetingLink || '',
//     officeLocation: prefilled.officeLocation || '',
//     notes: '',
//   });

//   const [errors, setErrors] = useState({});
//   const [loading, setLoading] = useState(false);

//   // If id in URL, fetch that candidate directly
//   useEffect(() => {
//     if (id && !candidate) {
//       API.get(`/candidates/${id}`)
//         .then(res => setCandidate(res.data.candidate))
//         .catch(console.error);
//     }
//   }, [id]);

//   // Fetch available interviewers (users with role=interviewer)
//   useEffect(() => {
//     API.get('/users?role=interviewer&limit=100')
//       .then(res => setInterviewerOptions(res.data.data || []))
//       .catch(() => setInterviewerOptions([]));
//   }, []);

//   // Search candidates when typing (only if no id in URL)
//   useEffect(() => {
//     if (!candidateSearch || id) return;
//     const timer = setTimeout(async () => {
//       setCandidateLoading(true);
//       try {
//         const res = await API.get(`/candidates?search=${candidateSearch}&limit=8`);
//         setCandidateOptions(res.data.candidates || []);
//       } catch { setCandidateOptions([]); }
//       finally { setCandidateLoading(false); }
//     }, 300);
//     return () => clearTimeout(timer);
//   }, [candidateSearch]);

//   const addInterviewer = (interviewer) => {
//     if (!interviewers.find(i => i._id === interviewer._id)) {
//       setInterviewers(prev => [...prev, interviewer]);
//     }
//     setInterviewerInput('');
//   };

//   const removeInterviewer = (id) =>
//     setInterviewers(prev => prev.filter(i => i._id !== id));

//   const handleFormChange = (field) => (e) => {
//     setForm(prev => ({ ...prev, [field]: e.target.value }));
//     if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
//   };

//   const validate = () => {
//     const errs = {};
//     if (!candidate) errs.candidate = 'Please select a candidate';
//     if (!form.roundName) errs.roundName = 'Round name is required';
//     if (!form.date) errs.date = 'Date is required';
//     if (!form.timeSlot) errs.timeSlot = 'Time slot is required';
//     if (interviewers.length === 0) errs.interviewers = 'Add at least one interviewer';
//     if (form.mode === 'Remote' && !form.meetingLink.trim())
//       errs.meetingLink = 'Meeting link is required for remote interviews';
//     return errs;
//   };

//   const handleSubmit = async () => {
//     const errs = validate();
//     if (Object.keys(errs).length) { setErrors(errs); return; }

//     setLoading(true);
//     try {
//       await API.post(`/candidates/${candidate._id}/interviews`, {
//         roundName: form.roundName,
//         scheduledDate: `${form.date} ${form.timeSlot.split(' - ')[0]}`,
//         interviewMode: form.mode,
//         interviewLink: form.mode === 'Remote' ? form.meetingLink : undefined,
//         officeLocation: form.mode === 'In-office' ? form.officeLocation : undefined,
//         interviewers: interviewers.map(i => i._id),
//         notes: form.notes,
//       });

//       // Navigate back to candidate profile after scheduling
//       const basePath = location.pathname.startsWith('/admin') ? '/admin' : '/hr';
//       navigate(`${basePath}/candidates/${candidate._id}`);
//     } catch (err) {
//       setErrors({ submit: err.response?.data?.message || 'Failed to schedule interview' });
//     } finally {
//       setLoading(false);
//     }
//   };

//   const basePath = location.pathname.startsWith('/admin') ? '/admin' : '/hr';

//   return (
//     <Box sx={{ height: '100%', overflow: 'auto', bgcolor: '#f6f6f8' }}>
//       <Box sx={{ maxWidth: 720, mx: 'auto', px: 4, py: 5 }}>

//         {/* Back Nav */}
//         <Box onClick={() => navigate(-1)} sx={{
//           display: 'inline-flex', alignItems: 'center', gap: 0.25,
//           color: PRIMARY, fontWeight: 600, fontSize: '0.9rem',
//           cursor: 'pointer', mb: 3, '&:hover': { textDecoration: 'underline' },
//         }}>
//           <ChevronLeft sx={{ fontSize: 20 }} />
//           Back
//         </Box>

//         <Paper elevation={0} sx={{
//           borderRadius: '16px', border: '1px solid rgba(226,232,240,0.5)',
//           boxShadow: '0 4px 20px rgba(0,0,0,0.08)', bgcolor: 'white', overflow: 'hidden',
//         }}>
//           {/* Header */}
//           <Box sx={{
//             px: 5, pt: 5, pb: 4,
//             background: `linear-gradient(135deg, ${PRIMARY}08 0%, transparent 60%)`,
//             borderBottom: '1px solid #f1f5f9',
//           }}>
//             <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
//               <Box sx={{
//                 width: 40, height: 40, borderRadius: '10px',
//                 bgcolor: `${PRIMARY}15`, display: 'flex', alignItems: 'center', justifyContent: 'center',
//               }}>
//                 <CalendarMonth sx={{ fontSize: 22, color: PRIMARY }} />
//               </Box>
//               <Typography sx={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>
//                 Schedule Interview
//               </Typography>
//             </Box>
//             <Typography sx={{ color: '#64748b', fontSize: '0.875rem', ml: 7 }}>
//               Fill in the details to schedule an interview round for a candidate.
//             </Typography>
//           </Box>

//           <Box sx={{ px: 5, py: 4, display: 'flex', flexDirection: 'column', gap: 3.5 }}>

//             {/* ── Candidate ── */}
//             <Box>
//               <SectionLabel>Candidate</SectionLabel>
//               {candidate ? (
//                 // Show selected candidate card
//                 <Box sx={{
//                   display: 'flex', alignItems: 'center', gap: 2,
//                   p: 2, borderRadius: '10px', border: `2px solid ${PRIMARY}30`,
//                   bgcolor: `${PRIMARY}05`,
//                 }}>
//                   <Avatar sx={{
//                     width: 42, height: 42, flexShrink: 0,
//                     bgcolor: `${getAvatarColor(candidate.firstName)}20`,
//                     color: getAvatarColor(candidate.firstName),
//                     fontSize: '0.875rem', fontWeight: 700,
//                   }}>
//                     {candidate.firstName?.[0]}{candidate.lastName?.[0]}
//                   </Avatar>
//                   <Box sx={{ flex: 1 }}>
//                     <Typography sx={{ fontWeight: 700, fontSize: '0.9375rem', color: '#0f172a' }}>
//                       {candidate.firstName} {candidate.lastName}
//                     </Typography>
//                     <Typography sx={{ fontSize: '0.75rem', color: '#64748b' }}>
//                       {candidate.jobRole} · {candidate.email}
//                     </Typography>
//                   </Box>
//                   {/* Allow changing candidate only if not pre-filled from URL */}
//                   {!id && (
//                     <IconButton size="small" onClick={() => setCandidate(null)}
//                       sx={{ color: '#94a3b8', '&:hover': { color: '#ef4444' } }}>
//                       <Close fontSize="small" />
//                     </IconButton>
//                   )}
//                 </Box>
//               ) : (
//                 <Autocomplete
//                   options={candidateOptions}
//                   getOptionLabel={(o) => `${o.firstName} ${o.lastName}`}
//                   loading={candidateLoading}
//                   onInputChange={(_, val) => setCandidateSearch(val)}
//                   onChange={(_, val) => { if (val) setCandidate(val); }}
//                   renderOption={(props, option) => (
//                     <Box component="li" {...props} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
//                       <Avatar sx={{
//                         width: 30, height: 30, fontSize: '0.7rem', fontWeight: 700,
//                         bgcolor: `${getAvatarColor(option.firstName)}20`,
//                         color: getAvatarColor(option.firstName),
//                       }}>
//                         {option.firstName?.[0]}{option.lastName?.[0]}
//                       </Avatar>
//                       <Box>
//                         <Typography sx={{ fontSize: '0.875rem', fontWeight: 600 }}>
//                           {option.firstName} {option.lastName}
//                         </Typography>
//                         <Typography sx={{ fontSize: '0.7rem', color: '#94a3b8' }}>{option.jobRole}</Typography>
//                       </Box>
//                     </Box>
//                   )}
//                   renderInput={(params) => (
//                     <TextField
//                       {...params}
//                       placeholder="Search candidate by name..."
//                       size="small"
//                       error={!!errors.candidate}
//                       helperText={errors.candidate}
//                       sx={inputSx}
//                       InputProps={{
//                         ...params.InputProps,
//                         startAdornment: (
//                           <InputAdornment position="start">
//                             <Person sx={{ fontSize: 18, color: '#94a3b8' }} />
//                           </InputAdornment>
//                         ),
//                       }}
//                     />
//                   )}
//                 />
//               )}
//             </Box>

//             <Divider sx={{ borderColor: '#f1f5f9' }} />

//             {/* ── Round Name ── */}
//             <Box>
//               <SectionLabel>Interview Round</SectionLabel>
//               <FormControl fullWidth size="small" sx={inputSx}>
//                 <Select
//                   value={form.roundName}
//                   onChange={handleFormChange('roundName')}
//                   displayEmpty
//                   sx={{ borderRadius: '8px', bgcolor: '#f8fafc' }}
//                 >
//                   {ROUND_NAMES.map(r => (
//                     <MenuItem key={r} value={r}>{r}</MenuItem>
//                   ))}
//                 </Select>
//               </FormControl>
//               {errors.roundName && (
//                 <Typography sx={{ fontSize: '0.75rem', color: '#ef4444', mt: 0.5 }}>{errors.roundName}</Typography>
//               )}
//             </Box>

//             <Divider sx={{ borderColor: '#f1f5f9' }} />

//             {/* ── Interviewers ── */}
//             <Box>
//               <SectionLabel>Interviewers</SectionLabel>
//               <Box sx={{
//                 minHeight: 52, px: 1.5, py: 1, borderRadius: '8px',
//                 border: `1px solid ${errors.interviewers ? '#ef4444' : '#e2e8f0'}`,
//                 bgcolor: '#f8fafc',
//                 display: 'flex', flexWrap: 'wrap', gap: 0.75, alignItems: 'center',
//                 '&:focus-within': { borderColor: PRIMARY, boxShadow: `0 0 0 2px ${PRIMARY}20` },
//               }}>
//                 {interviewers.map(iv => (
//                   <Chip
//                     key={iv._id}
//                     avatar={
//                       <Avatar sx={{
//                         bgcolor: `${getAvatarColor(iv.firstName)}20 !important`,
//                         color: `${getAvatarColor(iv.firstName)} !important`,
//                         fontSize: '0.6rem !important', fontWeight: 700,
//                       }}>
//                         {iv.firstName?.[0]}{iv.lastName?.[0]}
//                       </Avatar>
//                     }
//                     label={`${iv.firstName} ${iv.lastName}`}
//                     onDelete={() => removeInterviewer(iv._id)}
//                     deleteIcon={<Close sx={{ fontSize: '13px !important' }} />}
//                     size="small"
//                     sx={{
//                       bgcolor: `${PRIMARY}10`, color: PRIMARY, fontWeight: 600,
//                       fontSize: '0.75rem', border: `1px solid ${PRIMARY}20`,
//                       '& .MuiChip-deleteIcon': { color: PRIMARY, opacity: 0.7 },
//                     }}
//                   />
//                 ))}
//                 {/* Interviewer search input */}
//                 <Box sx={{ flex: 1, minWidth: 140, position: 'relative' }}>
//                   <Box
//                     component="input"
//                     value={interviewerInput}
//                     onChange={(e) => setInterviewerInput(e.target.value)}
//                     placeholder={interviewers.length === 0 ? 'Search interviewers...' : 'Add more...'}
//                     autoComplete="off"
//                     sx={{
//                       width: '100%', border: 'none', outline: 'none',
//                       fontSize: '0.875rem', bgcolor: 'transparent', color: '#374151',
//                       '&::placeholder': { color: '#94a3b8' },
//                     }}
//                   />
//                   {/* Dropdown suggestions */}
//                   {interviewerInput && (
//                     <Paper elevation={4} sx={{
//                       position: 'absolute', top: '100%', left: 0, right: 0,
//                       mt: 0.5, borderRadius: '8px', zIndex: 100,
//                       border: '1px solid #e2e8f0', maxHeight: 200, overflow: 'auto',
//                     }}>
//                       {interviewerOptions
//                         .filter(iv =>
//                           `${iv.firstName} ${iv.lastName}`.toLowerCase().includes(interviewerInput.toLowerCase()) &&
//                           !interviewers.find(s => s._id === iv._id)
//                         )
//                         .map(iv => (
//                           <Box key={iv._id} onMouseDown={() => addInterviewer(iv)}
//                             sx={{
//                               display: 'flex', alignItems: 'center', gap: 1.5,
//                               px: 2, py: 1, cursor: 'pointer',
//                               '&:hover': { bgcolor: `${PRIMARY}05` },
//                               borderBottom: '1px solid #f1f5f9',
//                             }}>
//                             <Avatar sx={{
//                               width: 28, height: 28, fontSize: '0.65rem', fontWeight: 700,
//                               bgcolor: `${getAvatarColor(iv.firstName)}20`,
//                               color: getAvatarColor(iv.firstName),
//                             }}>
//                               {iv.firstName?.[0]}{iv.lastName?.[0]}
//                             </Avatar>
//                             <Box>
//                               <Typography sx={{ fontSize: '0.8125rem', fontWeight: 600, color: '#0f172a' }}>
//                                 {iv.firstName} {iv.lastName}
//                               </Typography>
//                               <Typography sx={{ fontSize: '0.7rem', color: '#94a3b8' }}>{iv.email}</Typography>
//                             </Box>
//                           </Box>
//                         ))}
//                     </Paper>
//                   )}
//                 </Box>
//               </Box>
//               {errors.interviewers && (
//                 <Typography sx={{ fontSize: '0.75rem', color: '#ef4444', mt: 0.5 }}>{errors.interviewers}</Typography>
//               )}
//               <Typography sx={{ fontSize: '0.7rem', color: '#94a3b8', mt: 0.5 }}>
//                 Type to search and add interviewers
//               </Typography>
//             </Box>

//             <Divider sx={{ borderColor: '#f1f5f9' }} />

//             {/* ── Date & Time ── */}
//             <Box>
//               <SectionLabel>Date & Time</SectionLabel>
//               <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
//                 <TextField
//                   type="date"
//                   size="small"
//                   value={form.date}
//                   onChange={handleFormChange('date')}
//                   error={!!errors.date}
//                   helperText={errors.date}
//                   inputProps={{ min: new Date().toISOString().split('T')[0] }}
//                   autoComplete="off"
//                   sx={inputSx}
//                   InputProps={{
//                     startAdornment: (
//                       <InputAdornment position="start">
//                         <CalendarMonth sx={{ fontSize: 16, color: '#94a3b8' }} />
//                       </InputAdornment>
//                     ),
//                   }}
//                 />
//                 <FormControl size="small" sx={inputSx}>
//                   <Select
//                     value={form.timeSlot}
//                     onChange={handleFormChange('timeSlot')}
//                     sx={{ borderRadius: '8px', bgcolor: '#f8fafc' }}
//                     startAdornment={
//                       <InputAdornment position="start">
//                         <AccessTime sx={{ fontSize: 16, color: '#94a3b8' }} />
//                       </InputAdornment>
//                     }
//                   >
//                     {TIME_SLOTS.map(t => (
//                       <MenuItem key={t} value={t}>{t}</MenuItem>
//                     ))}
//                   </Select>
//                 </FormControl>
//               </Box>
//             </Box>

//             <Divider sx={{ borderColor: '#f1f5f9' }} />

//             {/* ── Interview Mode ── */}
//             <Box>
//               <SectionLabel>Interview Mode</SectionLabel>
//               <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
//                 {['Remote', 'In-office'].map(mode => (
//                   <Box
//                     key={mode}
//                     onClick={() => setForm(prev => ({ ...prev, mode }))}
//                     sx={{
//                       display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1.5,
//                       py: 1.75, borderRadius: '10px', cursor: 'pointer', transition: 'all 0.15s',
//                       border: `2px solid ${form.mode === mode ? PRIMARY : '#e2e8f0'}`,
//                       bgcolor: form.mode === mode ? `${PRIMARY}08` : 'white',
//                       color: form.mode === mode ? PRIMARY : '#64748b',
//                     }}
//                   >
//                     {mode === 'Remote'
//                       ? <Videocam sx={{ fontSize: 20 }} />
//                       : <Business sx={{ fontSize: 20 }} />
//                     }
//                     <Typography sx={{ fontSize: '0.875rem', fontWeight: 600 }}>{mode}</Typography>
//                   </Box>
//                 ))}
//               </Box>
//             </Box>

//             {/* ── Meeting Link or Office Location ── */}
//             {form.mode === 'Remote' ? (
//               <Box>
//                 <SectionLabel>Meeting Link</SectionLabel>
//                 <TextField
//                   fullWidth size="small"
//                   placeholder="https://meet.google.com/..."
//                   value={form.meetingLink}
//                   onChange={handleFormChange('meetingLink')}
//                   error={!!errors.meetingLink}
//                   helperText={errors.meetingLink}
//                   autoComplete="off"
//                   sx={inputSx}
//                   InputProps={{
//                     startAdornment: (
//                       <InputAdornment position="start">
//                         <LinkIcon sx={{ fontSize: 16, color: '#94a3b8' }} />
//                       </InputAdornment>
//                     ),
//                   }}
//                 />
//               </Box>
//             ) : (
//               <Box>
//                 <SectionLabel>Office Location / Room</SectionLabel>
//                 <TextField
//                   fullWidth size="small"
//                   placeholder="e.g. Conference Room B, 3rd Floor"
//                   value={form.officeLocation}
//                   onChange={handleFormChange('officeLocation')}
//                   autoComplete="off"
//                   sx={inputSx}
//                   InputProps={{
//                     startAdornment: (
//                       <InputAdornment position="start">
//                         <Business sx={{ fontSize: 16, color: '#94a3b8' }} />
//                       </InputAdornment>
//                     ),
//                   }}
//                 />
//               </Box>
//             )}

//             <Divider sx={{ borderColor: '#f1f5f9' }} />

//             {/* ── Notes ── */}
//             <Box>
//               <SectionLabel>Notes (Optional)</SectionLabel>
//               <TextField
//                 fullWidth multiline rows={3}
//                 placeholder="Any special instructions or topics to cover..."
//                 value={form.notes}
//                 onChange={handleFormChange('notes')}
//                 autoComplete="off"
//                 sx={{
//                   ...inputSx,
//                   '& .MuiOutlinedInput-root': {
//                     ...inputSx['& .MuiOutlinedInput-root'],
//                     alignItems: 'flex-start',
//                   },
//                 }}
//               />
//             </Box>

//             {errors.submit && (
//               <Box sx={{ p: 2, bgcolor: '#fff1f2', borderRadius: '8px', border: '1px solid #fecdd3' }}>
//                 <Typography sx={{ fontSize: '0.875rem', color: '#be123c', fontWeight: 500 }}>
//                   {errors.submit}
//                 </Typography>
//               </Box>
//             )}

//             {/* ── Footer ── */}
//             <Divider sx={{ borderColor: '#f1f5f9' }} />
//             <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
//               <Button onClick={() => navigate(-1)} sx={{
//                 textTransform: 'none', color: '#64748b', fontWeight: 600,
//                 fontSize: '0.9rem', px: 3, py: 1.25, borderRadius: '8px',
//                 '&:hover': { bgcolor: '#f1f5f9' },
//               }}>
//                 Cancel
//               </Button>
//               <Button variant="contained" onClick={handleSubmit} disabled={loading} sx={{
//                 textTransform: 'none', fontWeight: 700, fontSize: '0.9rem',
//                 px: 4, py: 1.25, borderRadius: '8px', bgcolor: PRIMARY,
//                 boxShadow: '0 4px 14px rgba(59,78,186,0.25)',
//                 '&:hover': { bgcolor: '#2f3da0', transform: 'translateY(-1px)' },
//                 '&:active': { transform: 'translateY(0)' },
//                 '&.Mui-disabled': { bgcolor: '#93c5fd', color: 'white' },
//                 transition: 'all 0.2s',
//               }}>
//                 {loading
//                   ? <CircularProgress size={18} sx={{ color: 'white' }} />
//                   : 'Schedule Interview'
//                 }
//               </Button>
//             </Box>

//           </Box>
//         </Paper>

//         <Typography sx={{ mt: 3, textAlign: 'center', color: '#94a3b8', fontSize: '0.75rem' }}>
//           © 2024 TalentFlow Enterprise ATS. All candidate data is processed according to internal privacy policies.
//         </Typography>
//       </Box>
//     </Box>
//   );
// };

// export default ScheduleInterview;
