import {
    AccountTree, BarChart, CalendarToday,
    Dashboard, Logout, People, SupervisorAccount,
} from "@mui/icons-material";
import { Avatar, Box, Tooltip, Typography } from "@mui/material";
import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { Outlet, useLocation, useNavigate } from "react-router-dom";

const PRIMARY = '#3b4eba';

const navItems = [
    { label: 'Dashboard', icon: <Dashboard sx={{ fontSize: 20 }} />, path: '/hr/dashboard', roles: ['hr'] },
    { label: 'Candidates', icon: <People sx={{ fontSize: 20 }} />, path: '/hr/candidates', roles: ['hr'] },
    { label: 'Reports', icon: <BarChart sx={{ fontSize: 20 }} />, path: '/hr/reports', roles: ['hr'] },
    { label: 'Interviews', icon: <CalendarToday sx={{ fontSize: 20 }} />, path: '/hr/schedule-interview', roles: ['hr'] },

    { label: 'Dashboard', icon: <Dashboard sx={{ fontSize: 20 }} />, path: '/admin/dashboard', roles: ['admin'] },
    { label: 'Candidates', icon: <People sx={{ fontSize: 20 }} />, path: '/admin/candidates', roles: ['admin'] },
    { label: 'Reports', icon: <BarChart sx={{ fontSize: 20 }} />, path: '/admin/reports', roles: ['admin'] },
    { label: 'Users', icon: <SupervisorAccount sx={{ fontSize: 20 }} />, path: '/admin/interviewers', roles: ['admin'] },

    { label: 'Dashboard', icon: <Dashboard sx={{ fontSize: 20 }} />, path: '/interviewer/dashboard', roles: ['interviewer'] },
    { label: 'My Interviews', icon: <CalendarToday sx={{ fontSize: 20 }} />, path: '/interviewer/my-interviews', roles: ['interviewer'] },
];

