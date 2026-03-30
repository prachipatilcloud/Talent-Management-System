import {
  Dashboard as DashboardIcon,
  Group as GroupIcon,
  CalendarToday as CalendarTodayIcon,
  Badge as BadgeIcon,
  Mic as MicIcon,
  Analytics as AnalyticsIcon,
  Settings as SettingsIcon,
  Logout as LogoutIcon,
  AccountTree,
} from '@mui/icons-material';
import { Avatar, Box, Tooltip, Typography } from '@mui/material';
import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const PRIMARY = '#1E293B';

const navItems = [
  { label: 'Dashboard', icon: DashboardIcon },
  { label: 'Candidates', icon: GroupIcon },
  { label: 'Interviews', icon: CalendarTodayIcon },
  { label: 'HR Users', icon: BadgeIcon },
  { label: 'Interviewers', icon: MicIcon },
  { label: 'Reports', icon: AnalyticsIcon },
  { label: 'Settings', icon: SettingsIcon },
];

const AdminSidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(true);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const initials = user
    ? `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase()
    : 'A';

  return (
    <Box
      sx={{
        width: expanded ? 240 : 72,
        bgcolor: PRIMARY,
        color: 'white',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
        transition: 'width 0.25s ease',
        overflow: 'hidden',
        height: '100vh',
        position: 'fixed',
        left: 0,
        top: 0,
        zIndex: 1100,
      }}
    >
      {/* Logo */}
      <Box
        sx={{
          p: 2.5,
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          cursor: 'pointer',
          minHeight: 64,
          transition: 'all 0.25s ease',
        }}
        onClick={() => setExpanded(!expanded)}
      >
        <Box
          sx={{
            bgcolor: 'rgba(255,255,255,0.2)',
            borderRadius: '8px',
            p: 0.75,
            display: 'flex',
            flexShrink: 0,
            transition: 'all 0.15s',
            '&:hover': {
              bgcolor: 'rgba(255,255,255,0.3)',
            },
          }}
        >
          <AccountTree sx={{ color: 'white', fontSize: 22 }} />
        </Box>
        {expanded && (
          <Box sx={{ flex: 1, overflow: 'hidden' }}>
            <Typography
              sx={{
                color: 'white',
                fontWeight: 700,
                fontSize: '1.1rem',
                whiteSpace: 'nowrap',
                transition: 'opacity 0.25s ease',
              }}
            >
              TalentFlow
            </Typography>
            <Typography
              sx={{
                color: 'rgba(255,255,255,0.7)',
                fontSize: '0.75rem',
                fontWeight: 500,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                transition: 'opacity 0.25s ease',
              }}
            >
              ATS Admin
            </Typography>
          </Box>
        )}
      </Box>

      {/* Navigation */}
      <Box sx={{ flex: 1, px: 1, mt: 1 }}>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Tooltip
              key={item.label}
              title={!expanded ? item.label : ''}
              placement="right"
            >
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                  px: 1.5,
                  py: 1.25,
                  borderRadius: '8px',
                  mb: 0.5,
                  cursor: 'pointer',
                  bgcolor: 'transparent',
                  color: 'rgba(255,255,255,0.7)',
                  transition: 'all 0.15s ease',
                  '&:hover': {
                    bgcolor: 'rgba(255,255,255,0.12)',
                    color: 'white',
                  },
                }}
              >
                <Icon sx={{ fontSize: 20, flexShrink: 0 }} />
                {expanded && (
                  <Typography
                    sx={{
                      fontSize: '0.875rem',
                      fontWeight: 500,
                      whiteSpace: 'nowrap',
                      transition: 'opacity 0.25s ease',
                    }}
                  >
                    {item.label}
                  </Typography>
                )}
              </Box>
            </Tooltip>
          );
        })}
      </Box>

      {/* Profile Footer */}
      <Box
        sx={{
          p: 1.5,
          borderTop: '1px solid rgba(255,255,255,0.1)',
          transition: 'all 0.25s ease',
        }}
      >
        {/* Logout Button */}
        <Tooltip title={!expanded ? 'Logout' : ''} placement="right">
          <Box
            onClick={handleLogout}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              px: 1.5,
              py: 1,
              borderRadius: '8px',
              cursor: 'pointer',
              color: 'rgba(255,255,255,0.65)',
              transition: 'all 0.15s ease',
              '&:hover': {
                bgcolor: 'rgba(255,255,255,0.12)',
                color: 'white',
              },
              mb: 1,
            }}
          >
            <LogoutIcon sx={{ fontSize: 20, flexShrink: 0 }} />
            {expanded && (
              <Typography
                sx={{
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  whiteSpace: 'nowrap',
                  transition: 'opacity 0.25s ease',
                }}
              >
                Logout
              </Typography>
            )}
          </Box>
        </Tooltip>

        {/* Profile Info */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            px: 1.5,
            py: 1,
            transition: 'all 0.25s ease',
          }}
        >
          <Avatar
            sx={{
              width: 32,
              height: 32,
              bgcolor: 'rgba(255,255,255,0.25)',
              fontSize: '0.75rem',
              fontWeight: 700,
              flexShrink: 0,
              transition: 'all 0.15s ease',
            }}
          >
            {initials}
          </Avatar>
          {expanded && (
            <Box sx={{ overflow: 'hidden', flex: 1 }}>
              <Typography
                sx={{
                  color: 'white',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  transition: 'opacity 0.25s ease',
                }}
              >
                {user?.firstName} {user?.lastName}
              </Typography>
              <Typography
                sx={{
                  color: 'rgba(255,255,255,0.7)',
                  fontSize: '0.75rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  transition: 'opacity 0.25s ease',
                }}
              >
                {user?.role}
              </Typography>
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default AdminSidebar;
