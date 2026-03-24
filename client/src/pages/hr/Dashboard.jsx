import { Avatar, Box, CircularProgress, colors, Paper, Typography } from "@mui/material";
import API from "../../api/axios";
import { useAuth } from "../../context/AuthContext";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CalendarMonth, CheckCircle, ChevronRight, EventAvailable, People, PersonAdd, RateReview } from "@mui/icons-material";



const PRIMARY = '#3b4eba';

const getAvatarColor = (name) => {
  const colors = ['#4f46e5', '#0891b2', '#059669', '#d97706', '#dc2626', '#7c3aed'];
  return colors[(name?.charCodeAt(0) || 0) % colors.length];
};

const formatTime = (d) =>
  d ? new Date(d).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '—';

const formatDateTime = (d) =>
  d ? new Date(d).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit'
  }) : '—';


const Dashboard = () => {

  const navigate = useNavigate();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [candidates, setCandidates] = useState([]);
  const [statusCounts, setStatusCounts] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      try {

        const [candidateRes, statsRes] = await Promise.all([
          API.get('/candidates?limit=100&sortby=newest'),
          API.get('/candidates/stats/status-counts'),
        ]);
        setCandidates(candidateRes.data.candidates || []);
        setStatusCounts(statsRes.data.statusCounts || {});

      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const now = new Date();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  // total candidate in system
  const totalCandidates = candidates.length;

  // active interviews today = candidates with Interviewing status
  // who have a round scheduled today

  const activeInterviewsToday = candidates.filter(c =>
    c.interviewRounds?.some(r => {
      const d = new Date(r.scheduledDate);
      d.setHours(0, 0, 0, 0);
      return d.getTime() === today.getTime();
    })
  ).length;

  const selectedCount = statusCounts['Selected'] || 0;

  const pipeline = [
    { label: 'Applied', count: statusCounts['Applied'] || 0, bg: '#f1f5f9', color: '#475569', border: '#94a3b8' },
    { label: 'Shortlisted', count: statusCounts['Shortlisted'] || 0, bg: '#eff6ff', color: '#1d4ed8', border: '#3b82f6' },
    { label: 'Interviewing', count: statusCounts['Interviewing'] || 0, bg: '#eef2ff', color: '#4338ca', border: '#6366f1' },
    { label: 'Selected', count: statusCounts['Selected'] || 0, bg: '#f0fdf4', color: '#15803d', border: '#22c55e' },
    { label: 'Rejected', count: statusCounts['Rejected'] || 0, bg: '#fff1f2', color: '#be123c', border: '#f43f5e' },
  ]

  // recent activity
  const recentActivity = [...candidates]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5);

  // loading state
  if (loading) return (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
      <CircularProgress sx={{ color: PRIMARY }} />
    </Box>
  )


  return (
    <Box sx={{
      height: '100%',
      bgcolor: '#f6f6f8',
      overflow: 'auto'
    }}>
      {/* Top Bar */}
      <Box sx={{
        height: 56,
        bgcolor: 'white',
        borderBottom: '1px solid #e2e8f0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        px: 3,
        position: 'sticky',
        top: 0,
        zIndex: 10
      }}>
        <Typography sx={{
          fontWeight: 700,
          color: '#0f172a',
          fontSize: '0.9375rem'
        }}>
          Dashboard
        </Typography>
        <Box sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1.5
        }}>
          <Box sx={{ textAlign: 'right' }}>
            <Typography sx={{
              fontSize: '0.8125rem',
              fontWeight: 700,
              color: '#0f172a',
              lineHeight: 1.2
            }}>
              {user?.firstName} {user?.lastName}
            </Typography>
            <Typography sx={{
              fontSize: '0.7rem',
              color: '#64748b',
              textTransform: 'capitalize'
            }}>
              {user?.department || user?.role}
            </Typography>
          </Box>
          <Avatar sx={{
            width: 34, height: 34,
            bgcolor: `${getAvatarColor(user?.firstName)}20`,
            color: getAvatarColor(user?.firstName),
            fontSize: '0.875rem', fontWeight: 700,
            border: `2px solid ${PRIMARY}30`,
          }}>
            {user?.firstName?.[0]}{user?.lastName?.[0]}
          </Avatar>
        </Box>
      </Box>

      <Box sx={{ p: 3, maxWidth: 1280, mx: 'auto' }}>

        {/* Welcome Section */}
        <Box sx={{
          display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', mb: 4,
        }}>
          <Box>
            <Typography sx={{
              fontSize: '1.75rem',
              fontWeight: 900,
              color: '#0f172a',
              letterSpacing: '-0.02rem'
            }}>
              Welcome Back, {user?.firstName}! 👋
            </Typography>
            <Typography sx={{
              color: '#64748b', fontSize: '0.9375rem', mt: 0.5, fontWeight: 500,
            }}>
              Here's what's happening in your recruitment pipeline today.
            </Typography>
          </Box>
          <Box
            onClick={() => navigate(`/hr/candidates/add`)}
            sx={{
              display: 'flex', alignItems: 'center', gap: 1,
              px: 2.5, py: 1.25, color: 'white',
              bgcolor: PRIMARY, borderRadius: '8px', textTransform: 'none',
              fontWeight: 700, fontSize: '0.875rem',
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(59,78,186,0.25)',
              '&:hover': { bgcolor: '#2f3da0', transform: 'translateY(-1px)' },
              transition: 'all 0.15s'
            }}>
            + Add Candidate
          </Box>
        </Box>

        {/* KPI stat cards */}
        <Box sx={{
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 2.5, mb: 4,
        }}>
          {[
            {
              icon: <People sx={{ fontSize: 22, color: PRIMARY }} />,
              iconBg: `${PRIMARY}15`,
              label: 'Total Candidates',
              value: totalCandidates,
              sub: `${statusCounts['Interviewing'] || 0} currently interviewing`,
              borderColor: PRIMARY,
            },
            {
              icon: <EventAvailable sx={{ fontSize: 22, color: '#f97316' }} />,
              iconBg: '#fff7ed',
              label: 'Active Interviews Today',
              value: activeInterviewsToday,
              sub: 'candidates scheduled today',
              borderColor: '#f97316',
            },
            {
              icon: <CheckCircle sx={{ fontSize: 22, color: '#16a34a' }} />,
              iconBg: '#f0fdf4',
              label: 'Selected',
              value: selectedCount,
              sub: `${statusCounts['On Hold'] || 0} on hold`,
              borderColor: '#16a34a',
            },
          ].map(card => (
            <Paper key={card.label}
              elevation={0} sx={{
                p: 3,
                borderRadius: '12px',
                border: '1px solid #e2e8f0',
                borderLeft: `4px solid ${card.borderColor}`,
                bgcolor: 'white',
                boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                transition: 'all 0.15s',
                '&:hover': {
                  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                  transform: 'translateY(-1px)'
                }
              }}>
              <Box sx={{
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                mb: 2
              }}>
                <Box>
                  <Typography sx={{
                    fontSize: '0.6875rem', color: '#94a3b8',
                    fontWeight: 700, mb: 0.5, textTransform: 'uppercase', letterSpacing: '0.08rem'
                  }}>
                    {card.label}
                  </Typography>
                  <Typography sx={{
                    fontSize: '2rem',
                    fontWeight: 900,
                    color: '#0f172a',
                    lineHeight: 1
                  }}>
                    {card.value}
                  </Typography>
                </Box>
                <Box sx={{
                  width: 40, height: 40, borderRadius: '10px',
                  bgcolor: card.iconBg,
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  {card.icon}
                </Box>
              </Box>
              <Typography sx={{
                fontSize: '0.75rem', color: '#64748b', fontWeight: 500
              }}>
                {card.sub}
              </Typography>
            </Paper>
          ))}
        </Box>
      </Box>

      {/* Recruitment Pipeline Overview */}

      <Paper elevation={0} sx={{
        borderRadius: '12px', border: '1px solid #e2e8f0',
        bgcolor: 'white', boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
        overflow: 'hidden', minWidth: 300, maxWidth: 750, ml: 3, mb: 4,
      }}>
        {/* Header */}
        <Box sx={{
          px: 3, py: 2, borderBottom: '1px solid #f1f5f9',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between'
        }}>
          <Typography sx={{ fontWeight: 800, fontSize: '1rem', color: '#0f172a' }}>
            Recruitment Pipeline Overview
          </Typography>
          <Box onClick={() => navigate('/hr/candidates')}
            sx={{
              fontSize: '0.75rem', fontWeight: 700, color: PRIMARY,
              cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.06rem',
              '&:hover': { textDecoration: 'underline' },
            }}>
            View All Candidates
          </Box>
        </Box>

        {/* Pipeline Stages */}
        <Box sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, overflowX: 'auto', pb: 1, maxWidth: 700 }}>
            {pipeline.map((stage, idx) => (
              <Box key={stage.label} sx={{ display: 'flex', alignItems: 'center', flex: 1, minWidth: 80, maxWidth: 180 }}>
                {/* Stage Card */}
                <Box
                  onClick={() => navigate(`/hr/candidates?status=${stage.label}`)}
                  sx={{
                    flex: 1, p: 1.5, borderRadius: '10px',
                    bgcolor: stage.bg, borderBottom: `4px solid ${stage.border}`,
                    textAlign: 'center', cursor: 'pointer',
                    transition: 'all 0.15s',
                    '&:hover': {
                      boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                      transform: 'translateY(-2px)'
                    }
                  }}
                >
                  <Typography sx={{ fontSize: '1.375rem', fontWeight: 900, color: stage.color }}>
                    {stage.count}
                  </Typography>
                  <Typography sx={{ fontSize: '0.7rem', fontWeight: 600, color: stage.color, mt: 0.25 }}>
                    {stage.label}
                  </Typography>
                </Box>

                {/* Arrow between stages */}
                {idx < pipeline.length - 1 && (
                  <ChevronRight sx={{ fontSize: 20, color: '#cbd5e1', flexShrink: 0 }} />
                )}
              </Box>
            ))}
          </Box>
        </Box>
      </Paper>

      {/* Recent Activity Feed */}
      <Paper elevation={0} sx={{
        borderRadius: '12px', border: '1px solid #e2e8f0',
        bgcolor: 'white', boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
        overflow: 'hidden', minWidth: 300, maxWidth: 750, ml: 3, mb: 4,
      }}>
        {/* Header */}
        <Box sx={{
          px: 3, py: 2, borderBottom: '1px solid #f1f5f9',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between'
        }}>
          <Typography sx={{ fontWeight: 800, fontSize: '1rem', color: '#0f172a' }}>
            Recent Activity Feed
          </Typography>
        </Box>

        {/* Activity List */}
        {recentActivity.length === 0 ? (
          <Box>
            <Typography sx={{ fontSize: '2rem' }}>📋</Typography>
            <Typography sx={{ fontWeight: 600, color: '#0f172a' }}>No recent activity</Typography>
            <Typography sx={{ fontSize: '0.8125rem', color: '#94a3b8' }}>
              Add candidates to see activity here.
            </Typography>
          </Box>
        ) : (
          <Box>
            {recentActivity.map((candidate, idx) => {
              const avatarColor = getAvatarColor(candidate.firstName);
              const initials = `${candidate.firstName?.[0]}${candidate.lastName?.[0]}`;
              const isLast = idx === recentActivity.length - 1;

              const activityConfig = {
                'Applied': { icon: <PersonAdd sx={{ fontSize: 18 }} />, bg: '#eff6ff', color: '#1d4ed8', text: 'applied for' },
                'Shortlisted': { icon: <People sx={{ fontSize: 18 }} />, bg: '#f0fdf4', color: '#15803d', text: 'was shortlisted for' },
                'Interviewing': { icon: <CalendarMonth sx={{ fontSize: 18 }} />, bg: '#fff7ed', color: '#c2410c', text: 'is interviewing for' },
                'Selected': { icon: <CheckCircle sx={{ fontSize: 18 }} />, bg: '#f0fdf4', color: '#15803d', text: 'was selected for' },
                'Rejected': { icon: <RateReview sx={{ fontSize: 18 }} />, bg: '#fff1f2', color: '#be123c', text: 'was rejected for' },
              }

              const cfg = activityConfig[candidate.status] || activityConfig['Applied'];

              return (
                <Box key={candidate._id}
                  onClick={() => navigate(`/hr/candidates/${candidate._id}`)}
                  sx={{
                    display: 'flex', alignItems: 'center', gap: 2,
                    px: 3, py: 2,
                    borderBottom: isLast ? 'none' : '1px solid #f1f5f9',
                    cursor: 'pointer', transition: 'all 0.15s',
                    '&:hover': { bgcolor: '#f8fafc' },
                  }}
                >
                  {/* Activity icon */}
                  <Box key={candidate._id}
                    onClick={() => navigate(`/hr/candidates/${candidate._id}`)}
                    sx={{
                      width: 40, height: 40, borderRadius: '50%',
                      bgcolor: cfg.bg, color: cfg.color,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    {cfg.icon}
                  </Box>

                  {/* Text */}
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography sx={{ fontSize: '0.875rem', color: '#0f172a' }}>
                      <Box component="span" sx={{ fontWeight: 700 }}>
                        {candidate.firstName} {candidate.lastName}
                      </Box>
                      {' '}{cfg.text}{' '}
                      <Box component="span" sx={{ color: PRIMARY, fontWeight: 600 }}>
                        {candidate.jobRole}
                      </Box>
                    </Typography>
                    <Typography sx={{ fontSize: '0.75rem', color: '#94a3b8', mt: 0.25 }}>
                      {formatDateTime(candidate.createdAt)}
                    </Typography>
                  </Box>

                  {/* Avatar */}
                  <Avatar sx={{
                    width: 32, height: 32, flexShrink: 0,
                    bgcolor: `${avatarColor}20`, color: avatarColor,
                    fontSize: '0.8rem', fontWeight: 700,
                  }}>
                    {initials}
                  </Avatar>

                  <ChevronRight sx={{ fontSize: 18, color: '#cbd5e1', flexShrink: 0 }} />
                </Box>
              )
            })}

            {/* View all button */}
            <Box onClick={() => navigate('/hr/candidates')}
              sx={{
                py: 2, textAlign: 'center',
                borderTop: '1px solid #f1f5f9',
                fontSize: '0.875rem', fontWeight: 700, color: PRIMARY,
                cursor: 'pointer',
                '&:hover': { bgcolor: '#f8fafc' },
              }}>
              View All Candidates →
            </Box>
          </Box>
        )}
      </Paper>

    </Box>
  )
}

export default Dashboard
