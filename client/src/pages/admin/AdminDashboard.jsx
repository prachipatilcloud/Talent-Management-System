import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Table, TableHead, TableBody, TableRow, TableCell,
  Button, Chip, Avatar, IconButton, TablePagination,
  CircularProgress, Paper, Badge, Divider,
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  Group as GroupIcon,
  Work as WorkIcon,
  EventAvailable as EventAvailableIcon,
  RateReview as RateReviewIcon,
  PersonAdd as PersonAddIcon,
  BusinessCenter as BusinessCenterIcon,
  Close as CloseIcon,
  CalendarMonth as CalendarIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  ChevronRight as ChevronRightIcon,
  Star as StarIcon,
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import API from '../../api/axios';

/* ── Design tokens ─────────────────────────────────────────── */
const PRIMARY = '#545f73';
const PRIMARY_D = '#485367';
const C = {
  bg: '#F8F7F4',
  surfaceLow: '#f0f4f7',
  surface: '#e8eff3',
  white: '#ffffff',
  onSurface: '#2a3439',
  onVariant: '#566166',
  tertiary: '#005bc4',
  primaryContainer: '#d8e3fb',
  onPrimContainer: '#475266',
  green: '#16a34a', greenBg: '#f0fdf4', greenBorder: '#bbf7d0',
  amber: '#b45309', amberBg: '#fffbeb', amberBorder: '#fde68a',
  red: '#be123c', redBg: '#fff1f2', redBorder: '#fecdd3',
  blue: '#1d4ed8', blueBg: '#eff6ff',
};

/* ── helpers ───────────────────────────────────────────────── */
const getAvatarColor = (name = '') => {
  const palette = [PRIMARY, '#005bc4', '#059669', '#d97706', '#dc2626', '#7c3aed'];
  return palette[(name.charCodeAt(0) || 0) % palette.length];
};

