import {
  Avatar, Box, Chip, CircularProgress, Paper, Typography,
} from "@mui/material";
import API from "../../api/axios";
import { useAuth } from "../../context/AuthContext";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  People, CheckCircle, ChevronRight,
  EventAvailable, RateReview, PersonAdd,
  CalendarMonth, ArrowForward, Warning,
} from "@mui/icons-material";

/* ─── Design tokens — identical to Reports page ──────────────────── */
const C = {
  primary: '#545f73',
  primaryDim: '#485367',
  onPrimary: '#f6f7ff',
  primaryContainer: '#d8e3fb',
  onPrimaryContainer: '#475266',
  secondaryContainer: '#d3e4fe',
  onSecondaryContainer: '#435368',
  tertiary: '#005bc4',
  tertiaryContainer: '#4388fd',
  surface: '#f7f9fb',
  surfaceContainerLow: '#f0f4f7',
  surfaceContainerLowest: '#ffffff',
  surfaceContainer: '#e8eff3',
  onSurface: '#2a3439',
  onSurfaceVariant: '#566166',
  outline: '#717c82',
  outlineVariant: '#a9b4b9',
  bg: '#F8F7F4',
  green: '#16a34a',
  greenBg: '#f0fdf4',
  greenBorder: '#bbf7d0',
  amber: '#b45309',
  amberBg: '#fffbeb',
  amberBorder: '#fde68a',
  red: '#be123c',
  redBg: '#fff1f2',
  redBorder: '#fecdd3',
  orange: '#c2410c',
  orangeBg: '#fff7ed',
};

/* ─── helpers ─────────────────────────────────────────────────────── */
const getAvatarColor = (name) => {
  const colors = ['#545f73', '#005bc4', '#059669', '#d97706', '#dc2626', '#7c3aed'];
  return colors[(name?.charCodeAt(0) || 0) % colors.length];
};

const formatDateTime = (d) =>
  d ? new Date(d).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }) : '—';

const formatTime = (d) =>
  d ? new Date(d).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '—';

/* ─── Small reusable pieces ───────────────────────────────────────── */

/* Section header used inside cards */
const SectionHeader = ({ title, action, onAction }) => (
  <Box sx={{
    px: 3, py: 2,
    borderBottom: '1px solid #f1f5f9',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  }}>
    <Typography sx={{
      fontFamily: "'Manrope', sans-serif",
      fontWeight: 800, fontSize: '0.9375rem', color: C.onSurface,
    }}>
      {title}
    </Typography>
    {action && (
      <Typography onClick={onAction} sx={{
        fontSize: '0.75rem', fontWeight: 700, color: C.tertiary,
        cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.06em',
        '&:hover': { textDecoration: 'underline' },
      }}>
        {action}
      </Typography>
    )}
  </Box>
);

/* Recommendation chip */
const RecChip = ({ rec }) => {
  const r = (rec || '').toLowerCase();
  let color = C.onSurfaceVariant, bg = C.surfaceContainerLow, border = C.outlineVariant;
  if (r.includes('shortlist') || r.includes('select')) { color = C.green; bg = C.greenBg; border = C.greenBorder; }
  else if (r.includes('reject')) { color = C.red; bg = C.redBg; border = C.redBorder; }
  else if (r.includes('hold')) { color = C.amber; bg = C.amberBg; border = C.amberBorder; }
  return (
    <Box sx={{
      px: 1.5, py: 0.375, borderRadius: '9999px',
      bgcolor: bg, color, border: `1px solid ${border}`,
      fontSize: '0.6875rem', fontWeight: 800, whiteSpace: 'nowrap',
    }}>
      {rec || 'Pending'}
    </Box>
  );
};

