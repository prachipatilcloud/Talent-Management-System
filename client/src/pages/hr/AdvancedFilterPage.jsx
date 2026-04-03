import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../../api/axios';
import {
  Box, Typography, Button, TextField, InputAdornment,
  Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Paper, Avatar, IconButton, Menu, MenuItem,
  CircularProgress, Pagination, Checkbox, Chip, Divider
} from '@mui/material';
import {
  Search, PersonAdd, FileDownload, MoreHoriz,
  Close, Visibility, Edit, Delete, ArrowBack, FilterList
} from '@mui/icons-material';

const PRIMARY = '#3b4eba';

const statusConfig = {
  Applied:      { bg: '#f1f5f9', color: '#475569', border: '#e2e8f0' },
  Shortlisted:  { bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe' },
  Interviewing: { bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe' },
  Selected:     { bg: '#f0fdf4', color: '#15803d', border: '#bbf7d0' },
  Rejected:     { bg: '#fff1f2', color: '#be123c', border: '#fecdd3' },
  'On Hold':    { bg: '#fefce8', color: '#a16207', border: '#fef08a' },
  'Talent Pool':{ bg: '#faf5ff', color: '#7e22ce', border: '#e9d5ff' },
};

const experienceLevels = [
  { label: 'Junior',    range: [0, 2]   },
  { label: 'Mid-Level', range: [3, 5]   },
  { label: 'Senior',    range: [6, 10]  },
  { label: 'Lead',      range: [11, 100] },
];

const expColors = {
  Junior:     { bg: '#f0fdf4', color: '#15803d' },
  'Mid-Level':{ bg: '#eff6ff', color: '#1d4ed8' },
  Senior:     { bg: '#f5f3ff', color: '#7c3aed' },
  Lead:       { bg: '#fefce8', color: '#a16207' },
};

const getExpLevel = (years) => {
  const y = Number(years);
  if (y <= 2)  return 'Junior';
  if (y <= 5)  return 'Mid-Level';
  if (y <= 10) return 'Senior';
  return 'Lead';
};

const getAvatarColor = (name) => {
  const colors = ['#4f46e5', '#0891b2', '#059669', '#d97706', '#dc2626', '#7c3aed'];
  return colors[(name?.charCodeAt(0) || 0) % colors.length];
};

const formatDate = (dateStr) => {
  const diff = Math.floor((new Date() - new Date(dateStr)) / 1000);
  if (diff < 3600)   return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400)  return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(dateStr).toLocaleDateString();
};

const AdvancedFilterPage = () => {
  const navigate = useNavigate();

  const [search, setSearch]                     = useState('');
  const [selectedStatuses, setSelectedStatuses] = useState([]);
  const [selectedLevel, setSelectedLevel]       = useState(null);
  const [skillInput, setSkillInput]             = useState('');
  const [selectedSkills, setSelectedSkills]     = useState([]);
  const [availableSkills, setAvailableSkills]   = useState([]);
  const [showSkillSuggestions, setShowSkillSuggestions] = useState(false);

  const [candidates, setCandidates]           = useState([]);
  const [total, setTotal]                     = useState(0);
  const [page, setPage]                       = useState(1);
  const [loading, setLoading]                 = useState(false);
  const [statusCounts, setStatusCounts]       = useState({});
  const [menuAnchor, setMenuAnchor]           = useState(null);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [selected, setSelected]               = useState([]);

  const LIMIT = 10;

  const activeFilters = [
    ...(selectedStatuses.length ? [{ label: `Status: ${selectedStatuses.join(', ')}`, key: 'status' }] : []),
    ...(selectedLevel            ? [{ label: `Experience: ${selectedLevel}`,           key: 'level'  }] : []),
    ...(selectedSkills.length   ? [{ label: `Skills: ${selectedSkills.join(', ')}`,   key: 'skills' }] : []),
    ...(search                  ? [{ label: `Search: ${search}`,                       key: 'search' }] : []),
  ];

  const fetchCandidates = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();

      if (search) params.append('search', search);

      // Status: append each status separately for multiple selection
      selectedStatuses.forEach(status => params.append('status', status));

      // ── FIX: send `experienceLevel` label string, NOT minExp/maxExp ──
      // The backend's getAllCandidates reads req.query.experienceLevel and
      // maps it via getExperienceRange('Junior') → { min:0, max:2 } etc.
      // Old code sent minExp/maxExp which the backend never read → no filter.
      if (selectedLevel) params.append('experienceLevel', selectedLevel);

      if (selectedSkills.length) {
        selectedSkills.forEach(skill => params.append('skills', skill));
      }
      params.append('page', page);
      params.append('limit', LIMIT);

      const res = await API.get(`/candidates?${params}`);
      setCandidates(res.data.candidates);
      setTotal(res.data.count);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [search, selectedStatuses, selectedLevel, selectedSkills, page]);

  useEffect(() => { fetchCandidates(); }, [fetchCandidates]);

  useEffect(() => {
    API.get('/candidates/stats/status-counts')
      .then(res => setStatusCounts(res.data.statusCounts || {}))
      .catch(console.error);
  }, []);

  useEffect(() => {
    API.get('/candidates/stats/skills')
      .then(res => setAvailableSkills(res.data.skills || []))
      .catch(console.error);
  }, []);

  const toggleStatus = (status) => {
    setSelectedStatuses(prev =>
      prev.includes(status) ? prev.filter(s => s !== status) : [...prev, status]
    );
    setPage(1);
  };

  const addSkill = (skill) => {
    const trimmed = skill ? skill.trim() : skillInput.trim();
    if (trimmed && !selectedSkills.includes(trimmed)) {
      setSelectedSkills(prev => [...prev, trimmed]);
      if (!availableSkills.includes(trimmed)) setAvailableSkills(prev => [...prev, trimmed]);
    }
    setSkillInput('');
    setShowSkillSuggestions(false);
    setPage(1);
  };

  const filteredSkillSuggestions = availableSkills
    .filter(s => s.toLowerCase().includes(skillInput.toLowerCase()) && !selectedSkills.includes(s))
    .slice(0, 8);

  const removeFilter = (key) => {
    if (key === 'status') setSelectedStatuses([]);
    if (key === 'level')  setSelectedLevel(null);
    if (key === 'skills') { setSelectedSkills([]); }
    if (key === 'search') setSearch('');
    setPage(1);
  };

  const clearAll = () => {
    setSelectedStatuses([]);
    setSelectedLevel(null);
    setSelectedSkills([]);
    setSearch('');
    setPage(1);
  };

  const handleMenuOpen  = (e, c) => { e.stopPropagation(); setMenuAnchor(e.currentTarget); setSelectedCandidate(c); };
  const handleMenuClose = () => { setMenuAnchor(null); setSelectedCandidate(null); };

  const handleDelete = async () => {
    if (!selectedCandidate) return;
    try { await API.delete(`/candidates/${selectedCandidate._id}`); fetchCandidates(); }
    catch (err) { console.error(err); }
    handleMenuClose();
  };

  const toggleSelect = (id) =>
    setSelected(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>

      {/* ── Top Navbar ── */}
      <Box sx={{
        height: 64, bgcolor: 'white', borderBottom: '1px solid #e2e8f0',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        px: 3, flexShrink: 0, zIndex: 10,
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box sx={{ bgcolor: PRIMARY, color: 'white', p: 0.75, borderRadius: '8px', display: 'flex', alignItems: 'center' }}>
            <FilterList sx={{ fontSize: 20 }} />
          </Box>
          <Typography sx={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a' }}>
            Internal ATS
          </Typography>
        </Box>

        <Box sx={{ flex: 1, maxWidth: 560, mx: 4 }}>
          <TextField fullWidth size="small" value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search candidates, roles, or skills..."
            InputProps={{ startAdornment: <InputAdornment position="start"><Search sx={{ fontSize: 18, color: '#94a3b8' }} /></InputAdornment> }}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: '12px', bgcolor: '#f1f5f9', fontSize: '0.875rem',
                '& fieldset': { borderColor: '#e2e8f0' },
                '&:hover fieldset': { borderColor: PRIMARY },
                '&.Mui-focused fieldset': { borderColor: PRIMARY, borderWidth: 2 },
              },
            }}
          />
        </Box>

        <Box sx={{
          width: 34, height: 34, borderRadius: '50%', bgcolor: '#e2e8f0',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '0.75rem', fontWeight: 700, color: '#64748b',
        }}>HR</Box>
      </Box>

      {/* ── Body ── */}
      <Box sx={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

        {/* ── Left Sidebar ── */}
        <Box sx={{
          width: 280, flexShrink: 0, bgcolor: 'white', borderRight: '1px solid #e2e8f0',
          display: 'flex', flexDirection: 'column', overflow: 'auto', p: 3, gap: 3,
        }}>
          <Button startIcon={<ArrowBack fontSize="small" />} onClick={() => navigate('/hr/candidates')}
            sx={{ textTransform: 'none', color: '#64748b', fontWeight: 600, fontSize: '0.8125rem', justifyContent: 'flex-start', p: 0, '&:hover': { color: PRIMARY, bgcolor: 'transparent' } }}>
            Back to Candidates
          </Button>

          {/* Hiring Status */}
          <Box>
            <Typography sx={{ fontSize: '0.6875rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', mb: 2 }}>
              Hiring Status
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
              {Object.keys(statusConfig).map(status => (
                <Box key={status} onClick={() => toggleStatus(status)} sx={{
                  display: 'flex', alignItems: 'center', gap: 1.5,
                  py: 0.75, px: 1, borderRadius: '6px', cursor: 'pointer',
                  bgcolor: selectedStatuses.includes(status) ? 'rgba(59,78,186,0.04)' : 'transparent',
                  '&:hover': { bgcolor: '#f8fafc' },
                }}>
                  <Checkbox checked={selectedStatuses.includes(status)} size="small"
                    sx={{ p: 0, color: '#cbd5e1', '&.Mui-checked': { color: PRIMARY } }} />
                  <Typography sx={{ flex: 1, fontSize: '0.875rem', color: '#475569', fontWeight: selectedStatuses.includes(status) ? 600 : 400 }}>
                    {status}
                  </Typography>
                  <Box sx={{ bgcolor: '#f1f5f9', borderRadius: '4px', px: 0.75, fontSize: '0.7rem', color: '#64748b', fontWeight: 600 }}>
                    {statusCounts[status] || 0}
                  </Box>
                </Box>
              ))}
            </Box>
          </Box>

          <Divider sx={{ borderColor: '#f1f5f9' }} />

          {/* Experience Level */}
          <Box>
            <Typography sx={{ fontSize: '0.6875rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', mb: 2 }}>
              Experience Level
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
              {experienceLevels.map(({ label, range }) => (
                <Button key={label}
                  onClick={() => { setSelectedLevel(selectedLevel === label ? null : label); setPage(1); }}
                  sx={{
                    borderRadius: '8px', textTransform: 'none',
                    fontSize: '0.75rem', fontWeight: 600, py: 0.875,
                    bgcolor: selectedLevel === label ? PRIMARY : 'transparent',
                    color:   selectedLevel === label ? 'white' : '#374151',
                    border: `1px solid ${selectedLevel === label ? PRIMARY : '#e2e8f0'}`,
                    flexDirection: 'column', lineHeight: 1.3,
                    '&:hover': { borderColor: PRIMARY, bgcolor: selectedLevel === label ? PRIMARY : 'rgba(59,78,186,0.05)' },
                  }}
                >
                  {label}
                  <Typography component="span" sx={{
                    fontSize: '0.6rem', fontWeight: 400,
                    color: selectedLevel === label ? 'rgba(255,255,255,0.75)' : '#94a3b8',
                  }}>
                    {range[0]}–{range[1] === 30 ? '10+' : range[1]} yrs
                  </Typography>
                </Button>
              ))}
            </Box>
          </Box>

          <Divider sx={{ borderColor: '#f1f5f9' }} />

          {/* Skills */}
          <Box sx={{ position: 'relative' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Typography sx={{ fontSize: '0.6875rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Skills Filter
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mb: 1.5 }}>
              {selectedSkills.map(skill => (
                <Chip key={skill} label={skill} size="small"
                  onDelete={() => { setSelectedSkills(prev => prev.filter(s => s !== skill)); setPage(1); }}
                  deleteIcon={<Close sx={{ fontSize: '12px !important' }} />}
                  sx={{ bgcolor: 'rgba(59,78,186,0.08)', color: PRIMARY, fontWeight: 700, fontSize: '0.7rem', '& .MuiChip-deleteIcon': { color: PRIMARY } }}
                />
              ))}
            </Box>
            <TextField size="small" placeholder="Search or add skill..." value={skillInput} fullWidth
              onChange={(e) => { setSkillInput(e.target.value); setShowSkillSuggestions(e.target.value.length > 0); }}
              onFocus={() => skillInput && setShowSkillSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSkillSuggestions(false), 200)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSkill(); } }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '8px', fontSize: '0.8125rem', bgcolor: '#f8fafc',
                  '& fieldset': { borderColor: '#e2e8f0' },
                  '&:hover fieldset': { borderColor: PRIMARY },
                  '&.Mui-focused fieldset': { borderColor: PRIMARY },
                },
              }}
            />
            {showSkillSuggestions && filteredSkillSuggestions.length > 0 && (
              <Paper elevation={3} sx={{
                position: 'absolute', top: '100%', left: 0, right: 0,
                mt: 0.5, maxHeight: 200, overflow: 'auto', zIndex: 1000,
                borderRadius: '8px', border: '1px solid #e2e8f0',
              }}>
                {filteredSkillSuggestions.map(skill => (
                  <Box key={skill} onMouseDown={() => addSkill(skill)} sx={{
                    px: 2, py: 1, cursor: 'pointer', fontSize: '0.8125rem', color: '#374151',
                    '&:hover': { bgcolor: 'rgba(59,78,186,0.05)', color: PRIMARY },
                    borderBottom: '1px solid #f1f5f9', '&:last-child': { borderBottom: 'none' },
                  }}>
                    {skill}
                  </Box>
                ))}
              </Paper>
            )}
            <Typography sx={{ fontSize: '0.7rem', color: '#94a3b8', mt: 0.5 }}>
              Press Enter to add new skill
            </Typography>
          </Box>

          {/* Apply / Clear */}
          <Box sx={{ mt: 'auto', pt: 2, borderTop: '1px solid #f1f5f9', display: 'flex', flexDirection: 'column', gap: 1 }}>
            {activeFilters.length > 0 && (
              <Button onClick={clearAll} sx={{ textTransform: 'none', color: '#ef4444', fontWeight: 600, fontSize: '0.875rem' }}>
                Clear All Filters
              </Button>
            )}
            <Button fullWidth variant="contained" onClick={fetchCandidates} sx={{
              bgcolor: PRIMARY, borderRadius: '8px', textTransform: 'none',
              fontWeight: 700, py: 1.25, fontSize: '0.9375rem',
              boxShadow: '0 4px 14px rgba(59,78,186,0.3)',
              '&:hover': { bgcolor: 'rgba(59,78,186,0.9)' },
            }}>
              Apply Filters {activeFilters.length > 0 && `(${activeFilters.length})`}
            </Button>
          </Box>
        </Box>

        {/* ── Main Content ── */}
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', mb: 3 }}>
            <Box>
              <Typography sx={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.025em' }}>
                Candidate Search
              </Typography>
              <Typography sx={{ color: '#64748b', fontSize: '0.875rem', mt: 0.5 }}>
                Found {total} candidate{total !== 1 ? 's' : ''} matching your criteria
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 1.5 }}>
              <Button variant="outlined" startIcon={<FileDownload />} sx={{
                borderColor: '#e2e8f0', color: '#374151', borderRadius: '8px',
                textTransform: 'none', fontWeight: 600, fontSize: '0.875rem',
                '&:hover': { borderColor: '#cbd5e1', bgcolor: '#f8fafc' },
              }}>Export</Button>
              <Button variant="contained" startIcon={<PersonAdd />} onClick={() => navigate('/hr/candidates/add')} sx={{
                bgcolor: PRIMARY, borderRadius: '8px', textTransform: 'none',
                fontWeight: 700, fontSize: '0.875rem',
                boxShadow: '0 4px 14px rgba(59,78,186,0.3)',
                '&:hover': { bgcolor: 'rgba(59,78,186,0.9)' },
              }}>Add Candidate</Button>
            </Box>
          </Box>

          {/* Active Filters Bar */}
          {activeFilters.length > 0 && (
            <Box sx={{
              display: 'flex', alignItems: 'center', gap: 1.5, mb: 2.5,
              bgcolor: 'white', p: 1.5, borderRadius: '10px',
              border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            }}>
              <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', px: 1 }}>
                Active:
              </Typography>
              {activeFilters.map(f => (
                <Chip key={f.key} label={f.label} size="small"
                  onDelete={() => removeFilter(f.key)}
                  deleteIcon={<Close sx={{ fontSize: '14px !important' }} />}
                  sx={{
                    bgcolor: '#f1f5f9', color: '#374151', fontWeight: 600,
                    fontSize: '0.75rem', border: '1px solid #e2e8f0', borderRadius: '999px',
                    '& .MuiChip-deleteIcon': { color: '#94a3b8', '&:hover': { color: '#ef4444' } },
                  }}
                />
              ))}
              <Button onClick={clearAll} sx={{
                ml: 'auto', color: PRIMARY, fontSize: '0.75rem', fontWeight: 700,
                textTransform: 'none', minWidth: 'auto', pl: 2,
                borderLeft: '1px solid #e2e8f0', borderRadius: 0,
              }}>Clear All</Button>
            </Box>
          )}

          {/* Table */}
          <Paper elevation={0} sx={{
            border: '1px solid #e2e8f0', borderRadius: '10px',
            overflow: 'hidden', flex: 1, display: 'flex', flexDirection: 'column',
          }}>
            <TableContainer sx={{ flex: 1 }}>
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell padding="checkbox" sx={{ pl: 2, bgcolor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                      <input type="checkbox" style={{ accentColor: PRIMARY, width: 16, height: 16 }} />
                    </TableCell>
                    {['Candidate Name', 'Status', 'Current Role', 'Top Skills', 'Experience', 'Applied'].map(h => (
                      <TableCell key={h} sx={{
                        bgcolor: '#f8fafc', fontSize: '0.7rem', fontWeight: 700,
                        color: '#64748b', textTransform: 'uppercase',
                        letterSpacing: '0.05em', borderBottom: '1px solid #e2e8f0',
                      }}>{h}</TableCell>
                    ))}
                    <TableCell sx={{ bgcolor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }} />
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                        <CircularProgress size={28} sx={{ color: PRIMARY }} />
                      </TableCell>
                    </TableRow>
                  ) : candidates.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} align="center" sx={{ py: 6, color: '#94a3b8' }}>
                        No candidates found matching your filters
                      </TableCell>
                    </TableRow>
                  ) : candidates.map((c) => {
                    const sc          = statusConfig[c.status] || statusConfig.Applied;
                    const initials    = `${c.firstName?.[0] || ''}${c.lastName?.[0] || ''}`.toUpperCase();
                    const avatarColor = getAvatarColor(c.firstName);
                    const expLevel    = getExpLevel(c.experience);
                    const ec          = expColors[expLevel];

                    return (
                      <TableRow key={c._id} hover
                        onClick={() => navigate(`/hr/candidates/${c._id}`)}
                        sx={{ cursor: 'pointer', '&:hover': { bgcolor: 'rgba(59,78,186,0.03)' }, borderBottom: '1px solid #f1f5f9' }}
                      >
                        <TableCell padding="checkbox" sx={{ pl: 2 }} onClick={e => e.stopPropagation()}>
                          <input type="checkbox" checked={selected.includes(c._id)} onChange={() => toggleSelect(c._id)}
                            style={{ accentColor: PRIMARY, width: 16, height: 16 }} />
                        </TableCell>

                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Avatar sx={{ width: 36, height: 36, bgcolor: `${avatarColor}20`, color: avatarColor, fontSize: '0.7rem', fontWeight: 700 }}>
                              {initials}
                            </Avatar>
                            <Box>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography sx={{ fontSize: '0.875rem', fontWeight: 700, color: '#0f172a' }}>
                                  {c.firstName} {c.lastName}
                                </Typography>
                                {c.matchScore > 0 && selectedSkills.length > 0 && (
                                  <Chip label={`${Math.round((c.matchScore / selectedSkills.length) * 100)}% Match`} size="small" 
                                    sx={{ height: 18, fontSize: '0.6rem', fontWeight: 700, bgcolor: '#f0fdf4', color: '#15803d', border: '1px solid #bbf7d0' }} />
                                )}
                              </Box>
                              <Typography sx={{ fontSize: '0.7rem', color: '#94a3b8' }}>{c.email}</Typography>
                            </Box>
                          </Box>
                        </TableCell>

                        <TableCell>
                          <Box component="span" sx={{
                            px: 1.5, py: 0.5, borderRadius: '999px',
                            fontSize: '0.6875rem', fontWeight: 700,
                            bgcolor: sc.bg, color: sc.color, border: `1px solid ${sc.border}`,
                            textTransform: 'uppercase',
                          }}>{c.status}</Box>
                        </TableCell>

                        <TableCell sx={{ fontSize: '0.875rem', color: '#475569' }}>{c.jobRole}</TableCell>

                        <TableCell>
                          <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
                            {c.skills?.slice(0, 2).map(skill => (
                              <Box key={skill} component="span" sx={{
                                px: 1, py: 0.25, bgcolor: 'rgba(59,78,186,0.08)',
                                color: PRIMARY, borderRadius: '4px', fontSize: '0.6875rem', fontWeight: 700,
                              }}>{skill}</Box>
                            ))}
                            {c.skills?.length > 2 && (
                              <Box component="span" sx={{ px: 1, py: 0.25, bgcolor: '#f1f5f9', color: '#64748b', borderRadius: '4px', fontSize: '0.6875rem', fontWeight: 700 }}>
                                +{c.skills.length - 2}
                              </Box>
                            )}
                          </Box>
                        </TableCell>

                        {/* Experience — shows "4 yrs · Mid-Level" */}
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                            <Typography sx={{ fontSize: '0.8125rem', color: '#475569', fontWeight: 500 }}>
                              {c.experience} yr{c.experience !== 1 ? 's' : ''}
                            </Typography>
                            <Box component="span" sx={{
                              px: 1, py: 0.2, borderRadius: '999px',
                              bgcolor: ec.bg, color: ec.color,
                              fontSize: '0.6rem', fontWeight: 700,
                            }}>{expLevel}</Box>
                          </Box>
                        </TableCell>

                        <TableCell sx={{ fontSize: '0.8125rem', color: '#94a3b8' }}>
                          {formatDate(c.createdAt)}
                        </TableCell>

                        <TableCell align="right" onClick={e => e.stopPropagation()}>
                          <IconButton size="small" onClick={(e) => handleMenuOpen(e, c)}
                            sx={{ color: '#94a3b8', '&:hover': { color: PRIMARY } }}>
                            <MoreHoriz fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>

            <Box sx={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              px: 3, py: 1.5, bgcolor: '#f8fafc', borderTop: '1px solid #e2e8f0',
            }}>
              <Typography sx={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 500 }}>
                Showing {Math.min((page - 1) * LIMIT + 1, total)}–{Math.min(page * LIMIT, total)} of {total} entries
              </Typography>
              <Pagination count={Math.ceil(total / LIMIT) || 1} page={page}
                onChange={(_, val) => setPage(val)} size="small"
                sx={{
                  '& .MuiPaginationItem-root': { fontSize: '0.75rem', fontWeight: 600 },
                  '& .Mui-selected': { bgcolor: `${PRIMARY} !important`, color: 'white' },
                }}
              />
            </Box>
          </Paper>
        </Box>
      </Box>

      {/* Actions Menu */}
      <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={handleMenuClose}
        PaperProps={{ sx: { borderRadius: '10px', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', border: '1px solid #e2e8f0', minWidth: 160 } }}>
        <MenuItem onClick={() => { navigate(`/hr/candidates/${selectedCandidate?._id}`); handleMenuClose(); }} sx={{ fontSize: '0.875rem', gap: 1.5 }}>
          <Visibility fontSize="small" sx={{ color: '#64748b' }} /> View Profile
        </MenuItem>
        <MenuItem onClick={() => { navigate(`/hr/candidates/edit/${selectedCandidate?._id}`); handleMenuClose(); }} sx={{ fontSize: '0.875rem', gap: 1.5 }}>
          <Edit fontSize="small" sx={{ color: '#64748b' }} /> Edit
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleDelete} sx={{ fontSize: '0.875rem', gap: 1.5, color: '#ef4444' }}>
          <Delete fontSize="small" /> Delete
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default AdvancedFilterPage;