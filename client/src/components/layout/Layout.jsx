import { AccountTree, BarChart, CalendarToday, Dashboard, Logout, People } from "@mui/icons-material";
import { Avatar, Box, Tooltip, Typography } from "@mui/material"
import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { Outlet, useLocation, useNavigate } from "react-router-dom";

const PRIMARY = '#3b4eba';

const navItems = [
    { label: 'Dashboard', icon: <Dashboard />, path: '/hr/dashboard', roles: ['hr'] },
    { label: 'Candidates', icon: <People />, path: '/hr/candidates', roles: ['hr'] },
    { label: 'Reports', icon: <BarChart />, path: '/hr/reports', roles: ['hr'] },
    { label: 'Interviews', icon: <CalendarToday />, path: '/hr/schedule-interview', roles: ['hr'] },
    { label: 'Dashboard', icon: <Dashboard />, path: '/admin/dashboard', roles: ['admin'] },
    { label: 'Candidates', icon: <People />, path: '/admin/candidates', roles: ['admin'] },
    { label: 'Reports', icon: <BarChart />, path: '/admin/reports', roles: ['admin'] },
    { label: 'Interviewers', icon: <CalendarToday />, path: '/admin/interviewers', roles: ['admin'] },
    { label: 'Dashboard', icon: <Dashboard />, path: '/interviewer/dashboard', roles: ['interviewer'] },
    { label: 'My Interviews', icon: <CalendarToday />, path: '/interviewer/my-interviews', roles: ['interviewer'] },
];

const Layout = () => {

    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [expanded, setExpanded] = useState(true);

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    }

    const initials = user ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase() : 'U';

    return (
        <Box sx={{
            display: 'flex',
            height: '100vh',
            overflow: 'hidden',
            bgcolor: '#f6f6f8',
        }}>
            {/* Sidebar */}
            <Box sx={{
                width: expanded ? 240 : 72,
                bgcolor: PRIMARY,
                display: 'flex',
                flexDirection: 'column',
                flexShrink: 0,
                transition: 'width 0.25s ease',
                overflow: 'hidden',
            }}>

                {/* Logo */}
                <Box sx={{
                    px: 3,
                    py: 4,
                    display: "flex",
                    alignItems: 'center',
                    gap: 1.5,
                    cursor: 'pointer',
                    minHeight: 80,
                }}
                    onClick={() => setExpanded(!expanded)}
                >
                    <Box sx={{
                        bgcolor: 'white',
                        borderRadius: '8px',
                        p: 0.75,
                        display: "flex",
                        flexShrink: 0,
                    }}>
                        <AccountTree sx={{ color: PRIMARY, fontSize: 24 }} />
                    </Box>
                    {expanded && (
                        <Box>
                            <Typography sx={{
                                color: 'white',
                                fontWeight: 800, fontSize: '1.25rem',
                                whiteSpace: 'nowrap',
                                lineHeight: 1,
                                fontFamily: "'Manrope', sans-serif"
                            }}>
                                TalentFlow
                            </Typography>
                            <Typography sx={{ 
                                color: 'rgba(255,255,255,0.6)', 
                                fontSize: '10px', 
                                fontWeight: 700, 
                                textTransform: 'uppercase', 
                                letterSpacing: '0.1em',
                                mt: 0.5
                            }}>
                                Clinical Curator
                            </Typography>
                        </Box>
                    )}
                </Box>

                {/* Nav Items */}
                <Box sx={{ flex: 1, px: 1, mt: 1 }}>
                    {navItems
                        .filter(item => item.roles.includes(user?.role))
                        .map((item) => {
                            const active = location.pathname.startsWith(item.path);
                            return (
                                <Tooltip key={item.path} title={!expanded ? item.label : ''} placement="right">
                                    <Box
                                        onClick={() => navigate(item.path)}
                                        sx={{
                                            display: "flex",
                                            alignItems: 'center',
                                            gap: 1.5,
                                            px: 1.5,
                                            py: 1.25,
                                            borderRadius: '8px',
                                            mb: 0.5,
                                            cursor: 'pointer',
                                            bgcolor: active ? 'rgba(255,255,255,0.2)' : 'transparent',
                                            color: active ? 'white' : 'rgba(255,255,255,0.65)',
                                            transition: 'all 0.15s',
                                            '&:hover': {
                                                bgcolor: 'rgba(255,255,255,0.12)',
                                                color: 'white'
                                            },
                                        }}
                                    >
                                        <Box sx={{ flexShrink: 0, display: 'flex' }}>
                                            {item.icon}
                                        </Box>
                                        {expanded && (
                                            <Typography sx={{
                                                fontSize: '0.875rem',
                                                fontWeight: 500,
                                                whiteSpace: 'nowrap'
                                            }}>
                                                {item.label}
                                            </Typography>
                                        )}
                                    </Box>
                                </Tooltip>
                            );
                        })
                    }
                </Box>

                {/* Logout */}
                <Box sx={{ p: 1.5, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                    <Tooltip title={!expanded ? 'Logout' : ''} placement="right">
                        <Box
                            onClick={handleLogout}
                            sx={{
                                display: "flex",
                                alignItems: 'center',
                                gap: 1.5,
                                px: 1.5,
                                py: 1,
                                borderRadius: '8px',
                                cursor: 'pointer',
                                color: 'rgba(255,255,255,0.65)',
                                '&:hover': {
                                    bgcolor: 'rgba(255,255,255,0.12)',
                                    color: 'white'
                                },
                                mb: 1
                            }}
                        >
                            <Logout sx={{ fontSize: 20, flexShrink: 0 }} />
                            {expanded && (
                                <Typography sx={{ fontSize: '0.875rem', fontWeight: 500, whiteSpace: 'nowrap' }}>
                                    Logout
                                </Typography>
                            )}
                        </Box>
                    </Tooltip>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, px: 1.5, py: 1 }}>
                        <Avatar sx={{
                            width: 32, height: 32,
                            bgcolor: 'rgba(255,255,255,0.25)',
                            fontSize: '0.75rem', fontWeight: 700,
                            flexShrink: 0,
                        }}>
                            {initials}
                        </Avatar>
                        {expanded && (
                            <Box sx={{ overflow: "hidden" }}>
                                <Typography sx={{
                                    color: "white", fontSize: '0.75rem', fontWeight: 600,
                                    whiteSpace: "nowrap", overflow: "hidden", textOverflow: 'ellipsis'
                                }}>
                                    {user?.firstName} {user?.lastName}
                                </Typography>
                                <Typography sx={{ color: "white", fontSize: '0.75rem', textTransform: 'capitalize' }}>
                                    {user?.role}
                                </Typography>
                            </Box>
                        )}
                    </Box>
                </Box>
            </Box>

            {/* Main Content */}
            <Box sx={{ flex: 1, display: 'flex', flexDirection: "column", overflow: "auto", minWidth: 0 }}>
                <Outlet />
            </Box>
        </Box>
    );
}

export default Layout;