const Layout = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [expanded, setExpanded] = useState(true);

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    const initials = user
        ? `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase()
        : 'U';

    return (
        <Box sx={{ display: 'flex', height: '100vh', overflow: 'hidden', bgcolor: '#f6f6f8' }}>

            {/* ── Sidebar ─────────────────────────────── */}
            <Box sx={{
                width: expanded ? 224 : 64,
                bgcolor: PRIMARY,
                display: 'flex',
                flexDirection: 'column',
                flexShrink: 0,
                transition: 'width 0.25s ease',
                overflow: 'hidden',
            }}>

                {/* Logo / collapse toggle */}
                <Box
                    onClick={() => setExpanded(p => !p)}
                    sx={{
                        px: expanded ? 2.5 : 1.5,
                        py: 3,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1.25,
                        cursor: 'pointer',
                        minHeight: 72,
                        transition: 'padding 0.25s',
                    }}
                >
                    <Box sx={{
                        bgcolor: 'white',
                        borderRadius: '8px',
                        p: 0.625,
                        display: 'flex',
                        flexShrink: 0,
                    }}>
                        <AccountTree sx={{ color: PRIMARY, fontSize: 20 }} />
                    </Box>
                    {expanded && (
                        <Box>
                            <Typography sx={{
                                color: 'white',
                                fontWeight: 800,
                                fontSize: '1.125rem',
                                whiteSpace: 'nowrap',
                                lineHeight: 1.1,
                                fontFamily: "'Manrope', sans-serif",
                            }}>
                                TalentFlow
                            </Typography>
                            <Typography sx={{
                                color: 'rgba(255,255,255,0.55)',
                                fontSize: '0.5625rem',
                                fontWeight: 700,
                                textTransform: 'uppercase',
                                letterSpacing: '0.12em',
                                mt: 0.25,
                            }}>
                                ATS
                            </Typography>
                        </Box>
                    )}
                </Box>

                {/* Nav items */}
                <Box sx={{ flex: 1, px: 1, mt: 0.5 }}>
                    {navItems
                        .filter(item => item.roles.includes(user?.role))
                        .map(item => {
                            const active = location.pathname.startsWith(item.path);
                            return (
                                <Tooltip
                                    key={item.path}
                                    title={!expanded ? item.label : ''}
                                    placement="right"
                                    arrow
                                >
                                    <Box
                                        onClick={() => navigate(item.path)}
                                        sx={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 1.25,
                                            px: expanded ? 1.5 : 1,
                                            py: 1.125,
                                            borderRadius: '8px',
                                            mb: 0.375,
                                            cursor: 'pointer',
                                            bgcolor: active ? 'rgba(255,255,255,0.18)' : 'transparent',
                                            color: active ? 'white' : 'rgba(255,255,255,0.6)',
                                            transition: 'all 0.15s',
                                            justifyContent: expanded ? 'flex-start' : 'center',
                                            '&:hover': {
                                                bgcolor: 'rgba(255,255,255,0.12)',
                                                color: 'white',
                                            },
                                        }}
                                    >
                                        {/* Icon — always visible, correct size */}
                                        <Box sx={{ display: 'flex', flexShrink: 0, alignItems: 'center' }}>
                                            {item.icon}
                                        </Box>

                                        {/* Label — only when expanded */}
                                        {expanded && (
                                            <Typography sx={{
                                                fontSize: '0.875rem',
                                                fontWeight: active ? 700 : 500,
                                                whiteSpace: 'nowrap',
                                                lineHeight: 1,
                                            }}>
                                                {item.label}
                                            </Typography>
                                        )}
                                    </Box>
                                </Tooltip>
                            );
                        })}
                </Box>

                {/* Bottom: logout + user info */}
                <Box sx={{ p: 1.25, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                    <Tooltip title={!expanded ? 'Logout' : ''} placement="right" arrow>
                        <Box
                            onClick={handleLogout}
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1.25,
                                px: expanded ? 1.5 : 1,
                                py: 0.875,
                                borderRadius: '8px',
                                cursor: 'pointer',
                                color: 'rgba(255,255,255,0.6)',
                                justifyContent: expanded ? 'flex-start' : 'center',
                                mb: 0.75,
                                '&:hover': { bgcolor: 'rgba(255,255,255,0.12)', color: 'white' },
                            }}
                        >
                            <Logout sx={{ fontSize: 18, flexShrink: 0 }} />
                            {expanded && (
                                <Typography sx={{ fontSize: '0.875rem', fontWeight: 500, whiteSpace: 'nowrap' }}>
                                    Logout
                                </Typography>
                            )}
                        </Box>
                    </Tooltip>

                    {/* User row */}
                    <Tooltip title={!expanded ? `${user?.firstName} ${user?.lastName}` : ''} placement="right" arrow>
                        <Box sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1.25,
                            px: expanded ? 1.5 : 1,
                            py: 0.875,
                            justifyContent: expanded ? 'flex-start' : 'center',
                        }}>
                            <Avatar sx={{
                                width: 30, height: 30,
                                bgcolor: 'rgba(255,255,255,0.22)',
                                fontSize: '0.6875rem',
                                fontWeight: 700,
                                flexShrink: 0,
                            }}>
                                {initials}
                            </Avatar>
                            {expanded && (
                                <Box sx={{ overflow: 'hidden' }}>
                                    <Typography sx={{
                                        color: 'white', fontSize: '0.75rem', fontWeight: 600,
                                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                                    }}>
                                        {user?.firstName} {user?.lastName}
                                    </Typography>
                                    <Typography sx={{
                                        color: 'rgba(255,255,255,0.6)',
                                        fontSize: '0.6875rem',
                                        textTransform: 'capitalize',
                                    }}>
                                        {user?.role}
                                    </Typography>
                                </Box>
                            )}
                        </Box>
                    </Tooltip>
                </Box>
            </Box>

            {/* ── Main content ─────────────────────────── */}
            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'auto', minWidth: 0 }}>
                <Outlet />
            </Box>
        </Box>
    );
};

export default Layout;