/* ══════════════════════════════════════════════════════════════════ */
const HRDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [candidates, setCandidates] = useState([]);
  const [statusCounts, setStatusCounts] = useState({});
  const [feedbacksDue, setFeedbacksDue] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [candidateRes, statsRes] = await Promise.all([
          API.get('/candidates?limit=100&sortby=newest'),
          API.get('/candidates/stats/status-counts'),
        ]);
        const allCandidates = candidateRes.data.candidates || [];
        setCandidates(allCandidates);
        setStatusCounts(statsRes.data.statusCounts || {});

        /* Derive pending feedbacks: rounds that are completed but have no feedback */
        const pending = [];
        allCandidates.forEach(c => {
          (c.interviewRounds || []).forEach(r => {
            if (r.status === 'completed' && !r.feedback?.overallRating) {
              pending.push({
                candidateId: c._id,
                candidateName: `${c.firstName} ${c.lastName}`,
                jobRole: c.jobRole,
                roundName: r.roundName || 'Interview Round',
                scheduledDate: r.scheduledDate,
              });
            }
          });
        });
        setFeedbacksDue(pending.slice(0, 5));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  /* ── derived data ── */
  const today = new Date(); today.setHours(0, 0, 0, 0);

  const activeInterviewsToday = candidates.filter(c =>
    c.interviewRounds?.some(r => {
      const d = new Date(r.scheduledDate); d.setHours(0, 0, 0, 0);
      return d.getTime() === today.getTime();
    })
  ).length;

  const selectedCount = statusCounts['Selected'] || 0;
  const pendingFeedbackCount = feedbacksDue.length;

  const pipeline = [
    { label: 'Applied', count: statusCounts['Applied'] || 0, color: C.onSurfaceVariant, bg: C.surfaceContainerLow, border: C.outlineVariant },
    { label: 'Shortlisted', count: statusCounts['Shortlisted'] || 0, color: '#1d4ed8', bg: '#eff6ff', border: '#bfdbfe' },
    { label: 'Interviewing', count: statusCounts['Interviewing'] || 0, color: '#4338ca', bg: '#eef2ff', border: '#a5b4fc' },
    { label: 'Selected', count: statusCounts['Selected'] || 0, color: C.green, bg: C.greenBg, border: C.greenBorder },
    { label: 'Rejected', count: statusCounts['Rejected'] || 0, color: C.red, bg: C.redBg, border: C.redBorder },
  ];

  const recentActivity = [...candidates]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5);

  const todayInterviews = candidates
    .flatMap(c => (c.interviewRounds || []).map(r => ({ ...r, candidate: c })))
    .filter(r => {
      const d = new Date(r.scheduledDate); d.setHours(0, 0, 0, 0);
      return d.getTime() === today.getTime();
    })
    .sort((a, b) => new Date(a.scheduledDate) - new Date(b.scheduledDate))
    .slice(0, 4);

  const activityConfig = {
    'Applied': { icon: <PersonAdd sx={{ fontSize: 16 }} />, bg: '#eff6ff', color: '#1d4ed8', text: 'applied for' },
    'Shortlisted': { icon: <People sx={{ fontSize: 16 }} />, bg: C.greenBg, color: C.green, text: 'was shortlisted for' },
    'Interviewing': { icon: <CalendarMonth sx={{ fontSize: 16 }} />, bg: C.orangeBg, color: C.orange, text: 'is interviewing for' },
    'Selected': { icon: <CheckCircle sx={{ fontSize: 16 }} />, bg: C.greenBg, color: C.green, text: 'was selected for' },
    'Rejected': { icon: <RateReview sx={{ fontSize: 16 }} />, bg: C.redBg, color: C.red, text: 'was rejected for' },
  };

  /* ── loading ── */
  if (loading) return (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
      <CircularProgress sx={{ color: C.primary }} />
    </Box>
  );

  /* ══════════════════════════════════════════════════════════════ */
  return (
    <Box sx={{ bgcolor: C.bg, minHeight: '100%', fontFamily: "'Inter', sans-serif", overflow: 'auto' }}>

      {/* ── TOP BAR ─────────────────────────────────────────── */}
      <Box sx={{
        height: 56, bgcolor: 'white',
        borderBottom: '1px solid #e8eff3',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        px: 4, position: 'sticky', top: 0, zIndex: 10,
        backdropFilter: 'blur(8px)',
      }}>
        <Typography sx={{
          fontFamily: "'Manrope', sans-serif",
          fontWeight: 800, fontSize: '0.9375rem', color: C.onSurface,
        }}>
          Dashboard
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{ textAlign: 'right' }}>
            <Typography sx={{ fontSize: '0.8125rem', fontWeight: 700, color: C.onSurface, lineHeight: 1.2 }}>
              {user?.firstName} {user?.lastName}
            </Typography>
            <Typography sx={{ fontSize: '0.6875rem', color: C.onSurfaceVariant, textTransform: 'capitalize' }}>
              {user?.department || user?.role}
            </Typography>
          </Box>
          <Avatar sx={{
            width: 34, height: 34,
            bgcolor: `${getAvatarColor(user?.firstName)}20`,
            color: getAvatarColor(user?.firstName),
            fontSize: '0.8125rem', fontWeight: 700,
            border: `2px solid ${C.primaryContainer}`,
          }}>
            {user?.firstName?.[0]}{user?.lastName?.[0]}
          </Avatar>
        </Box>
      </Box>

      {/* ── MAIN CONTENT ────────────────────────────────────── */}
      <Box sx={{ p: { xs: 3, md: 4 }, maxWidth: 1280, mx: 'auto' }}>

        {/* ── WELCOME ── */}
        <Box sx={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', mb: 4, flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography sx={{
              fontFamily: "'Manrope', sans-serif",
              fontSize: { xs: '1.5rem', md: '1.75rem' },
              fontWeight: 800, color: C.onSurface,
              letterSpacing: '-0.025em', lineHeight: 1.15,
            }}>
              Welcome Back, {user?.firstName}! 👋
            </Typography>
            <Typography sx={{ color: C.onSurfaceVariant, fontSize: '0.9375rem', mt: 0.5 }}>
              Here's what's happening in your recruitment pipeline today.
            </Typography>
          </Box>
          <Box
            onClick={() => navigate('/hr/candidates/add')}
            sx={{
              display: 'flex', alignItems: 'center', gap: 1,
              px: 2.5, py: 1.25,
              bgcolor: C.primary, color: 'white',
              borderRadius: '0.625rem',
              fontFamily: "'Inter', sans-serif",
              fontWeight: 700, fontSize: '0.875rem',
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(84,95,115,0.3)',
              transition: 'all 0.15s',
              '&:hover': { bgcolor: C.primaryDim, transform: 'translateY(-1px)' },
            }}
          >
            + Add Candidate
          </Box>
        </Box>

        {/* ── KPI CARDS — 4 cards ── */}
        <Box sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(4, 1fr)' },
          gap: 2, mb: 4,
        }}>
          {[
            {
              label: 'Total Candidates',
              value: candidates.length,
              sub: `${statusCounts['Interviewing'] || 0} currently interviewing`,
              icon: <People sx={{ fontSize: 20, color: C.primary }} />,
              iconBg: C.primaryContainer,
              accent: C.primary,
            },
            {
              label: 'Active Interviews Today',
              value: activeInterviewsToday,
              sub: 'candidates scheduled today',
              icon: <EventAvailable sx={{ fontSize: 20, color: '#c2410c' }} />,
              iconBg: C.orangeBg,
              accent: '#f97316',
            },
            {
              label: 'Selected',
              value: selectedCount,
              sub: `${statusCounts['On Hold'] || 0} on hold`,
              icon: <CheckCircle sx={{ fontSize: 20, color: C.green }} />,
              iconBg: C.greenBg,
              accent: C.green,
            },
            {
              label: 'Feedbacks Pending',
              value: pendingFeedbackCount,
              sub: 'awaiting interviewer input',
              icon: <Warning sx={{ fontSize: 20, color: C.amber }} />,
              iconBg: C.amberBg,
              accent: C.amber,
              alert: pendingFeedbackCount > 0,
            },
          ].map((card, i) => (
            <Paper key={card.label} elevation={0} sx={{
              p: 2.5,
              borderRadius: '12px',
              border: `1px solid ${card.alert ? C.amberBorder : '#e8eff3'}`,
              borderTop: `3px solid ${card.accent}`,
              bgcolor: 'white',
              boxShadow: '0 1px 6px rgba(42,52,57,0.05)',
              transition: 'all 0.18s',
              '&:hover': { boxShadow: '0 6px 20px rgba(42,52,57,0.09)', transform: 'translateY(-2px)' },
            }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                <Typography sx={{
                  fontSize: '0.6875rem', fontWeight: 800,
                  color: C.onSurfaceVariant,
                  textTransform: 'uppercase', letterSpacing: '0.08em',
                }}>
                  {card.label}
                </Typography>
                <Box sx={{
                  width: 36, height: 36, borderRadius: '9px',
                  bgcolor: card.iconBg,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {card.icon}
                </Box>
              </Box>
              <Typography sx={{
                fontFamily: "'Manrope', sans-serif",
                fontSize: '2rem', fontWeight: 800,
                color: C.onSurface, lineHeight: 1, mb: 0.75,
              }}>
                {card.value}
              </Typography>
              <Typography sx={{ fontSize: '0.75rem', color: C.onSurfaceVariant }}>
                {card.sub}
              </Typography>
            </Paper>
          ))}
        </Box>

        {/* ── PIPELINE + PENDING FEEDBACKS ROW ── */}
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' }, gap: 3, mb: 3 }}>

          {/* Pipeline */}
          <Paper elevation={0} sx={{
            borderRadius: '12px', border: '1px solid #e8eff3',
            bgcolor: 'white', boxShadow: '0 1px 6px rgba(42,52,57,0.05)', overflow: 'hidden',
          }}>
            <SectionHeader title="Recruitment Pipeline" action="View All" onAction={() => navigate('/hr/candidates')} />
            <Box sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {pipeline.map((stage, idx) => (
                  <Box key={stage.label} sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                    <Box
                      onClick={() => navigate(`/hr/candidates?status=${stage.label}`)}
                      sx={{
                        flex: 1, p: 1.5,
                        borderRadius: '10px',
                        bgcolor: stage.bg,
                        border: `1px solid ${stage.border}`,
                        borderBottom: `3px solid ${stage.border}`,
                        textAlign: 'center', cursor: 'pointer',
                        transition: 'all 0.15s',
                        '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' },
                      }}
                    >
                      <Typography sx={{
                        fontFamily: "'Manrope', sans-serif",
                        fontSize: '1.375rem', fontWeight: 800, color: stage.color, lineHeight: 1,
                      }}>
                        {stage.count}
                      </Typography>
                      <Typography sx={{ fontSize: '0.625rem', fontWeight: 700, color: stage.color, mt: 0.5, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        {stage.label}
                      </Typography>
                    </Box>
                    {idx < pipeline.length - 1 && (
                      <ChevronRight sx={{ fontSize: 18, color: C.outlineVariant, flexShrink: 0 }} />
                    )}
                  </Box>
                ))}
              </Box>
            </Box>
          </Paper>

          {/* Pending Feedbacks */}
          <Paper elevation={0} sx={{
            borderRadius: '12px', border: `1px solid ${pendingFeedbackCount > 0 ? C.amberBorder : '#e8eff3'}`,
            bgcolor: 'white', boxShadow: '0 1px 6px rgba(42,52,57,0.05)', overflow: 'hidden',
          }}>
            <SectionHeader
              title={`Feedbacks Pending ${pendingFeedbackCount > 0 ? `(${pendingFeedbackCount})` : ''}`}
              action={pendingFeedbackCount > 0 ? 'View Reports' : null}
              onAction={() => navigate('/hr/reports')}
            />
            <Box>
              {feedbacksDue.length === 0 ? (
                <Box sx={{ py: 5, textAlign: 'center' }}>
                  <Typography sx={{ fontSize: '1.5rem', mb: 1 }}>✅</Typography>
                  <Typography sx={{ fontSize: '0.875rem', fontWeight: 600, color: C.green }}>
                    All feedbacks submitted!
                  </Typography>
                  <Typography sx={{ fontSize: '0.8125rem', color: C.onSurfaceVariant, mt: 0.5 }}>
                    No pending interview reviews.
                  </Typography>
                </Box>
              ) : (
                feedbacksDue.map((item, idx) => (
                  <Box
                    key={idx}
                    onClick={() => navigate(`/hr/candidates/${item.candidateId}`)}
                    sx={{
                      display: 'flex', alignItems: 'center', gap: 2,
                      px: 3, py: 1.75,
                      borderBottom: idx < feedbacksDue.length - 1 ? '1px solid #f1f5f9' : 'none',
                      cursor: 'pointer', transition: 'background-color 0.15s',
                      '&:hover': { bgcolor: '#fefce8' },
                    }}
                  >
                    <Box sx={{
                      width: 36, height: 36, borderRadius: '9px', flexShrink: 0,
                      bgcolor: C.amberBg, color: C.amber,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Warning sx={{ fontSize: 18 }} />
                    </Box>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography sx={{ fontSize: '0.875rem', fontWeight: 700, color: C.onSurface, lineHeight: 1.3 }}>
                        {item.candidateName}
                      </Typography>
                      <Typography sx={{ fontSize: '0.75rem', color: C.onSurfaceVariant, mt: 0.25 }}>
                        {item.roundName} · {item.jobRole}
                      </Typography>
                    </Box>
                    <Box sx={{
                      px: 1.5, py: 0.375,
                      bgcolor: C.amberBg, color: C.amber,
                      border: `1px solid ${C.amberBorder}`,
                      borderRadius: '9999px',
                      fontSize: '0.6875rem', fontWeight: 800,
                      whiteSpace: 'nowrap', flexShrink: 0,
                    }}>
                      Due
                    </Box>
                    <ArrowForward sx={{ fontSize: 16, color: C.outlineVariant, flexShrink: 0 }} />
                  </Box>
                ))
              )}
            </Box>
          </Paper>
        </Box>

        {/* ── ACTIVITY FEED + TODAY'S INTERVIEWS ROW ── */}
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '3fr 2fr' }, gap: 3 }}>

          {/* Recent Activity */}
          <Paper elevation={0} sx={{
            borderRadius: '12px', border: '1px solid #e8eff3',
            bgcolor: 'white', boxShadow: '0 1px 6px rgba(42,52,57,0.05)', overflow: 'hidden',
          }}>
            <SectionHeader title="Recent Activity" />
            <Box>
              {recentActivity.length === 0 ? (
                <Box sx={{ py: 6, textAlign: 'center' }}>
                  <Typography sx={{ fontSize: '0.875rem', color: C.onSurfaceVariant }}>
                    No recent activity. Add candidates to get started.
                  </Typography>
                </Box>
              ) : (
                <>
                  {recentActivity.map((candidate, idx) => {
                    const cfg = activityConfig[candidate.status] || activityConfig['Applied'];
                    const avatarColor = getAvatarColor(candidate.firstName);
                    const isLast = idx === recentActivity.length - 1;
                    return (
                      <Box
                        key={candidate._id}
                        onClick={() => navigate(`/hr/candidates/${candidate._id}`)}
                        sx={{
                          display: 'flex', alignItems: 'center', gap: 2,
                          px: 3, py: 1.75,
                          borderBottom: isLast ? 'none' : '1px solid #f1f5f9',
                          cursor: 'pointer', transition: 'background-color 0.15s',
                          '&:hover': { bgcolor: C.surfaceContainerLow },
                        }}
                      >
                        {/* Activity icon */}
                        <Box sx={{
                          width: 36, height: 36, borderRadius: '9px', flexShrink: 0,
                          bgcolor: cfg.bg, color: cfg.color,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          {cfg.icon}
                        </Box>

                        {/* Text */}
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography sx={{ fontSize: '0.875rem', color: C.onSurface, lineHeight: 1.4 }}>
                            <Box component="span" sx={{ fontWeight: 700 }}>
                              {candidate.firstName} {candidate.lastName}
                            </Box>
                            {' '}{cfg.text}{' '}
                            <Box component="span" sx={{ color: C.tertiary, fontWeight: 600 }}>
                              {candidate.jobRole}
                            </Box>
                          </Typography>
                          <Typography sx={{ fontSize: '0.75rem', color: C.onSurfaceVariant, mt: 0.25 }}>
                            {formatDateTime(candidate.createdAt)}
                          </Typography>
                        </Box>

                        {/* Avatar */}
                        <Avatar sx={{
                          width: 30, height: 30, flexShrink: 0,
                          bgcolor: `${avatarColor}18`, color: avatarColor,
                          fontSize: '0.75rem', fontWeight: 700,
                        }}>
                          {candidate.firstName?.[0]}{candidate.lastName?.[0]}
                        </Avatar>

                        <ChevronRight sx={{ fontSize: 16, color: C.outlineVariant, flexShrink: 0 }} />
                      </Box>
                    );
                  })}
                  <Box
                    onClick={() => navigate('/hr/candidates')}
                    sx={{
                      py: 1.75, textAlign: 'center',
                      borderTop: '1px solid #f1f5f9',
                      fontSize: '0.8125rem', fontWeight: 700, color: C.tertiary,
                      cursor: 'pointer',
                      '&:hover': { bgcolor: C.surfaceContainerLow },
                    }}
                  >
                    View All Candidates →
                  </Box>
                </>
              )}
            </Box>
          </Paper>

          {/* Today's Interviews */}
          <Paper elevation={0} sx={{
            borderRadius: '12px', border: '1px solid #e8eff3',
            bgcolor: 'white', boxShadow: '0 1px 6px rgba(42,52,57,0.05)', overflow: 'hidden',
          }}>
            <SectionHeader title="Today's Interviews" />
            <Box>
              {todayInterviews.length === 0 ? (
                <Box sx={{ py: 5, textAlign: 'center' }}>
                  <Typography sx={{ fontSize: '1.5rem', mb: 1 }}>📅</Typography>
                  <Typography sx={{ fontSize: '0.875rem', fontWeight: 600, color: C.onSurface }}>
                    No interviews today
                  </Typography>
                  <Typography sx={{ fontSize: '0.8125rem', color: C.onSurfaceVariant, mt: 0.5 }}>
                    Schedule interviews from the Candidates page.
                  </Typography>
                </Box>
              ) : (
                todayInterviews.map((r, idx) => {
                  const avatarColor = getAvatarColor(r.candidate?.firstName);
                  const isLast = idx === todayInterviews.length - 1;
                  return (
                    <Box
                      key={idx}
                      onClick={() => navigate(`/hr/candidates/${r.candidate?._id}`)}
                      sx={{
                        display: 'flex', alignItems: 'center', gap: 2,
                        px: 3, py: 1.75,
                        borderBottom: isLast ? 'none' : '1px solid #f1f5f9',
                        cursor: 'pointer', transition: 'background-color 0.15s',
                        '&:hover': { bgcolor: C.surfaceContainerLow },
                      }}
                    >
                      {/* Time badge */}
                      <Box sx={{
                        minWidth: 52, textAlign: 'center', flexShrink: 0,
                        px: 1, py: 0.75,
                        bgcolor: C.primaryContainer,
                        borderRadius: '8px',
                      }}>
                        <Typography sx={{
                          fontSize: '0.6875rem', fontWeight: 800,
                          color: C.onPrimaryContainer, lineHeight: 1.2,
                        }}>
                          {formatTime(r.scheduledDate)}
                        </Typography>
                      </Box>

                      {/* Info */}
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography sx={{ fontSize: '0.875rem', fontWeight: 700, color: C.onSurface, lineHeight: 1.3 }}>
                          {r.candidate?.firstName} {r.candidate?.lastName}
                        </Typography>
                        <Typography sx={{ fontSize: '0.75rem', color: C.onSurfaceVariant, mt: 0.125 }}>
                          {r.roundName || 'Interview'} · {r.candidate?.jobRole}
                        </Typography>
                      </Box>

                      {/* Status chip */}
                      <Box sx={{
                        px: 1.25, py: 0.375, borderRadius: '9999px', flexShrink: 0,
                        bgcolor: r.status === 'completed' ? C.greenBg : C.primaryContainer,
                        color: r.status === 'completed' ? C.green : C.onPrimaryContainer,
                        border: `1px solid ${r.status === 'completed' ? C.greenBorder : C.primaryContainer}`,
                        fontSize: '0.6875rem', fontWeight: 800,
                      }}>
                        {r.status === 'completed' ? 'Done' : 'Scheduled'}
                      </Box>
                    </Box>
                  );
                })
              )}
              {todayInterviews.length > 0 && (
                <Box
                  onClick={() => navigate('/hr/schedule-interview')}
                  sx={{
                    py: 1.75, textAlign: 'center',
                    borderTop: '1px solid #f1f5f9',
                    fontSize: '0.8125rem', fontWeight: 700, color: C.tertiary,
                    cursor: 'pointer',
                    '&:hover': { bgcolor: C.surfaceContainerLow },
                  }}
                >
                  Schedule Interview →
                </Box>
              )}
            </Box>
          </Paper>

        </Box>
      </Box>
    </Box>
  );
};

export default HRDashboard;