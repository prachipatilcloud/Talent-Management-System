import { Avatar, Box, CircularProgress, Paper, Typography } from '@mui/material';
import API from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Business, CalendarMonth, ChevronRight, HourglassEmpty, People, Schedule, TaskAlt, Videocam } from '@mui/icons-material';

const PRIMARY = '#3b4eba';


const getAvatarColor = (name) => {
  const colors = ['#4f46e5', '#0891b2', '#059669', '#d97706', '#dc2626', '#7c3aed'];
  return colors[(name?.charCodeAt(0) || 0) % colors.length];
};

const formatTime = (d) =>
  d ? new Date(d).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '—';

const formatDayHeader = (dateStr) => {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' }).toUpperCase();
};

const roundTypeConfig = {
  'Initial Screening': { bg: '#eff6ff', color: '#1d4ed8' },
  'Technical Interview': { bg: '#eef2ff', color: '#4338ca' },
  'HR Interview': { bg: '#f0fdf4', color: '#15803d' },
  'Final Round': { bg: '#faf5ff', color: '#7e22ce' },
};

const groupByDate = (interviews) => {
  const groups = {};
  interviews.forEach(i => {
    const d = new Date(i.scheduledDate);
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    if (!groups[key]) groups[key] = { date: i.scheduledDate, items: [] };
    groups[key].items.push(i);
  });
  return Object.values(groups).sort((a, b) => new Date(a.date) - new Date(b.date));
};
const MyInterviews = () => {

  const navigate = useNavigate()
  const { user } = useAuth();

  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('upcoming');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await API.get('/interviewer/my-interviews');
        setInterviews(res.data.interviews || []);
      } catch (err) {
        setError('Failed to load interviews.')
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [])

  const now = new Date();

  // filter by tab
  const filtered = interviews.filter(i => {
    const d = new Date(i.scheduledDate);
    return tab === 'upcoming' ? d >= now : d < now;
  })

  // group filtered interviews by date  
  const grouped = groupByDate(filtered);

  //stats
  const totalCandidates = [...new Set(interviews.map(i => i.candidateId))].length;
  const feedbackReady = interviews.filter(i => new Date(i.scheduledDate) < now && !i.hasFeedback).length;
  const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const weekInterviews = interviews.filter(i => {
    const d = new Date(i.scheduledDate);
    return d >= weekStart && d <= now;
  }).length;

  const initials = user ? `${user.firstName?.[0]}${user.lastName?.[0]}`.toUpperCase() : 'U';

  if (loading) return (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
      <CircularProgress sx={{ color: PRIMARY }} />
    </Box>
  )


  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden', bgcolor: '#f6f6f8' }}>

      {/* ── Top Bar ── */}
      <Box sx={{
        height: 56, bgcolor: 'white', borderBottom: '1px solid #e2e8f0',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        px: 3, flexShrink: 0,
      }}>
        {/* Left: icon + title */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{
            bgcolor: PRIMARY, borderRadius: '8px', p: 0.75,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <CalendarMonth sx={{ color: 'white', fontSize: 20 }} />
          </Box>
          <Typography sx={{ fontWeight: 800, fontSize: '1rem', color: '#0f172a' }}>
            My Schedule
          </Typography>
        </Box>

        {/* Right: tab toggle + user */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexShrink: 0 }}>

          {/* Tab toggle */}
          <Box sx={{ display: 'flex', bgcolor: '#f1f5f9', borderRadius: '8px', p: 0.5 }}>
            {['upcoming', 'past'].map(t => (
              <Box key={t} onClick={() => setTab(t)} sx={{
                px: 2, py: 0.75, borderRadius: '6px', cursor: 'pointer',
                fontSize: '0.8125rem', fontWeight: 600, transition: 'all 0.15s',
                bgcolor: tab === t ? 'white' : 'transparent',
                color: tab === t ? '#0f172a' : '#64748b',
                boxShadow: tab === t ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                textTransform: 'capitalize',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
              }}>
                {t}
              </Box>
            ))}
          </Box>

          {/* Vertical Divider */}
          <Box sx={{ width: 1, height: 28, bgcolor: '#e2e8f0' }} />

          {/* User info */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{ textAlign: 'right', minWidth: 120 }}>
              <Typography sx={{ fontSize: '0.8125rem', fontWeight: 700, color: '#0f172a', lineHeight: 1.2 }}>
                {user?.firstName} {user?.lastName}
              </Typography>
              <Typography sx={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'capitalize' }}>
                {user?.department || user?.role}
              </Typography>
            </Box>
            <Avatar sx={{
              width: 36, height: 36,
              bgcolor: `${getAvatarColor(user?.firstName)}20`,
              color: getAvatarColor(user?.firstName),
              fontSize: '0.8rem', fontWeight: 700,
              border: `2px solid ${PRIMARY}30`,
            }}>
              {initials}
            </Avatar>
          </Box>
        </Box>
      </Box>

      {/* Main Scroll Area */}
      <Box sx={{ flex: 1, overflowY: 'auto', p: 4 }}>
        <Box sx={{
          maxWidth: 800, mx: 'auto'
        }}>
          {/* Page Title */}
          <Box sx={{ mb: 4 }}>
            <Typography sx={{ fontSize: '1.875rem', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.02em' }}>
              {tab === 'upcoming' ? 'Upcoming Interviews' : ' Past Interviews'}
            </Typography>
            <Typography sx={{ color: '#64748b', fontSize: '0.9375rem', mt: 0.5, fontWeight: 500 }}>
              {filtered.length > 0
                ? `You have ${filtered.length} commitment${filtered.length !== 1 ? 's' : ''} ${tab === 'upcoming' ? 'coming up' : 'completed'}`
                : `No ${tab} interviews`}
            </Typography>
          </Box>

          {/* Stats cards */}
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2, mt: 4 }}>
            {[
              {
                icon: <People sx={{ fontSize: 22, color: '#4338ca' }} />,
                iconBg: '#e2f2ff',
                label: 'Total Candidates',
                value: totalCandidates
              },
              {
                icon: <HourglassEmpty sx={{ fontSize: 22, color: '#059669' }} />,
                iconBg: '#f0fdf4',
                label: 'This Week ',
                value: weekInterviews
              },
              {
                icon: <TaskAlt sx={{ fontSize: 22, color: PRIMARY }} />,
                iconBg: `${PRIMARY}15`,
                label: 'Feedback Ready',
                value: feedbackReady
              },
            ].map(card => (
              <Paper key={card.label}
                elevation={0}
                sx={{
                  p: 2.5, borderRadius: '10px', border: '1px solid #e2e8f0',
                  bgcolor: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                  display: 'flex', alignItems: 'center', gap: 2,
                }}
              >
                <Box sx={{
                  width: 44, height: 44, borderRadius: '10px',
                  bgcolor: card.iconBg,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  {card.icon}
                </Box>
                <Box>
                  <Typography sx={{
                    fontSize: '0.625rem', fontWeight: 800, color: '#94a3b8',
                    textTransform: 'uppercase', letterSpacing: '0.08rem', mb: 0.25,
                  }}>
                    {card.label}
                  </Typography>
                  <Typography sx={{
                    fontSize: '0.625rem', fontWeight: 900, color: '#0f172a'
                  }}>
                    {card.value}
                  </Typography>
                </Box>
              </Paper>
            ))}
          </Box>

          {/* Error */}
          {error && (
            <Box sx={{ p: 2, bgcolor: '#fff1f2', borderRadius: '8px', border: '1px solid #fecdd3', mb: 3 }}>
              <Typography sx={{ fontSize: '0.875rem', color: '#be123c' }}>{error}</Typography>
            </Box>
          )}

          {/* Empty State */}
          {grouped.length === 0 ? (
            <Box sx={{
              py: 8, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
              bgcolor: 'white', borderRadius: '12px', border: '1px dashed #e2e8f0'
            }}>
              <Typography sx={{ fontSize: '2rem' }}>📅</Typography>
              <Typography sx={{ fontWeight: 700, color: '#0f172a' }}>
                No {tab} interviews
              </Typography>
              <Typography sx={{ color: '#94a3b8', fontSize: '0.875rem' }}>
                {tab === 'upcoming' ? 'You have no upcoming interviews' : 'No past interviews found'}
              </Typography>
            </Box>
          ) : grouped.map(group => (
            <Box key={group.date} sx={{ mb: 5 }}>

              {/* Date Divider */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2, mt:4 }}>
                <Box sx={{ flex: 1, height: 1, bgcolor: '#e2e8f0' }} />
                <Typography sx={{ fontSize: '0.6875rem', fontWeight: 800, color: PRIMARY, letterSpacing: '0.1rem' }}>
                  {formatDayHeader(group.date)}
                </Typography>
                <Box sx={{ flex: 1, height: 1, bgcolor: '#e2e8f0' }} />
              </Box>

              {/* Interview Cards */}
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {group.items.map(interview => {
                  const rt = roundTypeConfig[interview.roundName] || { bg: '#f3f4f6', color: '#374151' };
                  const avatarColor = getAvatarColor(interview.candidateName);
                  const nameInitials = interview.candidateName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
                  const isRemote = interview.interviewMode === 'Remote';

                  return (
                    <Paper key={interview.roundId}
                      elevation={0}
                      onClick={() => navigate(`/interviewer/candidates/${interview.candidateId}`, {
                        state: { interview }
                      })}
                      sx={{
                        display: 'flex', alignItems: 'center', gap: 2,
                        p: 2.5, borderRadius: '10px',
                        border: '1px dashed #e2e8f0', bgcolor: 'white',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                        cursor: 'pointer', transition: 'all 0.15s',
                        '&:hover': {
                          borderColor: `${PRIMARY}50`,
                          boxShadow: `0 2px 18px ${PRIMARY}15`,
                          transform: 'translateY(-1px)'
                        }
                      }}
                    >
                      {/* Avatar */}
                      <Avatar sx={{
                        width: 48, height: 48, flexShrink: 0,
                        bgcolor: `${avatarColor}20`, color: avatarColor,
                        fontSize: '0.875rem', fontWeight: 700,
                        border: `2px solid ${avatarColor}30`
                      }}>
                        {nameInitials}
                      </Avatar>

                      {/* Info */}
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        {/* Name + round badge */}
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.4 }}>
                          <Typography sx={{ fontSize: '0.9375rem', fontWeight: 700, color: '#0f172a' }}>
                            {interview.candidateName}
                          </Typography>
                          <Box sx={{
                            px: 1.25, py: 0.2, borderRadius: '4px',
                            bgcolor: rt.bg, color: rt.color,
                            fontSize: '0.625rem', fontWeight: 800,
                            textTransform: 'uppercase', letterSpacing: '0.06rem'
                          }}>
                            {interview.roundName}
                          </Box>
                        </Box>

                        {/* Job Role */}
                        <Typography sx={{ fontSize: '0.8125rem', color: '#64748b', fontWeight: 500, mb: 1 }}>
                          {interview.jobRole || '-'}
                        </Typography>

                        {/* Time + Mode + Feedback badges */}
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>

                          {/* Time pill */}
                          <Box sx={{
                            display: 'flex', alignItems: 'center', gap: 0.75,
                            px: 1.25, py: 0.4, borderRadius: '6px',
                            bgcolor: '#f8fafc', border: '1px solid #e2e8f0',
                            fontSize: '0.75rem', color: '#475569', fontWeight: 500,
                          }}>
                            <Schedule sx={{ fontSize: 14, color: '#94a3b8' }} />
                            {formatTime(interview.scheduledDate)}
                          </Box>

                          {/* Mode pill */}
                          <Box sx={{
                            display: 'flex', alignItems: 'center', gap: 0.75,
                            px: 1.25, py: 0.4, borderRadius: '6px',
                            bgcolor: '#f8fafc', border: '1px solid #e2e8f0',
                            fontSize: '0.75rem', color: '#475569', fontWeight: 500,

                          }}>
                            {isRemote
                              ? <Videocam sx={{ fontSize: 14, color: '#94a3b8' }} />
                              : <Business sx={{ fontSize: 14, color: '#94a3b8' }} />
                            }
                            {isRemote
                              ? (interview.interviewLink ? 'Online' : 'Remote')
                              : (interview.officeLocation || 'In-Office')
                            }
                          </Box>

                          {/* Feedback pending */}
                          {tab === 'past' && !interview.hasFeedback && (
                            <Box sx={{
                              px: 1.25, py: 0.4, borderRadius: '6px',
                              bgcolor: '#f2f9c3', color: '#a16207',
                              border: '1px solid #fef08a',
                              fontSize: '0.75rem', fontWeight: 700,
                              cursor: 'pointer',
                              '&:hover': { bgcolor: '#fef08a' }
                            }}>
                              Submit Feedback
                            </Box>
                          )}

                          {/* Feedback done */}
                          {interview.hasFeedback && (
                            <Box sx={{
                              px: 1.25, py: 0.4, borderRadius: '6px',
                              bgcolor: '#f0fdf4', color: '#15803d',
                              border: '1px solid #bbf7d0',
                              fontSize: '0.75rem', fontWeight: 700,
                            }}>
                              Feedback done
                            </Box>
                          )}
                        </Box>
                      </Box>

                      {/* Chevron */}
                      <ChevronRight sx={{ fontSize: 20, color: '#cbd5e1', flexShrink: 0 }} />
                    </Paper>
                  )
                })}
              </Box>
            </Box>
          ))}


        </Box>
      </Box>

    </Box>
  )
}

export default MyInterviews