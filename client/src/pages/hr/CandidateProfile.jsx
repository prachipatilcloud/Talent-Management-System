import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import API from '../../api/axios';
import {
    Box, Typography, Button, Avatar, IconButton,
    CircularProgress, Divider, Paper,
    Dialog, DialogContent, DialogTitle, MenuItem, TextField,
} from '@mui/material';
import {
    ArrowBack, Email, Phone,
    Download, ZoomIn, ZoomOut,
    CheckCircle, Cancel,
    Star, StarHalf, StarBorder,
    OpenInNew, InsertDriveFile, CalendarMonth,
    Edit, Videocam, Business, Close,
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';

const PRIMARY = '#3b4eba';
const GREEN = '#16a34a';
const RED = '#dc2626';

const TIME_SLOTS = [
    '9:00 AM - 10:00 AM', '10:00 AM - 11:00 AM', '11:00 AM - 12:00 PM',
    '12:00 PM - 1:00 PM', '1:00 PM - 2:00 PM', '2:00 PM - 3:00 PM',
    '3:00 PM - 4:00 PM', '4:00 PM - 5:00 PM', '5:00 PM - 6:00 PM',
];

const statusConfig = {
    Applied: { bg: '#f1f5f9', color: '#475569', border: '#e2e8f0' },
    Shortlisted: { bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe' },
    Interviewing: { bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe' },
    Selected: { bg: '#f0fdf4', color: '#15803d', border: '#bbf7d0' },
    Rejected: { bg: '#fff1f2', color: '#be123c', border: '#fecdd3' },
    'On Hold': { bg: '#fefce8', color: '#a16207', border: '#fef08a' },
    'Talent Pool': { bg: '#faf5ff', color: '#7e22ce', border: '#e9d5ff' },
};

const roundStatusConfig = {
    pending: { bg: '#fefce8', color: '#a16207', border: '#fef08a', label: 'PENDING' },
    passed: { bg: '#f0fdf4', color: '#15803d', border: '#bbf7d0', label: 'PASSED' },
    rejected: { bg: '#fff1f2', color: '#be123c', border: '#fecdd3', label: 'REJECTED' },
};

const recommendationConfig = {
    'Hire': { bg: '#f0fdf4', color: '#15803d', border: '#bbf7d0' },
    'No Hire': { bg: '#fff1f2', color: '#be123c', border: '#fecdd3' },
    'Maybe': { bg: '#fefce8', color: '#a16207', border: '#fef08a' },
};

const getAvatarColor = (name) => {
    const colors = ['#4f46e5', '#0891b2', '#059669', '#d97706', '#dc2626', '#7c3aed'];
    return colors[(name?.charCodeAt(0) || 0) % colors.length];
};

const formatDate = (d) =>
    d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';

const formatDateTime = (d) =>
    d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

const StarRating = ({ value = 0 }) => (
    <Box sx={{ display: 'flex', gap: 0.25 }}>
        {[1, 2, 3, 4, 5].map(i => (
            i <= Math.floor(value)
                ? <Star key={i} sx={{ fontSize: 14, color: '#f59e0b' }} />
                : i - 0.5 <= value
                    ? <StarHalf key={i} sx={{ fontSize: 14, color: '#f59e0b' }} />
                    : <StarBorder key={i} sx={{ fontSize: 14, color: '#d1d5db' }} />
        ))}
    </Box>
);

const StepIcon = ({ status }) => {
    if (status === 'passed') return <CheckCircle sx={{ fontSize: 26, color: GREEN, flexShrink: 0 }} />;
    if (status === 'rejected') return <Cancel sx={{ fontSize: 26, color: RED, flexShrink: 0 }} />;
    return (
        <Box sx={{
            width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
            bgcolor: '#f1f5f9', border: `2px solid #cbd5e1`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#cbd5e1' }} />
        </Box>
    );
};

// ════════════════════════════════════════════════════════════════════
const CandidateProfile = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuth();

    const [candidate, setCandidate] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [iframeZoom, setIframeZoom] = useState(0.85);
    const [resumeBlobUrl, setResumeBlobUrl] = useState(null);
    const [resumeLoading, setResumeLoading] = useState(false);
    const [resumeError, setResumeError] = useState(false);
    const blobUrlRef = useRef(null);
    const [rejectLoading, setRejectLoading] = useState(false);

    // ── Reschedule modal state ───────────────────────────────────────
    const [rescheduleModal, setRescheduleModal] = useState({ open: false, round: null });
    const [rescheduleForm, setRescheduleForm] = useState({ date: '', timeSlot: '10:00 AM - 11:00 AM', mode: 'In-office', meetingLink: '', officeLocation: '' });
    const [rescheduleInterviewers, setRescheduleInterviewers] = useState([]);
    const [rescheduleInterviewerInput, setRescheduleInterviewerInput] = useState('');
    const [interviewerOptions, setInterviewerOptions] = useState([]);
    const [rescheduleLoading, setRescheduleLoading] = useState(false);
    const [rescheduleError, setRescheduleError] = useState('');

    const basePath = location.pathname.startsWith('/admin') ? '/admin' : '/hr';

    // ── Fetch candidate ──────────────────────────────────────────────
    useEffect(() => {
        const fetchCandidate = async () => {
            try {
                const res = await API.get(`/candidates/${id}`);
                setCandidate(res.data.candidate);
            } catch (err) {
                setError('Failed to load candidate profile.');
            } finally {
                setLoading(false);
            }
        };
        fetchCandidate();
    }, [id]);

    // ── Fetch interviewers for reschedule modal ──────────────────────
    useEffect(() => {
        API.get('/users?role=interviewer&limit=100')
            .then(res => setInterviewerOptions(res.data.data || []))
            .catch(() => setInterviewerOptions([]));
    }, []);

    // ── Fetch resume as blob ─────────────────────────────────────────
    useEffect(() => {
        if (!candidate?.resume?.driveFileId) return;
        const fetchResume = async () => {
            setResumeLoading(true);
            setResumeError(false);
            try {
                const res = await API.get(`/candidates/${id}/resume`, { responseType: 'blob' });
                if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current);
                const url = URL.createObjectURL(res.data);
                blobUrlRef.current = url;
                setResumeBlobUrl(url);
            } catch (err) {
                console.error('Resume fetch failed:', err);
                setResumeError(true);
            } finally {
                setResumeLoading(false);
            }
        };
        fetchResume();
        return () => { if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current); };
    }, [candidate, id]);

    const handleDownload = () => {
        if (!resumeBlobUrl) return;
        const a = document.createElement('a');
        a.href = resumeBlobUrl;
        a.download = candidate.resume.fileName || 'resume.pdf';
        a.click();
    };

    const handleScheduleInterview = () => {
        const lastRound = rounds[rounds.length - 1];
        navigate(`${basePath}/candidates/${id}/schedule-interview`, {
            state: { candidate, lastRoundName: lastRound?.roundName || null },
        });
    };

    // ── Open reschedule modal ────────────────────────────────────────
    const openReschedule = (round) => {
        setRescheduleModal({ open: true, round });
        setRescheduleForm({
            date: round.scheduledDate ? new Date(round.scheduledDate).toISOString().split('T')[0] : '',
            timeSlot: '10:00 AM - 11:00 AM',
            mode: round.interviewMode || 'In-office',
            meetingLink: round.interviewLink || '',
            officeLocation: round.officeLocation || '',
        });
        setRescheduleInterviewers(
            Array.isArray(round.interviewers)
                ? round.interviewers.filter(i => typeof i === 'object')
                : []
        );
        setRescheduleError('');
        setRescheduleInterviewerInput('');
    };

    // ── Submit reschedule ────────────────────────────────────────────
    const handleReschedule = async () => {
        if (!rescheduleForm.date) { setRescheduleError('Please select a date'); return; }
        if (rescheduleInterviewers.length === 0) { setRescheduleError('Add at least one interviewer'); return; }
        setRescheduleLoading(true);
        setRescheduleError('');
        try {
            const res = await API.patch(
                `/candidates/${candidate._id}/rounds/${rescheduleModal.round._id}/reschedule`,
                {
                    scheduledDate: `${rescheduleForm.date} ${rescheduleForm.timeSlot.split(' - ')[0]}`,
                    interviewMode: rescheduleForm.mode,
                    interviewLink: rescheduleForm.mode === 'Remote' ? rescheduleForm.meetingLink : undefined,
                    officeLocation: rescheduleForm.mode === 'In-office' ? rescheduleForm.officeLocation : undefined,
                    interviewers: rescheduleInterviewers.map(i => i._id),
                }
            );
            setCandidate(res.data.candidate);
            setRescheduleModal({ open: false, round: null });
        } catch (err) {
            setRescheduleError(err.response?.data?.message || 'Failed to reschedule.');
        } finally {
            setRescheduleLoading(false);
        }
    };

    const handleReject = async () => {
        if (!window.confirm(`Are you sure you want to reject ${candidate.firstName} ${candidate.lastName}?`)) return;
        setRejectLoading(true);
        try {
            const res = await API.patch(`/candidates/${id}/status`, { status: 'Rejected' });
            setCandidate(res.data.candidate);
        } catch (error) {
            console.error('Failed to reject candidate:', error);
        } finally {
            setRejectLoading(false);
        }
    }

    // ── Loading / error states ───────────────────────────────────────
    if (loading) return (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            <CircularProgress sx={{ color: PRIMARY }} />
        </Box>
    );

    if (error || !candidate) return (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 2 }}>
            <Typography sx={{ color: '#ef4444', fontWeight: 600 }}>{error || 'Candidate not found'}</Typography>
            <Button onClick={() => navigate(`${basePath}/candidates`)} startIcon={<ArrowBack />}
                sx={{ textTransform: 'none', color: PRIMARY }}>
                Back to Candidates
            </Button>
        </Box>
    );

    const sc = statusConfig[candidate.status] || statusConfig.Applied;
    const initials = `${candidate.firstName?.[0] || ''}${candidate.lastName?.[0] || ''}`.toUpperCase();
    const avatarColor = getAvatarColor(candidate.firstName);
    const appId = `#${String(candidate._id).slice(-5).toUpperCase()}`;
    const resume = candidate.resume;
    const hasResume = !!(resume?.driveFileId);
    const rounds = candidate.interviewRounds || [];


    return (
        <Box sx={{ height: '100%', overflow: 'auto', bgcolor: '#f6f6f8' }}>

            {/* ── Sticky Top Bar ── */}
            <Box sx={{
                height: 56, bgcolor: 'white', borderBottom: '1px solid #e2e8f0',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                px: 3, position: 'sticky', top: 0, zIndex: 10,
            }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <IconButton size="small" onClick={() => navigate(`${basePath}/candidates`)}
                        sx={{ color: '#64748b', '&:hover': { color: PRIMARY } }}>
                        <ArrowBack fontSize="small" />
                    </IconButton>
                    <Typography sx={{ fontWeight: 700, color: '#0f172a', fontSize: '0.9375rem' }}>
                        Candidate Profile
                    </Typography>
                    <Box sx={{
                        px: 1.5, py: 0.3, borderRadius: '6px',
                        bgcolor: 'rgba(59,78,186,0.08)', border: '1px solid rgba(59,78,186,0.2)',
                        fontSize: '0.75rem', fontWeight: 600, color: PRIMARY,
                    }}>
                        Application ID: {appId}
                    </Box>
                </Box>

                <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                    <Button
                        onClick={handleReject}
                        disabled={rejectLoading || candidate.status === 'Rejected'}
                        startIcon={rejectLoading ?
                            <CircularProgress size={14} sx={{ color: 'white' }} />
                            : <Cancel sx={{ fontSize: '1rem !important' }} />}
                        sx={{
                            textTransform: 'none', fontWeight: 700, fontSize: '0.875rem',
                            color: 'white', borderRadius: '8px', bgcolor: RED, px: 2, py: 0.75,
                            boxShadow: '0 2px 8px rgba(220,38,38,0.25)',
                            '&:hover': { bgcolor: '#b91c1c' },
                        }}>
                        Reject
                    </Button>

                    <Button
                        startIcon={<CalendarMonth sx={{ fontSize: '1rem !important' }} />}
                        onClick={handleScheduleInterview}
                        sx={{
                            textTransform: 'none', fontWeight: 700, fontSize: '0.875rem',
                            color: 'white', borderRadius: '8px',
                            bgcolor: '#2f3faa', px: 2, py: 0.75,
                            boxShadow: '0 2px 8px rgba(5,150,105,0.25)',
                            '&:hover': { bgcolor: '#047857' },
                        }}>
                        Schedule Interview
                    </Button>
                </Box>
            </Box>

            {/* ── Two Column Body ── */}
            <Box sx={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: 3, p: 3, maxWidth: 1280, mx: 'auto' }}>

                {/* ═══════ LEFT PANEL ═══════ */}
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>

                    {/* Profile Card */}
                    <Paper elevation={0} sx={{
                        borderRadius: '12px', border: '1px solid #e2e8f0',
                        bgcolor: 'white', overflow: 'hidden',
                        boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                    }}>
                        <Box sx={{ height: 5, bgcolor: PRIMARY }} />
                        <Box sx={{ p: 3 }}>
                            <Box sx={{ display: 'flex', gap: 2, mb: 2.5 }}>
                                <Avatar sx={{
                                    width: 64, height: 64, borderRadius: '12px',
                                    bgcolor: `${avatarColor}20`, color: avatarColor,
                                    fontSize: '1.25rem', fontWeight: 800,
                                    border: '2px solid #e2e8f0', flexShrink: 0,
                                }}>
                                    {initials}
                                </Avatar>
                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1, mb: 0.25 }}>
                                        <Typography sx={{ fontSize: '1.0625rem', fontWeight: 800, color: '#0f172a' }}>
                                            {candidate.firstName} {candidate.lastName}
                                        </Typography>
                                        <Box sx={{
                                            px: 1.25, py: 0.2, borderRadius: '6px',
                                            bgcolor: '#f0fdf4', color: '#15803d', border: '1px solid #bbf7d0',
                                            fontSize: '0.6rem', fontWeight: 800, letterSpacing: '0.06em',
                                        }}>
                                            ACTIVE
                                        </Box>
                                    </Box>
                                    <Typography sx={{ fontSize: '0.8125rem', color: '#64748b', fontWeight: 500 }}>
                                        {candidate.jobRole}
                                    </Typography>
                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mt: 1 }}>
                                        <Box component="span" sx={{
                                            px: 1.25, py: 0.3, borderRadius: '999px',
                                            bgcolor: sc.bg, color: sc.color, border: `1px solid ${sc.border}`,
                                            fontSize: '0.6875rem', fontWeight: 700,
                                        }}>
                                            {candidate.status}
                                        </Box>
                                        {candidate.experience != null && (
                                            <Box component="span" sx={{
                                                px: 1.25, py: 0.3, borderRadius: '999px',
                                                bgcolor: '#f8fafc', color: '#475569', border: '1px solid #e2e8f0',
                                                fontSize: '0.6875rem', fontWeight: 600,
                                            }}>
                                                {candidate.experience} yr{candidate.experience !== 1 ? 's' : ''} exp
                                            </Box>
                                        )}
                                    </Box>
                                </Box>
                            </Box>

                            <Divider sx={{ borderColor: '#f1f5f9', mb: 2 }} />

                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25, mb: 2 }}>
                                {[
                                    { icon: <Email sx={{ fontSize: 15 }} />, value: candidate.email },
                                    { icon: <Phone sx={{ fontSize: 15 }} />, value: candidate.phone || 'Not provided' },
                                ].map((row, i) => (
                                    <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                                        <Box sx={{ color: '#94a3b8', display: 'flex' }}>{row.icon}</Box>
                                        <Typography sx={{ fontSize: '0.8125rem', color: '#475569' }}>{row.value}</Typography>
                                    </Box>
                                ))}
                            </Box>

                            {candidate.skills?.length > 0 && (
                                <>
                                    <Divider sx={{ borderColor: '#f1f5f9', mb: 2 }} />
                                    <Typography sx={{ fontSize: '0.6875rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', mb: 1.25 }}>
                                        Skills
                                    </Typography>
                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
                                        {candidate.skills.map(skill => (
                                            <Box key={skill} component="span" sx={{
                                                px: 1.25, py: 0.4, borderRadius: '6px',
                                                bgcolor: 'rgba(59,78,186,0.08)', color: PRIMARY,
                                                fontSize: '0.75rem', fontWeight: 700,
                                            }}>
                                                {skill}
                                            </Box>
                                        ))}
                                    </Box>
                                </>
                            )}

                            {candidate.addedBy && (
                                <>
                                    <Divider sx={{ borderColor: '#f1f5f9', my: 2 }} />
                                    <Typography sx={{ fontSize: '0.6875rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', mb: 0.75 }}>
                                        Added By
                                    </Typography>
                                    <Typography sx={{ fontSize: '0.8125rem', color: '#475569' }}>
                                        {candidate.addedBy.firstName} {candidate.addedBy.lastName}
                                    </Typography>
                                    <Typography sx={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                                        {candidate.addedBy.email}
                                    </Typography>
                                </>
                            )}
                        </Box>
                    </Paper>

                    {/* Resume Card */}
                    <Paper elevation={0} sx={{
                        borderRadius: '12px', border: '1px solid #e2e8f0',
                        bgcolor: 'white', overflow: 'hidden',
                        boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                    }}>
                        <Box sx={{
                            px: 2, py: 1.5,
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            borderBottom: '1px solid #f1f5f9', bgcolor: '#fafafa',
                        }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                                <Box sx={{
                                    width: 30, height: 30, borderRadius: '6px',
                                    bgcolor: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    flexShrink: 0,
                                }}>
                                    <InsertDriveFile sx={{ fontSize: 16, color: '#dc2626' }} />
                                </Box>
                                <Box>
                                    <Typography sx={{ fontSize: '0.8125rem', fontWeight: 700, color: '#0f172a', lineHeight: 1.2 }}>
                                        {hasResume ? resume.fileName : 'No resume uploaded'}
                                    </Typography>
                                    {hasResume && (
                                        <Typography sx={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                                            Google Drive
                                        </Typography>
                                    )}
                                </Box>
                            </Box>

                            {hasResume && (
                                <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
                                    <IconButton size="small" onClick={() => setIframeZoom(z => Math.min(z + 0.1, 1.5))}
                                        sx={{ color: '#94a3b8', '&:hover': { color: PRIMARY } }}>
                                        <ZoomIn sx={{ fontSize: 16 }} />
                                    </IconButton>
                                    <IconButton size="small" onClick={() => setIframeZoom(z => Math.max(z - 0.1, 0.5))}
                                        sx={{ color: '#94a3b8', '&:hover': { color: PRIMARY } }}>
                                        <ZoomOut sx={{ fontSize: 16 }} />
                                    </IconButton>
                                    <Box sx={{ width: 1, height: 16, bgcolor: '#e2e8f0', mx: 0.5 }} />
                                    <IconButton size="small" onClick={() => window.open(resume.url, '_blank')}
                                        sx={{ color: '#94a3b8', '&:hover': { color: PRIMARY } }}>
                                        <OpenInNew sx={{ fontSize: 16 }} />
                                    </IconButton>
                                    <IconButton size="small" onClick={handleDownload} disabled={!resumeBlobUrl}
                                        sx={{ color: '#94a3b8', '&:hover': { color: PRIMARY } }}>
                                        <Download sx={{ fontSize: 16 }} />
                                    </IconButton>
                                </Box>
                            )}
                        </Box>

                        <Box sx={{ bgcolor: '#f1f5f9', p: 1.5 }}>
                            {!hasResume ? (
                                <Box sx={{
                                    height: 200, display: 'flex', flexDirection: 'column',
                                    alignItems: 'center', justifyContent: 'center', gap: 1,
                                    bgcolor: 'white', borderRadius: '8px', border: '1px dashed #e2e8f0',
                                }}>
                                    <InsertDriveFile sx={{ fontSize: 32, color: '#cbd5e1' }} />
                                    <Typography sx={{ fontSize: '0.8125rem', color: '#94a3b8', fontWeight: 500 }}>
                                        No resume uploaded
                                    </Typography>
                                </Box>
                            ) : resumeLoading ? (
                                <Box sx={{
                                    height: 420, display: 'flex', flexDirection: 'column',
                                    alignItems: 'center', justifyContent: 'center', gap: 2,
                                    bgcolor: 'white', borderRadius: '8px', border: '1px solid #e2e8f0',
                                }}>
                                    <CircularProgress size={28} sx={{ color: PRIMARY }} />
                                    <Typography sx={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                                        Loading resume...
                                    </Typography>
                                </Box>
                            ) : resumeError ? (
                                <Box sx={{
                                    height: 200, display: 'flex', flexDirection: 'column',
                                    alignItems: 'center', justifyContent: 'center', gap: 2,
                                    bgcolor: 'white', borderRadius: '8px', border: '1px dashed #e2e8f0',
                                }}>
                                    <Typography sx={{ fontSize: '0.8rem', color: '#ef4444', fontWeight: 600 }}>
                                        Failed to load resume
                                    </Typography>
                                    <Button size="small" variant="outlined"
                                        onClick={() => window.open(resume.url, '_blank')}
                                        endIcon={<OpenInNew sx={{ fontSize: 14 }} />}
                                        sx={{
                                            textTransform: 'none', fontSize: '0.8rem',
                                            borderColor: PRIMARY, color: PRIMARY, borderRadius: '8px',
                                        }}>
                                        Open in Google Drive
                                    </Button>
                                </Box>
                            ) : resumeBlobUrl ? (
                                <Box sx={{
                                    bgcolor: 'white', borderRadius: '8px',
                                    border: '1px solid #e2e8f0', overflow: 'hidden',
                                    height: 420, position: 'relative',
                                }}>
                                    <iframe
                                        src={resumeBlobUrl}
                                        title="Resume Preview"
                                        style={{
                                            width: `${(1 / iframeZoom) * 100}%`,
                                            height: `${(1 / iframeZoom) * 100}%`,
                                            border: 'none',
                                            transform: `scale(${iframeZoom})`,
                                            transformOrigin: 'top left',
                                            display: 'block',
                                        }}
                                    />
                                </Box>
                            ) : null}
                        </Box>
                    </Paper>
                </Box>

                {/* ═══════ RIGHT PANEL ═══════ */}
                <Paper elevation={0} sx={{
                    borderRadius: '12px', border: '1px solid #e2e8f0',
                    bgcolor: 'white', p: 3, alignSelf: 'start',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3.5 }}>
                        <Box sx={{
                            width: 32, height: 32, borderRadius: '8px',
                            bgcolor: 'rgba(59,78,186,0.1)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                            <Typography sx={{ fontSize: '1rem' }}>📋</Typography>
                        </Box>
                        <Typography sx={{ fontSize: '1.125rem', fontWeight: 800, color: '#0f172a' }}>
                            Hiring Process Journey
                        </Typography>
                        {rounds.length > 0 && (
                            <Box sx={{
                                ml: 'auto', px: 1.5, py: 0.3, borderRadius: '999px',
                                bgcolor: '#f1f5f9', border: '1px solid #e2e8f0',
                                fontSize: '0.75rem', fontWeight: 600, color: '#64748b',
                            }}>
                                {rounds.length} Round{rounds.length !== 1 ? 's' : ''}
                            </Box>
                        )}
                    </Box>

                    {rounds.length === 0 ? (
                        <Box sx={{
                            py: 6, display: 'flex', flexDirection: 'column', alignItems: 'center',
                            bgcolor: '#f8fafc', borderRadius: '10px', border: '1px dashed #e2e8f0', gap: 2,
                        }}>
                            <Typography sx={{ fontSize: '2.5rem' }}>🗓️</Typography>
                            <Box sx={{ textAlign: 'center' }}>
                                <Typography sx={{ fontWeight: 700, color: '#0f172a', fontSize: '0.9375rem', mb: 0.5 }}>
                                    No interview rounds scheduled yet
                                </Typography>
                                <Typography sx={{ color: '#94a3b8', fontSize: '0.8125rem' }}>
                                    Schedule the first interview round to start the hiring process.
                                </Typography>
                            </Box>
                            <Button
                                variant="contained"
                                startIcon={<CalendarMonth sx={{ fontSize: '1rem !important' }} />}
                                onClick={handleScheduleInterview}
                                sx={{
                                    textTransform: 'none', fontWeight: 700, fontSize: '0.875rem',
                                    bgcolor: PRIMARY, borderRadius: '8px', px: 3, py: 1,
                                    boxShadow: '0 4px 14px rgba(59,78,186,0.25)',
                                    '&:hover': { bgcolor: '#2f3faa', transform: 'translateY(-1px)' },
                                    transition: 'all 0.2s',
                                }}
                            >
                                Schedule First Interview
                            </Button>
                        </Box>
                    ) : (
                        <Box>
                            {rounds.map((round, idx) => {
                                const isLast = idx === rounds.length - 1;
                                const roundSt = roundStatusConfig[round.status] || roundStatusConfig.pending;
                                const hasFeedback = round.feedback?.comments || round.feedback?.rating;

                                return (
                                    <Box key={round._id || idx} sx={{ display: 'flex', gap: 2 }}>
                                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', pt: 0.25 }}>
                                            <StepIcon status={round.status} />
                                            {!isLast && (
                                                <Box sx={{
                                                    width: 2, flex: 1, minHeight: 32,
                                                    bgcolor: round.status === 'passed' ? `${GREEN}40` : '#e2e8f0',
                                                    my: 0.5,
                                                }} />
                                            )}
                                        </Box>

                                        <Box sx={{ flex: 1, pb: isLast ? 0 : 3 }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                                                <Box>
                                                    <Typography sx={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a' }}>
                                                        {round.roundName}
                                                    </Typography>
                                                    {round.interviewMode && (
                                                        <Typography sx={{ fontSize: '0.75rem', color: '#94a3b8', mt: 0.25 }}>
                                                            {round.interviewMode}
                                                            {round.interviewLink && (
                                                                <Box component="a" href={round.interviewLink} target="_blank"
                                                                    sx={{ color: PRIMARY, ml: 1, '&:hover': { textDecoration: 'underline' } }}>
                                                                    Join Link ↗
                                                                </Box>
                                                            )}
                                                        </Typography>
                                                    )}
                                                </Box>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    {round.scheduledDate && (
                                                        <Typography sx={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                                                            {formatDate(round.scheduledDate)}
                                                        </Typography>
                                                    )}
                                                    <Box sx={{
                                                        px: 1.25, py: 0.25, borderRadius: '6px',
                                                        bgcolor: roundSt.bg, color: roundSt.color, border: `1px solid ${roundSt.border}`,
                                                        fontSize: '0.65rem', fontWeight: 800, letterSpacing: '0.04em',
                                                    }}>
                                                        {roundSt.label}
                                                    </Box>
                                                </Box>
                                            </Box>

                                            {hasFeedback ? (
                                                <Box sx={{ border: '1px solid #e2e8f0', borderRadius: '10px', p: 2.5, bgcolor: '#fafbff' }}>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                                                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                                                            {round.feedback.rating && (
                                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                                    <StarRating value={round.feedback.rating} />
                                                                    <Typography sx={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>
                                                                        {round.feedback.rating}/5
                                                                    </Typography>
                                                                </Box>
                                                            )}
                                                            {round.feedback.submittedAt && (
                                                                <Typography sx={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                                                                    Submitted {formatDateTime(round.feedback.submittedAt)}
                                                                </Typography>
                                                            )}
                                                        </Box>
                                                        {round.feedback.recommendation && (() => {
                                                            const rec = recommendationConfig[round.feedback.recommendation];
                                                            return rec ? (
                                                                <Box sx={{
                                                                    px: 1.5, py: 0.4, borderRadius: '6px',
                                                                    bgcolor: rec.bg, color: rec.color, border: `1px solid ${rec.border}`,
                                                                    fontSize: '0.7rem', fontWeight: 800, letterSpacing: '0.04em',
                                                                }}>
                                                                    {round.feedback.recommendation.toUpperCase()}
                                                                </Box>
                                                            ) : null;
                                                        })()}
                                                    </Box>
                                                    {round.feedback.comments && (
                                                        <Typography sx={{
                                                            fontSize: '0.8125rem', color: '#475569', fontStyle: 'italic',
                                                            lineHeight: 1.7, borderLeft: `3px solid ${PRIMARY}30`, pl: 1.5,
                                                        }}>
                                                            "{round.feedback.comments}"
                                                        </Typography>
                                                    )}
                                                </Box>

                                            ) : round.scheduledDate ? (
                                                <Box sx={{
                                                    border: '1px dashed #e2e8f0', borderRadius: '10px',
                                                    p: 3, bgcolor: '#f8fafc',
                                                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
                                                }}>
                                                    {!round.notes && !round.tags?.length && (
                                                        <>
                                                            <Typography sx={{ fontSize: '1.5rem' }}>📅</Typography>
                                                            <Typography sx={{ fontSize: '0.8125rem', color: '#64748b', fontWeight: 500, textAlign: 'center' }}>
                                                                Interview scheduled for {formatDateTime(round.scheduledDate)}
                                                            </Typography>
                                                            {round.rescheduledDate && (
                                                                <Typography sx={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                                                                    Rescheduled to: {formatDateTime(round.rescheduledDate)}
                                                                </Typography>
                                                            )}
                                                        </>
                                                    )}

                                                    {(round.notes || round.tags?.length > 0) && (
                                                        <Box sx={{
                                                            width: '100%', p: 2.5, bgcolor: '#fafbff',
                                                            borderRadius: '10px', border: '1px solid #e2e8f0',
                                                        }}>
                                                            {round.notesAddedBy && typeof round.notesAddedBy === 'object' && round.notesAddedBy.firstName && (
                                                                <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
                                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                                                        <Avatar sx={{
                                                                            width: 36, height: 36, fontSize: '0.75rem', fontWeight: 700,
                                                                            bgcolor: `${getAvatarColor(round.notesAddedBy.firstName)}20`,
                                                                            color: getAvatarColor(round.notesAddedBy.firstName),
                                                                            border: `1px solid ${getAvatarColor(round.notesAddedBy.firstName)}30`
                                                                        }}>
                                                                            {round.notesAddedBy.firstName?.[0]}{round.notesAddedBy.lastName?.[0]}
                                                                        </Avatar>
                                                                        <Box>
                                                                            <Typography sx={{ fontSize: '0.875rem', fontWeight: 700, color: '#0f172a' }}>
                                                                                {round.notesAddedBy.firstName} {round.notesAddedBy.lastName}
                                                                            </Typography>
                                                                            <Typography sx={{ fontSize: '0.75rem', color: '#64748b' }}>
                                                                                {round.notesAddedBy.department || 'HR'}
                                                                            </Typography>
                                                                        </Box>
                                                                    </Box>
                                                                    <Box>
                                                                        {round.notesAddedAt && (
                                                                            <Typography sx={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                                                                                {formatDate(round.notesAddedAt)}
                                                                            </Typography>
                                                                        )}
                                                                        {user?.role === 'admin' && (
                                                                            <IconButton size="small"
                                                                                onClick={() => navigate(`${basePath}/candidates/${candidate._id}/rounds/${round._id}/notes`, {
                                                                                    state: { candidate, round }
                                                                                })}
                                                                                sx={{ color: '#94a3b8', p: 0.5, '&:hover': { color: PRIMARY, bgcolor: `${PRIMARY}10` } }}
                                                                            >
                                                                                <Edit sx={{ fontSize: 14 }} />
                                                                            </IconButton>
                                                                        )}
                                                                    </Box>
                                                                </Box>
                                                            )}

                                                            {round.tags?.length > 0 && (
                                                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mb: round.notes ? 1.5 : 0 }}>
                                                                    {round.tags.map(tag => (
                                                                        <Box key={tag} sx={{
                                                                            px: 1.25, py: 0.3, borderRadius: '999px',
                                                                            bgcolor: `${PRIMARY}10`, color: PRIMARY, border: `1px solid ${PRIMARY}25`,
                                                                            fontSize: '0.7rem', fontWeight: 700,
                                                                        }}>
                                                                            {tag}
                                                                        </Box>
                                                                    ))}
                                                                </Box>
                                                            )}

                                                            {round.notes && (
                                                                <Typography sx={{
                                                                    fontSize: '0.8125rem', color: '#475569', fontStyle: 'italic',
                                                                    lineHeight: 1.7, borderLeft: `3px solid ${PRIMARY}30`, pl: 1.5,
                                                                }}>
                                                                    "{round.notes}"
                                                                </Typography>
                                                            )}
                                                        </Box>
                                                    )}

                                                    {/* ── Buttons: only show when no notes ── */}
                                                    {!round.notes && !round.tags?.length && (
                                                        <Box sx={{ display: 'flex', gap: 1.5 }}>
                                                            {/* Add Notes — hidden for Technical Interview */}
                                                            {round.roundName !== 'Technical Interview' && (
                                                                <Button variant="contained" size="small"
                                                                    onClick={() => navigate(
                                                                        `${basePath}/candidates/${candidate._id}/rounds/${round._id}/notes`,
                                                                        { state: { candidate, round } }
                                                                    )}
                                                                    sx={{
                                                                        bgcolor: PRIMARY, textTransform: 'none', fontWeight: 700,
                                                                        fontSize: '0.8125rem', borderRadius: '8px',
                                                                        '&:hover': { bgcolor: '#2f3faa' },
                                                                    }}>
                                                                    Add Notes
                                                                </Button>
                                                            )}
                                                            <Button variant="outlined" size="small"
                                                                onClick={() => openReschedule(round)}
                                                                sx={{
                                                                    borderColor: '#e2e8f0', color: '#374151',
                                                                    textTransform: 'none', fontWeight: 600,
                                                                    fontSize: '0.8125rem', borderRadius: '8px',
                                                                    '&:hover': { borderColor: '#cbd5e1', bgcolor: '#f8fafc' },
                                                                }}>
                                                                Reschedule
                                                            </Button>
                                                        </Box>
                                                    )}
                                                </Box>

                                            ) : (
                                                <Box sx={{
                                                    border: '1px dashed #e2e8f0', borderRadius: '10px',
                                                    p: 2, bgcolor: '#f8fafc',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                }}>
                                                    <Typography sx={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                                                        Not yet scheduled
                                                    </Typography>
                                                </Box>
                                            )}

                                            {/* Schedule next round */}
                                            {isLast && (round.notes || round.tags?.length > 0 || round.roundName === 'Technical Interview' || hasFeedback) && (
                                                <Button
                                                    variant='outlined'
                                                    startIcon={<CalendarMonth sx={{ fontSize: '1rem !important' }} />}
                                                    onClick={handleScheduleInterview}
                                                    sx={{
                                                        mt: 1.5,
                                                        textTransform: 'none', fontWeight: 600, fontSize: '0.875rem',
                                                        borderColor: PRIMARY, color: PRIMARY, borderRadius: '8px',
                                                        px: 3, py: 0.875,
                                                        '&:hover': { bgcolor: `${PRIMARY}08`, borderColor: PRIMARY },
                                                    }}>
                                                    Schedule Next Round
                                                </Button>
                                            )}

                                        </Box>
                                    </Box>
                                );
                            })}
                        </Box>
                    )}
                </Paper>
            </Box>

            {/* ══════════════════════════════════════════════════════════
                RESCHEDULE MODAL
            ══════════════════════════════════════════════════════════ */}
            <Dialog
                open={rescheduleModal.open}
                onClose={() => setRescheduleModal({ open: false, round: null })}
                PaperProps={{ sx: { borderRadius: '16px', maxWidth: 480, width: '100%' } }}
            >
                <DialogTitle sx={{ fontWeight: 800, fontSize: '1.125rem', color: '#0f172a', pb: 1 }}>
                    Reschedule Interview
                    <Typography sx={{ fontSize: '0.8125rem', color: '#64748b', fontWeight: 400, mt: 0.25 }}>
                        {rescheduleModal.round?.roundName}
                    </Typography>
                </DialogTitle>
                <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: '8px !important' }}>

                    {/* Date & Time */}
                    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                        <Box>
                            <Typography sx={{ fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#94a3b8', mb: 1 }}>
                                Date
                            </Typography>
                            <TextField fullWidth size="small" type="date"
                                value={rescheduleForm.date}
                                onChange={e => setRescheduleForm(p => ({ ...p, date: e.target.value }))}
                                inputProps={{ min: new Date().toISOString().split('T')[0] }}
                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px', fontSize: '0.875rem', bgcolor: '#f8fafc', '& fieldset': { borderColor: '#e2e8f0' }, '&:hover fieldset': { borderColor: PRIMARY }, '&.Mui-focused fieldset': { borderColor: PRIMARY } } }}
                            />
                        </Box>
                        <Box>
                            <Typography sx={{ fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#94a3b8', mb: 1 }}>
                                Time Slot
                            </Typography>
                            <TextField fullWidth size="small" select
                                value={rescheduleForm.timeSlot}
                                onChange={e => setRescheduleForm(p => ({ ...p, timeSlot: e.target.value }))}
                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px', fontSize: '0.875rem', bgcolor: '#f8fafc', '& fieldset': { borderColor: '#e2e8f0' }, '&:hover fieldset': { borderColor: PRIMARY }, '&.Mui-focused fieldset': { borderColor: PRIMARY } } }}
                            >
                                {TIME_SLOTS.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                            </TextField>
                        </Box>
                    </Box>

                    {/* Mode */}
                    <Box>
                        <Typography sx={{ fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#94a3b8', mb: 1 }}>
                            Interview Mode
                        </Typography>
                        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
                            {['Remote', 'In-office'].map(mode => (
                                <Box key={mode} onClick={() => setRescheduleForm(p => ({ ...p, mode }))}
                                    sx={{
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1,
                                        py: 1, borderRadius: '10px', cursor: 'pointer', transition: 'all 0.15s',
                                        border: `2px solid ${rescheduleForm.mode === mode ? PRIMARY : '#e2e8f0'}`,
                                        bgcolor: rescheduleForm.mode === mode ? `${PRIMARY}08` : 'white',
                                        color: rescheduleForm.mode === mode ? PRIMARY : '#64748b',
                                        '&:hover': { borderColor: PRIMARY, color: PRIMARY },
                                    }}>
                                    {mode === 'Remote' ? <Videocam sx={{ fontSize: 18 }} /> : <Business sx={{ fontSize: 18 }} />}
                                    <Typography sx={{ fontSize: '0.875rem', fontWeight: 600 }}>{mode}</Typography>
                                </Box>
                            ))}
                        </Box>
                    </Box>

                    {/* Meeting link or office */}
                    {rescheduleForm.mode === 'Remote' ? (
                        <TextField fullWidth size="small" placeholder="https://meet.google.com/..."
                            value={rescheduleForm.meetingLink}
                            onChange={e => setRescheduleForm(p => ({ ...p, meetingLink: e.target.value }))}
                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px', fontSize: '0.875rem', bgcolor: '#f8fafc', '& fieldset': { borderColor: '#e2e8f0' }, '&:hover fieldset': { borderColor: PRIMARY }, '&.Mui-focused fieldset': { borderColor: PRIMARY } } }}
                        />
                    ) : (
                        <TextField fullWidth size="small" placeholder="e.g. Conference Room A, 3rd Floor"
                            value={rescheduleForm.officeLocation}
                            onChange={e => setRescheduleForm(p => ({ ...p, officeLocation: e.target.value }))}
                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px', fontSize: '0.875rem', bgcolor: '#f8fafc', '& fieldset': { borderColor: '#e2e8f0' }, '&:hover fieldset': { borderColor: PRIMARY }, '&.Mui-focused fieldset': { borderColor: PRIMARY } } }}
                        />
                    )}

                    {/* Interviewers */}
                    <Box>
                        <Typography sx={{ fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#94a3b8', mb: 1 }}>
                            Interviewers
                        </Typography>
                        <Box sx={{
                            minHeight: 48, px: 1.5, py: 1, borderRadius: '8px',
                            border: '1px solid #e2e8f0', bgcolor: '#f8fafc',
                            display: 'flex', flexWrap: 'wrap', gap: 0.75, alignItems: 'center',
                            '&:focus-within': { borderColor: PRIMARY },
                        }}>
                            {rescheduleInterviewers.map(iv => (
                                <Box key={iv._id} sx={{
                                    display: 'flex', alignItems: 'center', gap: 0.75,
                                    px: 1.25, py: 0.4, borderRadius: '999px',
                                    bgcolor: `${PRIMARY}10`, border: `1px solid ${PRIMARY}20`,
                                }}>
                                    <Avatar sx={{
                                        width: 18, height: 18, fontSize: '0.55rem', fontWeight: 700,
                                        bgcolor: `${getAvatarColor(iv.firstName)}20`,
                                        color: getAvatarColor(iv.firstName),
                                    }}>
                                        {iv.firstName?.[0]}{iv.lastName?.[0]}
                                    </Avatar>
                                    <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: PRIMARY }}>
                                        {iv.firstName} {iv.lastName}
                                    </Typography>
                                    <Box onClick={() => setRescheduleInterviewers(p => p.filter(i => i._id !== iv._id))}
                                        sx={{ display: 'flex', cursor: 'pointer', color: PRIMARY, opacity: 0.7, '&:hover': { opacity: 1 } }}>
                                        <Close sx={{ fontSize: 13 }} />
                                    </Box>
                                </Box>
                            ))}
                            <Box sx={{ flex: 1, minWidth: 120, position: 'relative' }}>
                                <Box component="input"
                                    value={rescheduleInterviewerInput}
                                    onChange={e => setRescheduleInterviewerInput(e.target.value)}
                                    placeholder={rescheduleInterviewers.length === 0 ? 'Search interviewers...' : 'Add more...'}
                                    autoComplete="off"
                                    sx={{
                                        width: '100%', border: 'none', outline: 'none',
                                        fontSize: '0.875rem', bgcolor: 'transparent', color: '#374151',
                                        '&::placeholder': { color: '#94a3b8' },
                                    }}
                                />
                                {rescheduleInterviewerInput && (
                                    <Paper elevation={4} sx={{
                                        position: 'absolute', top: '100%', left: 0, right: 0,
                                        mt: 0.5, borderRadius: '8px', zIndex: 100,
                                        border: '1px solid #e2e8f0', maxHeight: 180, overflow: 'auto',
                                    }}>
                                        {interviewerOptions
                                            .filter(iv =>
                                                `${iv.firstName} ${iv.lastName}`.toLowerCase().includes(rescheduleInterviewerInput.toLowerCase()) &&
                                                !rescheduleInterviewers.find(s => s._id === iv._id)
                                            )
                                            .map(iv => (
                                                <Box key={iv._id}
                                                    onMouseDown={() => {
                                                        setRescheduleInterviewers(p => [...p, iv]);
                                                        setRescheduleInterviewerInput('');
                                                    }}
                                                    sx={{
                                                        display: 'flex', alignItems: 'center', gap: 1.5,
                                                        px: 2, py: 1, cursor: 'pointer',
                                                        '&:hover': { bgcolor: `${PRIMARY}05` },
                                                        borderBottom: '1px solid #f1f5f9',
                                                    }}>
                                                    <Avatar sx={{
                                                        width: 26, height: 26, fontSize: '0.6rem', fontWeight: 700,
                                                        bgcolor: `${getAvatarColor(iv.firstName)}20`,
                                                        color: getAvatarColor(iv.firstName),
                                                    }}>
                                                        {iv.firstName?.[0]}{iv.lastName?.[0]}
                                                    </Avatar>
                                                    <Box>
                                                        <Typography sx={{ fontSize: '0.8125rem', fontWeight: 600, color: '#0f172a' }}>
                                                            {iv.firstName} {iv.lastName}
                                                        </Typography>
                                                        <Typography sx={{ fontSize: '0.7rem', color: '#94a3b8' }}>{iv.email}</Typography>
                                                    </Box>
                                                </Box>
                                            ))}
                                    </Paper>
                                )}
                            </Box>
                        </Box>
                    </Box>

                    {rescheduleError && (
                        <Box sx={{ p: 1.5, bgcolor: '#fff1f2', borderRadius: '8px', border: '1px solid #fecdd3' }}>
                            <Typography sx={{ fontSize: '0.8125rem', color: '#be123c' }}>{rescheduleError}</Typography>
                        </Box>
                    )}

                    {/* Footer */}
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, pt: 1 }}>
                        <Button onClick={() => setRescheduleModal({ open: false, round: null })}
                            sx={{ textTransform: 'none', color: '#64748b', fontWeight: 600, borderRadius: '8px', '&:hover': { bgcolor: '#f1f5f9' } }}>
                            Cancel
                        </Button>
                        <Button variant="contained" onClick={handleReschedule} disabled={rescheduleLoading}
                            sx={{ textTransform: 'none', fontWeight: 700, borderRadius: '8px', bgcolor: PRIMARY, '&:hover': { bgcolor: '#2f3da0' } }}>
                            {rescheduleLoading ? <CircularProgress size={18} sx={{ color: 'white' }} /> : 'Confirm Reschedule'}
                        </Button>
                    </Box>
                </DialogContent>
            </Dialog>

        </Box>
    );
};

export default CandidateProfile;