const formatRelative = (d) => {
  if (!d) return '—';
  const diff = (Date.now() - new Date(d)) / 1000;
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} hr ago`;
  return `${Math.floor(diff / 86400)} days ago`;
};

const getStatusStyle = (status) => {
  const map = {
    'Applied': { bg: C.surfaceLow, color: C.onVariant, border: '#a9b4b9' },
    'Shortlisted': { bg: C.blueBg, color: C.blue, border: '#bfdbfe' },
    'Interviewing': { bg: '#eef2ff', color: '#4338ca', border: '#a5b4fc' },
    'Selected': { bg: C.greenBg, color: C.green, border: C.greenBorder },
    'Rejected': { bg: C.redBg, color: C.red, border: C.redBorder },
  };
  return map[status] || { bg: C.surfaceLow, color: C.onVariant, border: '#a9b4b9' };
};

/* ── Section header ────────────────────────────────────────── */
const SectionHeader = ({ title, action, onAction }) => (
  <Box sx={{
    px: 3, py: 2,
    borderBottom: '1px solid #f1f5f9',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  }}>
    <Typography sx={{ fontFamily: "'Manrope',sans-serif", fontWeight: 800, fontSize: '0.9375rem', color: C.onSurface }}>
      {title}
    </Typography>
    {action && (
      <Typography onClick={onAction} sx={{
        fontSize: '0.75rem', fontWeight: 700, color: C.tertiary,
        cursor: 'pointer', '&:hover': { textDecoration: 'underline' },
      }}>
        {action}
      </Typography>
    )}
  </Box>
);

/* ── Stat card (existing style, updated colors) ────────────── */
const StatCard = ({ icon: Icon, title, value, subtitle, accentColor, iconBg, iconColor, alert }) => (
  <Paper elevation={0} sx={{
    p: 2.5,
    borderRadius: '12px',
    border: `1px solid ${alert ? C.amberBorder : '#e8eff3'}`,
    borderTop: `3px solid ${accentColor || PRIMARY}`,
    bgcolor: C.white,
    boxShadow: '0 1px 6px rgba(42,52,57,0.05)',
    transition: 'all 0.18s',
    '&:hover': { boxShadow: '0 6px 20px rgba(42,52,57,0.09)', transform: 'translateY(-2px)' },
  }}>
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
      <Typography sx={{ fontSize: '0.6875rem', fontWeight: 800, color: C.onVariant, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
        {title}
      </Typography>
      <Box sx={{ width: 36, height: 36, borderRadius: '9px', bgcolor: iconBg || C.primaryContainer, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon sx={{ fontSize: 18, color: iconColor || PRIMARY }} />
      </Box>
    </Box>
    <Typography sx={{ fontFamily: "'Manrope',sans-serif", fontSize: '2rem', fontWeight: 800, color: C.onSurface, lineHeight: 1, mb: 0.75 }}>
      {value}
    </Typography>
    <Typography sx={{ fontSize: '0.75rem', color: C.onVariant }}>{subtitle}</Typography>
  </Paper>
);

/* ── Activity log notification dropdown ────────────────────── */
const ActivityDropdown = ({ candidates, onClose }) => {
  const events = [...candidates]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5)
    .map(c => {
      const statusConfig = {
        'Applied': { icon: <PersonAddIcon sx={{ fontSize: 16 }} />, iconBg: C.blueBg, iconColor: C.blue, text: `added ${c.firstName} ${c.lastName}`, sub: `New candidate for ${c.jobRole}` },
        'Shortlisted': { icon: <CheckCircleIcon sx={{ fontSize: 16 }} />, iconBg: C.greenBg, iconColor: C.green, text: `shortlisted ${c.firstName} ${c.lastName}`, sub: `Status changed to Shortlisted` },
        'Interviewing': { icon: <CalendarIcon sx={{ fontSize: 16 }} />, iconBg: C.amberBg, iconColor: C.amber, text: `scheduled interview for ${c.firstName} ${c.lastName}`, sub: `${c.jobRole} · Interview round` },
        'Selected': { icon: <CheckCircleIcon sx={{ fontSize: 16 }} />, iconBg: C.greenBg, iconColor: C.green, text: `selected ${c.firstName} ${c.lastName}`, sub: `Status changed to Selected` },
        'Rejected': { icon: <RateReviewIcon sx={{ fontSize: 16 }} />, iconBg: C.redBg, iconColor: C.red, text: `rejected ${c.firstName} ${c.lastName}`, sub: `Status updated` },
      };
      const cfg = statusConfig[c.status] || statusConfig['Applied'];
      return { ...cfg, time: formatRelative(c.createdAt), id: c._id };
    });

  return (
    <Paper elevation={0} sx={{
      position: 'absolute', top: 44, right: 0,
      width: 360, zIndex: 100,
      borderRadius: '12px',
      border: '1px solid #e8eff3',
      boxShadow: '0 8px 32px rgba(42,52,57,0.14)',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <Box sx={{ px: 3, py: 2, bgcolor: C.surfaceLow, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography sx={{ fontFamily: "'Manrope',sans-serif", fontWeight: 800, fontSize: '0.9375rem', color: C.onSurface }}>
            Activity Log
          </Typography>
          <Typography sx={{ fontSize: '0.6875rem', color: C.onVariant }}>Recent system events</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: C.tertiary, cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}>
            Mark all read
          </Typography>
          <IconButton size="small" onClick={onClose} sx={{ p: 0.5 }}>
            <CloseIcon sx={{ fontSize: 16, color: C.onVariant }} />
          </IconButton>
        </Box>
      </Box>

      {/* Event rows */}
      {events.length === 0 ? (
        <Box sx={{ py: 4, textAlign: 'center' }}>
          <Typography sx={{ fontSize: '0.875rem', color: C.onVariant }}>No recent activity</Typography>
        </Box>
      ) : (
        events.map((ev, i) => (
          <Box key={ev.id} sx={{
            px: 3, py: 1.75,
            display: 'flex', gap: 2, alignItems: 'flex-start',
            borderBottom: i < events.length - 1 ? '1px solid #f1f5f9' : 'none',
            transition: 'background-color 0.15s',
            '&:hover': { bgcolor: C.surfaceLow },
          }}>
            <Box sx={{
              width: 36, height: 36, borderRadius: '9px', flexShrink: 0,
              bgcolor: ev.iconBg, color: ev.iconColor,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {ev.icon}
            </Box>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography sx={{ fontSize: '0.8125rem', fontWeight: 600, color: C.onSurface, lineHeight: 1.4 }}>
                {ev.text}
              </Typography>
              <Typography sx={{ fontSize: '0.75rem', color: C.onVariant, mt: 0.25 }}>{ev.sub}</Typography>
              <Typography sx={{ fontSize: '0.6875rem', color: C.onVariant, mt: 0.5 }}>{ev.time}</Typography>
            </Box>
            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: C.tertiary, flexShrink: 0, mt: 0.75 }} />
          </Box>
        ))
      )}

      {/* Footer */}
      <Box sx={{ borderTop: '1px solid #f1f5f9', py: 1.5, textAlign: 'center' }}>
        <Typography sx={{ fontSize: '0.8125rem', fontWeight: 700, color: C.tertiary, cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}>
          View All Activity →
        </Typography>
      </Box>
    </Paper>
  );
};

/* ══════════════════════════════════════════════════════════ */
const AdminDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [candidatesData, setCandidatesData] = useState([]);
  const [statusCounts, setStatusCounts] = useState({});
  const [hrList, setHrList] = useState([]);
  const [interviewers, setInterviewers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bellOpen, setBellOpen] = useState(false);
  const bellRef = useRef(null);

  /* close bell on outside click */
  useEffect(() => {
    const handler = (e) => {
      if (bellRef.current && !bellRef.current.contains(e.target)) setBellOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        const [candidatesRes, statsRes, usersRes] = await Promise.all([
          API.get('/candidates'),
          API.get('/candidates/stats/status-counts'),
          API.get('/users'),
        ]);

        const data = Array.isArray(candidatesRes.data)
          ? candidatesRes.data
          : (candidatesRes.data?.candidates || []);

        setCandidatesData(data);
        setStatusCounts(statsRes.data.statusCounts || {});

        const users = usersRes.data?.data || usersRes.data?.users || usersRes.data || [];
        setAllUsers(users);
        setHrList(users.filter(u => u.role === 'hr'));
        setInterviewers(users.filter(u => u.role === 'interviewer'));
      } catch (err) {
        console.error('Admin Dashboard Error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  /* ── derived values (all from real data) ── */
  const safeCandidates = Array.isArray(candidatesData) ? candidatesData : [];
  const total = safeCandidates.length;
  const todayStr = new Date().toDateString();

  const interviewsToday = safeCandidates.filter(c =>
    c.interviewRounds?.some(r => new Date(r.scheduledDate).toDateString() === todayStr)
  ).length;

  const pendingFeedback = safeCandidates.filter(c =>
    c.interviewRounds?.some(r =>
      new Date(r.scheduledDate) < new Date() && (!r.feedback || !r.feedback.overallRating)
    )
  ).length;

  /* Per-HR candidate count (linked via addedBy) */
  const hrCandidateCount = (hrId) =>
    safeCandidates.filter(c => String(c.addedBy?._id || c.addedBy) === String(hrId)).length;

  /* Per-HR interviews scheduled */
  const hrInterviewCount = (hrId) =>
    safeCandidates
      .filter(c => String(c.addedBy?._id || c.addedBy) === String(hrId))
      .reduce((sum, c) => sum + (c.interviewRounds?.length || 0), 0);

  /* Per-interviewer rounds (checks interviewers array or feedback submitter) */
  const interviewerRounds = (ivId) =>
    safeCandidates.flatMap(c =>
      (c.interviewRounds || []).filter(r =>
        (r.interviewers || []).some(id => String(id?._id || id) === String(ivId)) ||
        String(r.feedback?.submittedBy?._id || r.feedback?.submittedBy) === String(ivId)
      )
    );

  const interviewerAvgRating = (ivId) => {
    const rounds = interviewerRounds(ivId).filter(r => r.feedback?.overallRating);
    if (!rounds.length) return null;
    return (rounds.reduce((s, r) => s + r.feedback.overallRating, 0) / rounds.length).toFixed(1);
  };

  const interviewerPending = (ivId) =>
    interviewerRounds(ivId).filter(r =>
      new Date(r.scheduledDate) < new Date() && !r.feedback?.overallRating
    ).length;

  /* ── handlers ── */
  const handleChangePage = (_, p) => setPage(p);
  const handleChangeRowsPerPage = (e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); };

  /* ── loading ── */
  if (loading) return (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
      <CircularProgress sx={{ color: PRIMARY }} />
    </Box>
  );

  /* ══════════════════════════════════════════════════════ */
  return (
    <Box sx={{ height: '100%', bgcolor: C.bg, overflow: 'auto', fontFamily: "'Inter',sans-serif" }}>

      {/* ── TOP BAR ─────────────────────────────────── */}
      <Box sx={{
        height: 56, bgcolor: C.white,
        borderBottom: '1px solid #e8eff3',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        px: 3, position: 'sticky', top: 0, zIndex: 20,
      }}>
        <Typography sx={{ fontFamily: "'Manrope',sans-serif", fontWeight: 800, color: C.onSurface, fontSize: '0.9375rem' }}>
          Admin Overview
        </Typography>

        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
          {/* Notification bell */}
          <Box ref={bellRef} sx={{ position: 'relative' }}>
            <IconButton
              size="small"
              onClick={() => setBellOpen(p => !p)}
              sx={{
                bgcolor: bellOpen ? C.primaryContainer : 'transparent',
                transition: 'background-color 0.15s',
                '&:hover': { bgcolor: C.primaryContainer },
              }}
            >
              <Badge badgeContent={pendingFeedback || safeCandidates.length > 0 ? 5 : 0} color="error" sx={{ '& .MuiBadge-badge': { fontSize: '0.625rem', minWidth: 16, height: 16 } }}>
                <NotificationsIcon sx={{ fontSize: 20, color: bellOpen ? PRIMARY : C.onVariant }} />
              </Badge>
            </IconButton>
            {bellOpen && (
              <ActivityDropdown
                candidates={safeCandidates}
                onClose={() => setBellOpen(false)}
              />
            )}
          </Box>

          <Button
            variant="contained" size="small"
            startIcon={<PersonAddIcon sx={{ fontSize: 16 }} />}
            onClick={() => navigate('/admin/add-interviewer')}
            sx={{ textTransform: 'none', bgcolor: PRIMARY, fontSize: '0.75rem', borderRadius: '8px', '&:hover': { bgcolor: PRIMARY_D } }}
          >
            Add Interviewer
          </Button>
          <Button
            variant="outlined" size="small"
            startIcon={<BusinessCenterIcon sx={{ fontSize: 16 }} />}
            onClick={() => navigate('/admin/add-hr')}
            sx={{ textTransform: 'none', color: PRIMARY, borderColor: PRIMARY, fontSize: '0.75rem', borderRadius: '8px' }}
          >
            Add HR
          </Button>
        </Box>
      </Box>

      {/* ── MAIN CONTENT ────────────────────────────── */}
      <Box sx={{ p: 3, maxWidth: 1280, mx: 'auto' }}>

        {/* ── KPI CARDS ── */}
        <Box sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(4,1fr)' },
          gap: 2, mb: 3,
        }}>
          <StatCard icon={GroupIcon} title="Total Candidates" value={total} subtitle={`${statusCounts['Interviewing'] || 0} interviewing`} accentColor={PRIMARY} iconBg={C.primaryContainer} iconColor={PRIMARY} />
          <StatCard icon={EventAvailableIcon} title="Interviews Today" value={interviewsToday} subtitle="Scheduled for today" accentColor="#f97316" iconBg={C.amberBg} iconColor={C.amber} />
          <StatCard icon={RateReviewIcon} title="Pending Feedback" value={pendingFeedback} subtitle="Requires attention" accentColor={C.amber} iconBg={C.amberBg} iconColor={C.amber} alert={pendingFeedback > 0} />
          <StatCard icon={GroupIcon} title="Total Users" value={hrList.length + interviewers.length} subtitle={`${hrList.length} HR · ${interviewers.length} Interviewers`} accentColor={C.blue} iconBg={C.blueBg} iconColor={C.blue} />
        </Box>

        {/* ── HR MANAGERS + INTERVIEWER PERFORMANCE ── */}
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '7fr 5fr' }, gap: 3, mb: 3 }}>

          {/* HR Managers */}
          <Paper elevation={0} sx={{ borderRadius: '12px', border: '1px solid #e8eff3', bgcolor: C.white, boxShadow: '0 1px 6px rgba(42,52,57,0.05)', overflow: 'hidden' }}>
            <SectionHeader title="HR Managers" action="Add HR +" onAction={() => navigate('/admin/add-hr')} />
            {hrList.length === 0 ? (
              <Box sx={{ py: 5, textAlign: 'center' }}>
                <Typography sx={{ fontSize: '0.875rem', color: C.onVariant }}>No HR managers found.</Typography>
              </Box>
            ) : (
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: C.surfaceLow }}>
                    {['Manager', 'Candidates', 'Interviews', 'Status'].map(h => (
                      <TableCell key={h} sx={{ fontSize: '0.6875rem', fontWeight: 800, color: C.onVariant, textTransform: 'uppercase', letterSpacing: '0.08em', py: 1.5 }}>
                        {h}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {hrList.map(hr => {
                    const avatarColor = getAvatarColor(hr.firstName);
                    const candCount = hrCandidateCount(hr._id);
                    const ivCount = hrInterviewCount(hr._id);
                    return (
                      <TableRow
                        key={hr._id} hover
                        onClick={() => navigate(`/admin/hr-managers/${hr._id}`)}
                        sx={{ cursor: 'pointer', '&:hover': { bgcolor: `${C.primaryContainer}30` } }}
                      >
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Avatar sx={{ width: 34, height: 34, bgcolor: `${avatarColor}20`, color: avatarColor, fontSize: '0.75rem', fontWeight: 700 }}>
                              {hr.firstName?.[0]}{hr.lastName?.[0]}
                            </Avatar>
                            <Box>
                              <Typography sx={{ fontSize: '0.875rem', fontWeight: 700, color: C.onSurface }}>{hr.firstName} {hr.lastName}</Typography>
                              <Typography sx={{ fontSize: '0.6875rem', color: C.onVariant }}>{hr.email}</Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ px: 1.5, py: 0.375, bgcolor: C.primaryContainer, color: C.onPrimContainer, borderRadius: '9999px', fontSize: '0.6875rem', fontWeight: 800, display: 'inline-block' }}>
                            {candCount} candidates
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography sx={{ fontSize: '0.875rem', fontWeight: 600, color: C.onSurface }}>{ivCount}</Typography>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: C.green }} />
                            <Typography sx={{ fontSize: '0.75rem', color: C.onVariant }}>Active</Typography>
                          </Box>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </Paper>

          {/* Interviewer Performance */}
          <Paper elevation={0} sx={{ borderRadius: '12px', border: '1px solid #e8eff3', bgcolor: C.white, boxShadow: '0 1px 6px rgba(42,52,57,0.05)', overflow: 'hidden' }}>
            <SectionHeader title="Interviewer Performance" action="Add +" onAction={() => navigate('/admin/add-interviewer')} />
            <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {interviewers.length === 0 ? (
                <Box sx={{ py: 4, textAlign: 'center' }}>
                  <Typography sx={{ fontSize: '0.875rem', color: C.onVariant }}>No interviewers found.</Typography>
                </Box>
              ) : (
                interviewers.map(iv => {
                  const avatarColor = getAvatarColor(iv.firstName);
                  const rounds = interviewerRounds(iv._id);
                  const completed = rounds.filter(r => r.feedback?.overallRating).length;
                  const pending = interviewerPending(iv._id);
                  const avgRating = interviewerAvgRating(iv._id);

                  return (
                    <Box
                      key={iv._id}
                      onClick={() => navigate(`/admin/interviewers/${iv._id}`)}
                      sx={{
                        p: 2, borderRadius: '10px',
                        border: '1px solid #e8eff3',
                        bgcolor: C.surfaceLow,
                        cursor: 'pointer',
                        transition: 'all 0.18s',
                        '&:hover': { transform: 'translateY(-1px)', boxShadow: '0 4px 12px rgba(42,52,57,0.1)' },
                      }}
                    >
                      {/* Top row */}
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                          <Avatar sx={{ width: 38, height: 38, bgcolor: `${avatarColor}20`, color: avatarColor, fontSize: '0.8125rem', fontWeight: 700 }}>
                            {iv.firstName?.[0]}{iv.lastName?.[0]}
                          </Avatar>
                          <Box>
                            <Typography sx={{ fontSize: '0.875rem', fontWeight: 700, color: C.onSurface, lineHeight: 1.25 }}>
                              {iv.firstName} {iv.lastName}
                            </Typography>
                            <Typography sx={{ fontSize: '0.6875rem', color: C.onVariant }}>
                              {iv.department || 'Interviewer'}
                            </Typography>
                          </Box>
                        </Box>
                        {avgRating && (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <StarIcon sx={{ fontSize: '0.875rem', color: '#f59e0b' }} />
                            <Typography sx={{ fontSize: '0.8125rem', fontWeight: 800, color: C.onSurface }}>{avgRating}/10</Typography>
                          </Box>
                        )}
                      </Box>

                      {/* Stats row */}
                      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 1 }}>
                        {[
                          { label: 'Total', value: rounds.length, color: C.onSurface, bg: C.white },
                          { label: 'Completed', value: completed, color: C.green, bg: C.greenBg },
                          { label: 'Pending', value: pending, color: pending > 0 ? C.amber : C.onVariant, bg: pending > 0 ? C.amberBg : C.white },
                        ].map(stat => (
                          <Box key={stat.label} sx={{ textAlign: 'center', bgcolor: stat.bg, borderRadius: '6px', py: 0.75 }}>
                            <Typography sx={{ fontSize: '0.875rem', fontWeight: 800, color: stat.color, fontFamily: "'Manrope',sans-serif" }}>
                              {stat.value}
                            </Typography>
                            <Typography sx={{ fontSize: '0.5625rem', color: C.onVariant, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                              {stat.label}
                            </Typography>
                          </Box>
                        ))}
                      </Box>
                    </Box>
                  );
                })
              )}
            </Box>
          </Paper>
        </Box>

        {/* ── ALL CANDIDATES TABLE (existing, updated styling) ── */}
        <Paper elevation={0} sx={{ borderRadius: '12px', border: '1px solid #e8eff3', bgcolor: C.white, boxShadow: '0 1px 6px rgba(42,52,57,0.05)', overflow: 'hidden' }}>
          <Box sx={{ px: 3, py: 2, borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box>
              <Typography sx={{ fontFamily: "'Manrope',sans-serif", fontWeight: 800, fontSize: '0.9375rem', color: C.onSurface }}>
                All Candidates
              </Typography>
              <Typography sx={{ fontSize: '0.8125rem', color: C.onVariant, mt: 0.25 }}>
                Review and manage the latest applicants
              </Typography>
            </Box>
            <Typography onClick={() => navigate('/admin/candidates')} sx={{ fontSize: '0.75rem', fontWeight: 700, color: C.tertiary, cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}>
              View All →
            </Typography>
          </Box>

          <Box sx={{ overflowX: 'auto' }}>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: C.surfaceLow }}>
                  {['Candidate', 'Applied For', 'Round', 'Assigned HR', 'Status', 'Actions'].map((h, i) => (
                    <TableCell key={h} align={i === 5 ? 'right' : 'left'} sx={{ fontSize: '0.6875rem', fontWeight: 800, color: C.onVariant, textTransform: 'uppercase', letterSpacing: '0.08em', py: 1.5 }}>
                      {h}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 5 }}>
                      <CircularProgress sx={{ color: PRIMARY }} size={28} />
                    </TableCell>
                  </TableRow>
                ) : (
                  safeCandidates
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map(row => {
                      const avatarColor = getAvatarColor(row.firstName);
                      const statusStyle = getStatusStyle(row.status);
                      const latestRound = row.interviewRounds?.slice(-1)[0]?.roundName || 'Not Started';
                      return (
                        <TableRow
                          key={row._id}
                          hover
                          sx={{ cursor: 'pointer', '&:hover': { bgcolor: `${C.primaryContainer}20` } }}
                        >
                          <TableCell onClick={() => navigate(`/admin/candidates/${row._id}`)}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                              <Avatar sx={{ width: 32, height: 32, fontSize: '0.75rem', fontWeight: 700, bgcolor: `${avatarColor}20`, color: avatarColor }}>
                                {row.firstName?.[0]}{row.lastName?.[0]}
                              </Avatar>
                              <Typography sx={{ fontSize: '0.875rem', fontWeight: 600, color: C.onSurface }}>
                                {row.firstName} {row.lastName}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell sx={{ fontSize: '0.875rem', color: C.onSurface }}>
                            {row.jobRole || '—'}
                          </TableCell>
                          <TableCell>
                            <Box sx={{ px: 1.5, py: 0.375, bgcolor: C.primaryContainer, color: C.onPrimContainer, borderRadius: '9999px', fontSize: '0.6875rem', fontWeight: 700, display: 'inline-block' }}>
                              {latestRound}
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              {(() => {
                                // Try populated object first
                                if (row.addedBy && typeof row.addedBy === 'object' && row.addedBy.firstName) {
                                  return (
                                    <>
                                      <Avatar sx={{ width: 22, height: 22, fontSize: '0.625rem', bgcolor: C.primaryContainer, color: PRIMARY }}>
                                        {row.addedBy.firstName[0]}
                                      </Avatar>
                                      <Typography sx={{ fontSize: '12px', color: C.onSurface, fontWeight: 500 }}>
                                        {row.addedBy.firstName}
                                      </Typography>
                                    </>
                                  );
                                }
                                // Fallback: lookup in allUsers (handles IDs and Admin users)
                                const userMatch = allUsers.find(u => String(u._id) === String(row.addedBy?._id || row.addedBy));
                                const name = userMatch?.firstName || 'Admin';
                                return (
                                  <>
                                    <Avatar sx={{ width: 22, height: 22, fontSize: '0.625rem', bgcolor: C.primaryContainer, color: PRIMARY }}>
                                      {name[0]}
                                    </Avatar>
                                    <Typography sx={{ fontSize: '12px', color: C.onSurface, fontWeight: 500 }}>
                                      {name}
                                    </Typography>
                                  </>
                                );
                              })()}
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Box sx={{ px: 1.5, py: 0.375, bgcolor: statusStyle.bg, color: statusStyle.color, border: `1px solid ${statusStyle.border}`, borderRadius: '9999px', fontSize: '0.6875rem', fontWeight: 800, display: 'inline-block', whiteSpace: 'nowrap' }}>
                              {row.status}
                            </Box>
                          </TableCell>
                          <TableCell align="right">
                            <Button onClick={() => navigate(`/admin/candidates/${row._id}`)} size="small" sx={{ textTransform: 'none', color: C.tertiary, fontSize: '0.8125rem', fontWeight: 700, minWidth: 0, p: '2px 8px' }}>
                              View →
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })
                )}
              </TableBody>
            </Table>
          </Box>

          <TablePagination
            rowsPerPageOptions={[5, 10]}
            component="div"
            count={total}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            sx={{ borderTop: '1px solid #f1f5f9', '& .MuiTablePagination-toolbar': { fontSize: '0.75rem' } }}
          />
        </Paper>
      </Box>
    </Box>
  );
};

export default AdminDashboard;