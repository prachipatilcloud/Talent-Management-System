import { ArrowForward, AssignmentInd, EventAvailable, PendingActions, Today, Warning } from "@mui/icons-material";
import API from "../../api/axios";
import { useAuth } from "../../context/AuthContext";
import { Avatar, Box, CircularProgress, Paper, Typography } from "@mui/material"
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";


const PRIMARY = '#3b4eba';
const getAvatarColor = (name) => {
  const colors = ['#4f46e5', '#0891b2', '#059669', '#d97706', '#dc2626', '#7c3aed'];
  return colors[(name?.charCodeAt(0) || 0) % colors.length];
};

const formatTime = (d) =>
  d ? new Date(d).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '—';

const formatDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—';


const Dashboard = () => {

  const navigate = useNavigate();
  const { user } = useAuth();

  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await API.get('/interviewer/my-interviews');
        setInterviews(res.data.interviews || []);

      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
    fetch();
  }, []);

  const now = new Date();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  //total assigned = all interviews assigned to the interviewer
  const totalAssigned = interviews.length;

  //today's interviews = interviews scheduled for today
  const todaysInterviews = interviews.filter(i => {
    const d = new Date(i.scheduledDate);
    d.setHours(0, 0, 0, 0);
    return d.getTime() === today.getTime();
  })

  const upcoming = interviews.filter(i => new Date(i.scheduledDate) > now);

  //pending feedback = interviews that have passed but interviewer hasn't submitted feedback
  const pendingFeedback = interviews.filter(i =>
    new Date(i.scheduledDate) < now && !i.hasFeedback
  );

  if (loading) return (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
      <CircularProgress sx={{ color: PRIMARY }} />
    </Box>
  );

  // first pending feedback candidate - used in warning banner
  const firstPending = pendingFeedback[0] || null;

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

          {/* Avatar */}
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

      <Box sx={{
        p: 3,
        maxWidth: 1280,
        mx: 'auto'
      }}>

        {/* Welcome Section */}
        <Box sx={{ mb: 4 }}>
          <Typography sx={{
            fontSize: '1.75rem',
            fontWeight: 900,
            color: '#0f172a',
            letterSpacing: '-0.02rem'
          }}>
            Welcome Back, {user?.firstName}! 👋
          </Typography>
          <Typography sx={{
            color: '#64748b',
            fontSize: '0.9375rem',
            mt: 0.5,
            fontWeight: 500
          }}>
            {todaysInterviews.length > 0
              ? `You have ${todaysInterviews.length} interview${todaysInterviews.length !== 1 ? 's' : ''} scheduled for today. Ready to meet the candidates?`
              : `No interviews scheduled for today. Enjoy your day!`
            }
          </Typography>
        </Box>

        {/* Stat Cards */}
        <Box sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 2.5,
          mb: 4,
        }}>
          {[
            {
              icon: <AssignmentInd sx={{ fontSize: 22, color: PRIMARY }} />,
              iconBg: `${PRIMARY}15`,
              label: 'Total Assigned',
              value: totalAssigned,
              badge: interviews.filter(i => {
                const d = new Date(i.scheduledDate);
                const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                return d >= weekAgo && d <= now;
              }).length,
              badgeLabel: 'this week',
            },
            {
              icon: <Today sx={{ fontSize: 22, color: PRIMARY }} />,
              iconBg: `${PRIMARY}15`,
              label: 'Today\'s Interviews',
              value: todaysInterviews.length,
              badge: null,
            },
            {
              icon: <EventAvailable sx={{ fontSize: 22, color: PRIMARY }} />,
              iconBg: `${PRIMARY}15`,
              label: 'Upcoming',
              value: upcoming.length,
              badge: null,
            },
            {
              icon: <PendingActions sx={{ fontSize: 22, color: '#f97316' }} />,
              iconBg: '#fff7ed',
              label: 'Pending Feedback',
              value: pendingFeedback.length,
              badge: null,
            },
          ].map(card => (
            <Paper key={card.label}
              elevation={0} sx={{
                p: 3,
                borderRadius: '12px',
                border: '1px solid #e2e8f0',
                bgcolor: 'white',
                boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                transition: 'all 0.15s',
                '&:hover': {
                  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                  transform: 'translateY(-1px)'
                }
              }}>

              {/* Icon +badge  row */}
              <Box sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                mb: 2
              }}>
                <Box sx={{
                  width: 40, height: 40, borderRadius: '10px',
                  bgcolor: card.iconBg,
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  {card.icon}
                </Box>
                {card.badge > 0 && (
                  <Box sx={{
                    px: 1.25, py: 0.3, borderRadius: '999px',
                    bgcolor: '#f0fdf4', color: '#15803d',
                    fontSize: '0.6875rem', fontWeight: 700,
                  }}>
                    +{card.badge} {card.badgeLabel}
                  </Box>
                )}
              </Box>

              {/* Label */}
              <Typography sx={{
                fontSize: '0.8125rem', color: '#64748b',
                fontWeight: 500, mb: 0.5,
              }}>
                {card.label}
              </Typography>
              {/* Value */}
              <Typography sx={{
                fontSize: '1.75rem',
                fontWeight: 900,
                color: '#0f172a'
              }}>
                {card.value}
              </Typography>
            </Paper>
          ))}
        </Box>

        {/* pending feedback banner */}
        {firstPending && (
          <Box sx={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            p: 2.5, mb: 4, borderRadius: '12px',
            bgcolor: '#fff7ed', border: '1px solid #fed7aa',
          }}>
            {/* Left side — icon + text together */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{
                width: 44, height: 44, borderRadius: '50%',
                bgcolor: '#f97316',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                <Warning sx={{ color: 'white', fontSize: 22 }} />
              </Box>
              {/* Text is INSIDE the left flex box, not outside */}
              <Box>
                <Typography sx={{ fontWeight: 700, color: '#9a3412', fontSize: '0.9375rem' }}>
                  Pending Feedback
                </Typography>
                <Typography sx={{ fontSize: '0.8125rem', color: '#c2410c' }}>
                  You haven't submitted the evaluation for{' '}
                  <Box component="span" sx={{ fontWeight: 700 }}>
                    {firstPending.candidateName}'s
                  </Box>
                  {' '}interview from {formatDate(firstPending.scheduledDate)}.
                  {pendingFeedback.length > 1 && ` (+${pendingFeedback.length - 1} more)`}
                </Typography>
              </Box>
            </Box>

            {/* Right side — Complete Now button */}
            <Box onClick={() => navigate(`/interviewer/candidates/${firstPending.candidateId}`, {
              state: { interview: firstPending }
            })}
              sx={{
                display: 'flex', alignItems: 'center', gap: 0.5,
                color: '#c2410c', fontWeight: 700, fontSize: '0.875rem',
                cursor: 'pointer', flexShrink: 0,
                '&:hover': { textDecoration: 'underline' },
              }}>
              Complete Now <ArrowForward sx={{ fontSize: 16 }} />
            </Box>
          </Box>
        )}

        {/* Todays Agenda */}
        <Paper elevation={0} sx={{
          borderRadius: '12px', border: '1px solid #e2e8f0',
          bgcolor: 'white', boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
          overflow: 'hidden'
        }}>
          {/* Header */}
          <Box sx={{
            px: 3, py: 2, borderBottom: '1px solid #f1f5f9',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between'
          }}>
            <Typography sx={{ fontWeight: 800, fontSize: '1rem', color: '#0f172a' }}>
              Today's Agenda
            </Typography>
            <Box
              onClick={() => navigate('/interviewer/my-interviews')}
              sx={{
                fontSize: '0.75rem', fontWeight: 700, color: PRIMARY,
                cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.06rem',
                '&:hover': { textDecoration: 'underline' },

              }}
            >
              View All →
            </Box>
          </Box>

          {/* Interview List */}
          {todaysInterviews.length === 0 ? (
            <Box sx={{ py:6, display: 'flex', flexDirection:'column',
              alignItems: 'center', gap: 1.5
            }}>
              <Typography sx={{ fontSize: '2rem' }}>📅</Typography>
              <Typography sx={{ fontWeight: 600, color: '#0f172a'}}>
                No interviews today
              </Typography>
              <Typography sx={{ fontSize: '0.8125rem', color: '#94a3b8' }}>
                Enjoy your free day!
              </Typography>
            </Box>
          ) : (
            <Box>
              {todaysInterviews.map((interview, idx) => {
                const avatarColor = getAvatarColor(interview.candidateName);
                const nameInitials = interview.candidateName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
                const isRemote = interview.interviewMode === 'Remote';
                const isLast = idx === todaysInterviews.length - 1;

                return (
                  <Box
                    key={interview.roundId}
                    onClick={() => navigate(`/interviewer/candidates/${interview.candidateId}`, {
                      state: { interview }
                    })}

                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2.5,
                      px: 3, py: 2.5,
                      borderBottom: isLast ? 'none' : '1px solid #f1f5f9',
                      cursor: 'pointer', transition: 'all 0.15s',
                      '&:hover': { bgcolor: '#f8fafc' }
                    }}
                  >

                    {/* Date Box */}
                    <Box sx={{
                      width: 48, height: 52,
                      borderRadius: '10px',
                      bgcolor: '#f1f5f9', flexShrink: 0,
                      display: 'flex', flexDirection: 'column',
                      alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Typography sx={{ fontSize: '0.6rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06rem' }}>
                        {new Date(interview.scheduledDate).toLocaleDateString('en-US', { month: 'short' })}
                      </Typography>
                      <Typography sx={{ fontWeight: 900, fontSize: '1.25rem', color: '#0f172a', lineHeight: 1.2 }}>
                        {new Date(interview.scheduledDate).getDate()}
                      </Typography>
                    </Box>

                    {/* Avatar */}
                    <Avatar sx={{
                      width: 40, height: 40, flexShrink: 0,
                      bgcolor: `${avatarColor}20`, color: avatarColor,
                      fontSize: '0.8rem', fontWeight: 700,
                      border: `2px solid ${avatarColor}30`,
                    }}>
                      {nameInitials}
                    </Avatar>

                    {/* Info */}
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography sx={{ fontSize: '0.9375rem', fontWeight: 700, color: '#0f172a', mb: 0.25 }}>
                        {interview.candidateName}
                      </Typography>
                      <Typography sx={{ fontSize: '0.8125rem', color: '#64748b' }}>
                        {interview.roundName} • {isRemote ? (interview.interviewLink ? 'Google Meet' : 'Remote') : (interview.officeLocation || 'In-office')}
                      </Typography>
                    </Box>

                    {/* Time Badge */}
                    <Box sx={{
                      px: 1.5, py: 0.5, borderRadius: '6px',
                      bgcolor: `${PRIMARY}10`, color: PRIMARY,
                      fontSize: '0.75rem', fontWeight: 700,
                      flexShrink: 0,
                    }}>
                      {formatTime(interview.scheduledDate)}
                    </Box>
                  </Box>
                )
              })}

            </Box>
          )
          }
        </Paper>
      </Box >
    </Box>
  )
}

export default Dashboard;