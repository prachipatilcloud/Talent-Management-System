import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import API from '../../api/axios';
import {
    Box, Typography, Button, Avatar, IconButton,
    CircularProgress, Divider, Paper,
    Dialog, DialogContent, DialogTitle, MenuItem, TextField,
    LinearProgress, Stack
} from '@mui/material';
import {
    ArrowBack, Email, Phone,
    Download, ZoomIn, ZoomOut,
    CheckCircle, Cancel,
    Star, StarHalf, StarBorder,
    OpenInNew, InsertDriveFile, CalendarMonth,
    Edit, Videocam, Business, Close,
    GitHub, LinkedIn, Language,
    MoreHoriz, Lock,
    Description, Archive as ArchiveIcon,
    ChevronRight, PlayArrow
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';

// ── Constants & Config ───────────────────────────────────────────
const PRIMARY = '#3b4eba';
const SECONDARY = '#2f3faa';
const SUCCESS = '#059669';
const DANGER = '#dc2626';
const NEUTRAL = '#64748b';

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
    pending: { bg: '#f1f5f9', color: '#64748b', border: '#e2e8f0', label: 'PENDING' },
    passed: { bg: '#f0fdf4', color: '#15803d', border: '#bbf7d0', label: 'PASSED' },
    rejected: { bg: '#fff1f2', color: '#be123c', border: '#fecdd3', label: 'REJECTED' },
};

const recommendationConfig = {
    'Hire': { bg: '#f0fdf4', color: '#15803d', border: '#bbf7d0', label: 'HIRE' },
    'No Hire': { bg: '#fff1f2', color: '#be123c', border: '#fecdd3', label: 'NO HIRE' },
    'Maybe': { bg: '#fefce8', color: '#a16207', border: '#fef08a', label: 'MAYBE' },
    'Hire - Strong': { bg: '#f0fdf4', color: '#15803d', border: '#bbf7d0', label: 'HIRE - STRONG' },
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

// ── Components ───────────────────────────────────────────────────

const StatusBadge = ({ label, config }) => (
    <Box sx={{
        px: 1.25, py: 0.4, borderRadius: '6px',
        bgcolor: config?.bg || '#f1f5f9',
        color: config?.color || '#475569',
        border: `1px solid ${config?.border || '#e2e8f0'}`,
        fontSize: '0.65rem', fontWeight: 800, letterSpacing: '0.04em',
        textTransform: 'uppercase'
    }}>
        {label}
    </Box>
);

const SectionHeader = ({ icon, title, badge }) => (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2.5 }}>
        <Box sx={{
            width: 32, height: 32, borderRadius: '8px',
            bgcolor: 'rgba(59,78,186,0.1)', color: PRIMARY,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
            {icon}
        </Box>
        <Typography sx={{ fontSize: '0.875rem', fontWeight: 800, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            {title}
        </Typography>
        {badge && (
            <Box sx={{
                ml: 'auto', px: 1, py: 0.2, borderRadius: '4px',
                bgcolor: '#f1f5f9', color: '#64748b', fontSize: '0.625rem', fontWeight: 700
            }}>
                {badge}
            </Box>
        )}
    </Box>
);

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

    useEffect(() => {
        API.get('/users?role=interviewer&limit=100')
            .then(res => setInterviewerOptions(res.data.data || []))
            .catch(() => setInterviewerOptions([]));
    }, []);

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

    const handleScheduleNextRound = () => {
        const lastRound = candidate?.interviewRounds?.[candidate.interviewRounds.length - 1];
        navigate(`${basePath}/candidates/${id}/schedule-interview`, {
            state: { candidate, lastRoundName: lastRound?.roundName || null },
        });
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
    };

    const openReschedule = (round) => {
        setRescheduleModal({ open: true, round });
        setRescheduleForm({
            date: round.scheduledDate ? new Date(round.scheduledDate).toISOString().split('T')[0] : '',
            timeSlot: '10:00 AM - 11:00 AM',
            mode: round.interviewMode || 'In-office',
            meetingLink: round.interviewLink || '',
            officeLocation: round.officeLocation || '',
        });
        setRescheduleInterviewers(Array.isArray(round.interviewers) ? round.interviewers.filter(i => typeof i === 'object') : []);
        setRescheduleError('');
    };

    const handleReschedule = async () => {
        if (!rescheduleForm.date) { setRescheduleError('Please select a date'); return; }
        setRescheduleLoading(true);
        try {
            const res = await API.patch(`/candidates/${candidate._id}/rounds/${rescheduleModal.round._id}/reschedule`, {
                scheduledDate: `${rescheduleForm.date} ${rescheduleForm.timeSlot.split(' - ')[0]}`,
                interviewMode: rescheduleForm.mode,
                interviewLink: rescheduleForm.mode === 'Remote' ? rescheduleForm.meetingLink : undefined,
                officeLocation: rescheduleForm.mode === 'In-office' ? rescheduleForm.officeLocation : undefined,
                interviewers: rescheduleInterviewers.map(i => i._id),
            });
            setCandidate(res.data.candidate);
            setRescheduleModal({ open: false, round: null });
        } catch (err) {
            setRescheduleError(err.response?.data?.message || 'Failed to reschedule.');
        } finally {
            setRescheduleLoading(false);
        }
    };

    if (loading) return (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', bgcolor: '#f8fafc' }}>
            <CircularProgress sx={{ color: PRIMARY }} />
        </Box>
    );

    if (error || !candidate) return (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', gap: 2, bgcolor: '#f8fafc' }}>
            <Typography sx={{ color: DANGER, fontWeight: 700 }}>{error || 'Candidate not found'}</Typography>
            <Button onClick={() => navigate(`${basePath}/candidates`)} startIcon={<ArrowBack />} sx={{ textTransform: 'none', color: PRIMARY }}>
                Back to Candidates
            </Button>
        </Box>
    );

    const initials = `${candidate.firstName?.[0] || ''}${candidate.lastName?.[0] || ''}`.toUpperCase();
    const avatarBg = getAvatarColor(candidate.firstName);
    const appId = `#${String(candidate._id).slice(-5).toUpperCase()}`;
    const rounds = candidate.interviewRounds || [];
    const hasResume = !!candidate.resume?.driveFileId;

    return (
        <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column', bgcolor: '#f8fafc', overflow: 'hidden' }}>

            {/* ── TOP BAR ── */}
            <Box sx={{
                height: 64, bgcolor: 'white', borderBottom: '1px solid #e2e8f0',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 3, zIndex: 10,
            }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <IconButton size="small" onClick={() => navigate(`${basePath}/candidates`)} sx={{ color: NEUTRAL }}>
                        <ArrowBack fontSize="small" />
                    </IconButton>
                    <Typography sx={{ fontWeight: 800, color: '#0f172a', fontSize: '1rem' }}>Candidate Profile</Typography>
                    <Box sx={{
                        px: 1.5, py: 0.4, borderRadius: '6px', bgcolor: 'rgba(59,78,186,0.08)',
                        border: '1px solid rgba(59,78,186,0.15)', fontSize: '0.7rem', fontWeight: 700, color: PRIMARY
                    }}>
                        Application ID: {appId}
                    </Box>
                </Box>

                <Box sx={{ display: 'flex', gap: 1.5 }}>
                    <Button variant="outlined" startIcon={<ArchiveIcon sx={{ fontSize: 18 }} />}
                        sx={{
                            textTransform: 'none', fontWeight: 700, borderColor: '#e2e8f0', color: '#475569',
                            px: 2.5, borderRadius: '8px', '&:hover': { bgcolor: '#f8fafc', borderColor: '#cbd5e1' }
                        }}>
                        Archive
                    </Button>
                    <Button
                        variant="contained"
                        onClick={handleReject}
                        disabled={rejectLoading || candidate.status === 'Rejected'}
                        sx={{
                            textTransform: 'none', fontWeight: 700, bgcolor: DANGER, px: 2.5, borderRadius: '8px',
                            boxShadow: 'none', '&:hover': { bgcolor: '#b91c1c', boxShadow: 'none' }
                        }}>
                        {rejectLoading ? <CircularProgress size={20} color="inherit" /> : 'Reject'}
                    </Button>
                    <Button
                        variant="contained"
                        onClick={handleScheduleNextRound}
                        endIcon={<ChevronRight />}
                        sx={{
                            textTransform: 'none', fontWeight: 700, bgcolor: PRIMARY, px: 2.5, borderRadius: '8px',
                            boxShadow: 'none', '&:hover': { bgcolor: SECONDARY, boxShadow: 'none' }
                        }}>
                        Move to Next Stage
                    </Button>
                </Box>
            </Box>

            {/* ── BODY ── */}
            <Box sx={{ flex: 1, overflow: 'auto', p: 3 }}>
                <Box sx={{ display: 'grid', gridTemplateColumns: 'minmax(360px, 400px) 1fr', gap: 3, maxWidth: 1440, mx: 'auto' }}>

                    {/* ═══════ LEFT COLUMN (INFO) ═══════ */}
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>

                        {/* Profile Info Card */}
                        <Paper elevation={0} sx={{ p: 3, borderRadius: '16px', border: '1px solid #e2e8f0', bgcolor: 'white' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5, mb: 2.5 }}>
                                <Avatar sx={{
                                    width: 80, height: 80, borderRadius: '16px', bgcolor: `${avatarBg}15`,
                                    color: avatarBg, fontSize: '2rem', fontWeight: 900, border: `1px solid ${avatarBg}30`
                                }}>
                                    {initials}
                                </Avatar>
                                <Box>
                                    <Typography sx={{ fontSize: '1.25rem', fontWeight: 900, color: '#0f172a', lineHeight: 1.2 }}>
                                        {candidate.firstName} {candidate.lastName}
                                    </Typography>
                                    <Typography sx={{ fontSize: '0.8125rem', color: PRIMARY, fontWeight: 700, mt: 0.5, textTransform: 'uppercase', letterSpacing: '0.02em' }}>
                                        {candidate.jobRole}
                                    </Typography>
                                    <Box sx={{ display: 'flex', gap: 1, mt: 1.5 }}>
                                        {candidate.linkedin && (
                                            <IconButton size="small" component="a" href={candidate.linkedin} target="_blank" sx={{ p: 0.5, color: '#0077b5', '&:hover': { bgcolor: '#0077b510' } }}>
                                                <LinkedIn sx={{ fontSize: 18 }} />
                                            </IconButton>
                                        )}
                                        {candidate.github && (
                                            <IconButton size="small" component="a" href={candidate.github} target="_blank" sx={{ p: 0.5, color: '#181717', '&:hover': { bgcolor: '#18171710' } }}>
                                                <GitHub sx={{ fontSize: 18 }} />
                                            </IconButton>
                                        )}
                                        {candidate.portfolio && (
                                            <IconButton size="small" component="a" href={candidate.portfolio} target="_blank" sx={{ p: 0.5, color: PRIMARY, '&:hover': { bgcolor: `${PRIMARY}10` } }}>
                                                <Language sx={{ fontSize: 18 }} />
                                            </IconButton>
                                        )}
                                    </Box>
                                </Box>
                            </Box>

                            <Stack spacing={1.5} sx={{ bgcolor: '#f8fafc', p: 2, borderRadius: '12px', border: '1px solid #f1f5f9' }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                    <Email sx={{ fontSize: 16, color: '#64748b' }} />
                                    <Typography sx={{ fontSize: '0.8125rem', color: '#475569', fontWeight: 500 }}>{candidate.email}</Typography>
                                </Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                    <Phone sx={{ fontSize: 16, color: '#64748b' }} />
                                    <Typography sx={{ fontSize: '0.8125rem', color: '#475569', fontWeight: 500 }}>{candidate.phone || '+1 (555) 000-0000'}</Typography>
                                </Box>
                            </Stack>
                        </Paper>

                        {/* Professional Background */}
                        <Paper elevation={0} sx={{ p: 3, borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                            <SectionHeader icon={<Business fontSize="small" />} title="Professional Background" />
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                                {(candidate.parsedResumeData?.aiExtractedExperience || []).map((exp, idx, arr) => (
                                    <Box key={idx} sx={{ display: 'flex', gap: 2 }}>
                                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: PRIMARY, mt: 1 }} />
                                            {idx !== arr.length - 1 && <Box sx={{ flex: 1, width: 2, bgcolor: '#e2e8f0', my: 0.5 }} />}
                                        </Box>
                                        <Box sx={{ pb: idx !== arr.length - 1 ? 3 : 0 }}>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                                                <Typography sx={{ fontSize: '0.875rem', fontWeight: 800, color: '#0f172a' }}>{exp.role}</Typography>
                                                <Typography sx={{ fontSize: '0.6875rem', fontWeight: 700, color: '#94a3b8' }}>{exp.duration}</Typography>
                                            </Box>
                                            <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: PRIMARY, mb: 1 }}>{exp.company}</Typography>
                                            <Typography sx={{ fontSize: '0.75rem', color: '#64748b', lineHeight: 1.6 }}>{exp.description}</Typography>
                                        </Box>
                                    </Box>
                                ))}
                            </Box>
                        </Paper>

                        {/* Key Projects */}
                        <Paper elevation={0} sx={{ p: 3, borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                            <SectionHeader icon={<PlayArrow fontSize="small" />} title="Key Projects" />
                            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
                                {(candidate.parsedResumeData?.aiExtractedProjects || []).map((proj, idx) => (
                                    <Box key={idx} sx={{ p: 2, bgcolor: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                                        <Typography sx={{ fontSize: '0.8125rem', fontWeight: 800, color: '#0f172a', mb: 0.5 }}>{proj.name}</Typography>
                                        <Typography sx={{ fontSize: '0.7rem', color: '#64748b', mb: 1.5, height: 32, overflow: 'hidden' }}>{proj.description}</Typography>
                                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                            {(proj.tags || proj.skills_used || []).map(tag => (
                                                <Box key={tag} sx={{ px: 1, py: 0.2, borderRadius: '4px', bgcolor: 'white', border: '1px solid #e2e8f0', fontSize: '0.6rem', fontWeight: 600, color: '#475569' }}>
                                                    {tag}
                                                </Box>
                                            ))}
                                        </Box>
                                    </Box>
                                ))}
                            </Box>
                        </Paper>

                        {/* Resume Preview */}
                        <Paper elevation={0} sx={{ borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                            <Box sx={{ px: 2.5, py: 2, bgcolor: '#fafafa', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                    <Box sx={{ width: 32, height: 32, borderRadius: '6px', bgcolor: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <Description sx={{ fontSize: 18, color: DANGER }} />
                                    </Box>
                                    <Typography sx={{ fontSize: '0.8125rem', fontWeight: 800, color: '#0f172a' }}>
                                        {hasResume ? candidate.resume.fileName : 'No Resume uploaded'}
                                    </Typography>
                                </Box>
                                {hasResume && (
                                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                                        <IconButton size="small" onClick={() => setIframeZoom(z => Math.max(0.5, z - 0.1))}> <ZoomOut fontSize="inherit" /> </IconButton>
                                        <IconButton size="small" onClick={() => setIframeZoom(z => Math.min(1.5, z + 0.1))}> <ZoomIn fontSize="inherit" /> </IconButton>
                                        <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />
                                        <IconButton size="small" onClick={handleDownload} disabled={!resumeBlobUrl}> <Download fontSize="inherit" /> </IconButton>
                                    </Box>
                                )}
                            </Box>
                            <Box sx={{ height: 400, bgcolor: '#f1f5f9', p: 1.5 }}>
                                {resumeLoading ? (
                                    <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}> <CircularProgress size={24} /> </Box>
                                ) : resumeBlobUrl ? (
                                    <Box sx={{ height: '100%', bgcolor: 'white', borderRadius: '8px', border: '1px solid #e2e8f0', overflow: 'hidden', position: 'relative' }}>
                                        <iframe src={resumeBlobUrl} title="Resume Preview" style={{
                                            width: `${(1 / iframeZoom) * 100}%`, height: `${(1 / iframeZoom) * 100}%`,
                                            border: 'none', transform: `scale(${iframeZoom})`, transformOrigin: 'top left', display: 'block'
                                        }} />
                                    </Box>
                                ) : (
                                    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 1, bgcolor: 'white', borderRadius: '8px', border: '1px dashed #e2e8f0' }}>
                                        <Description sx={{ fontSize: 32, color: '#cbd5e1' }} />
                                        <Typography sx={{ fontSize: '0.8125rem', color: '#94a3b8' }}>Preview not available</Typography>
                                    </Box>
                                )}
                            </Box>
                        </Paper>
                    </Box>

                    {/* ═══════ RIGHT COLUMN (JOURNEY) ═══════ */}
                    <Box>
                        <Paper elevation={0} sx={{ p: 4, borderRadius: '16px', border: '1px solid #e2e8f0', minHeight: '100%' }}>
                            <SectionHeader icon={<CalendarMonth fontSize="small" />} title="Hiring Process Journey" />

                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                                {(rounds.length > 0 ? rounds : []).map((round, idx, arr) => {
                                    const isLast = idx === arr.length - 1;
                                    const isPassed = round.status === 'passed';
                                    const isRejected = round.status === 'rejected';
                                    const isActive = round.status === 'pending' || (idx === 0 && rounds.every(r => r.status === 'pending'));
                                    const hasFeedback = round.feedback?.rating || round.feedback?.comments;

                                    return (
                                        <Box key={round._id || idx} sx={{ display: 'flex', gap: 3 }}>
                                            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', pt: 0.5 }}>
                                                {isPassed ? (
                                                    <CheckCircle sx={{ fontSize: 24, color: SUCCESS }} />
                                                ) : isRejected ? (
                                                    <Cancel sx={{ fontSize: 24, color: DANGER }} />
                                                ) : isActive ? (
                                                    <Box sx={{ width: 24, height: 24, borderRadius: '50%', bgcolor: '#3b4eba', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                        <MoreHoriz sx={{ fontSize: 16, color: 'white' }} />
                                                    </Box>
                                                ) : (
                                                    <Lock sx={{ fontSize: 24, color: '#94a3b8' }} />
                                                )}
                                                {!isLast && <Box sx={{ flex: 1, width: 2, bgcolor: isPassed ? `${SUCCESS}40` : '#e2e8f0', my: 1 }} />}
                                            </Box>

                                            <Box sx={{ flex: 1, pb: 5 }}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                                                    <Typography sx={{ fontSize: '1.125rem', fontWeight: 800, color: isPassed || isActive ? '#0f172a' : '#94a3b8' }}>
                                                        {round.roundName}
                                                    </Typography>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                                        {round.scheduledDate && (
                                                            <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8' }}>
                                                                {formatDate(round.scheduledDate).toUpperCase()}
                                                            </Typography>
                                                        )}
                                                        {isActive && <StatusBadge label="IN PROGRESS" config={{ bg: 'rgba(59,78,186,0.1)', color: '#3b4eba', border: 'rgba(59,78,186,0.2)' }} />}
                                                    </Box>
                                                </Box>

                                                {hasFeedback && (
                                                    <Box sx={{ p: 3, bgcolor: '#f8fafc', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                                                        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
                                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                                                <Avatar sx={{
                                                                    width: 36, height: 36, fontSize: '0.875rem', fontWeight: 800,
                                                                    bgcolor: `${getAvatarColor(round.notesAddedBy?.firstName || 'I')}20`,
                                                                    color: getAvatarColor(round.notesAddedBy?.firstName || 'I')
                                                                }}>
                                                                    {round.notesAddedBy ? `${round.notesAddedBy.firstName?.[0] || ''}${round.notesAddedBy.lastName?.[0] || ''}` : 'I'}
                                                                </Avatar>
                                                                <Box>
                                                                    <Typography sx={{ fontSize: '0.875rem', fontWeight: 800, color: '#0f172a' }}>
                                                                        {round.notesAddedBy ? `${round.notesAddedBy.firstName} ${round.notesAddedBy.lastName}` : 'Interviewer'}
                                                                    </Typography>
                                                                    <Typography sx={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 500 }}>
                                                                        {round.notesAddedBy?.department || 'Technical Panel'}
                                                                    </Typography>
                                                                </Box>
                                                            </Box>
                                                            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 0.5 }}>
                                                                {round.feedback?.rating && <StarRating value={round.feedback.rating} />}
                                                                {round.feedback?.recommendation && (
                                                                    <Typography sx={{
                                                                        px: 1, py: 0.2, borderRadius: '4px', fontSize: '0.625rem', fontWeight: 900,
                                                                        bgcolor: recommendationConfig[round.feedback.recommendation]?.bg || SUCCESS + '10',
                                                                        color: recommendationConfig[round.feedback.recommendation]?.color || SUCCESS,
                                                                        letterSpacing: '0.05em'
                                                                    }}>
                                                                        {round.feedback.recommendation.toUpperCase()}
                                                                    </Typography>
                                                                )}
                                                            </Box>
                                                        </Box>

                                                        {/* Sub-scores (Architecture/Testing bars as in image) */}
                                                        {round.roundName === 'Technical Interview' && round.feedback?.rating && (
                                                            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3, mb: 2 }}>
                                                                <Box>
                                                                    <Typography sx={{ fontSize: '0.625rem', fontWeight: 800, color: '#94a3b8', mb: 0.5, textTransform: 'uppercase' }}>Architecture</Typography>
                                                                    <LinearProgress variant="determinate" value={round.feedback.rating * 15 + 10} sx={{ height: 4, borderRadius: 2, bgcolor: '#e2e8f0', '& .MuiLinearProgress-bar': { bgcolor: PRIMARY } }} />
                                                                </Box>
                                                                <Box>
                                                                    <Typography sx={{ fontSize: '0.625rem', fontWeight: 800, color: '#94a3b8', mb: 0.5, textTransform: 'uppercase' }}>Testing</Typography>
                                                                    <LinearProgress variant="determinate" value={round.feedback.rating * 12 + 20} sx={{ height: 4, borderRadius: 2, bgcolor: '#e2e8f0', '& .MuiLinearProgress-bar': { bgcolor: PRIMARY } }} />
                                                                </Box>
                                                            </Box>
                                                        )}

                                                        {(round.notes || round.feedback?.comments) && (
                                                            <Typography sx={{ fontSize: '0.875rem', color: '#475569', fontStyle: 'italic', lineHeight: 1.6 }}>
                                                                "{round.notes || round.feedback.comments}"
                                                            </Typography>
                                                        )}
                                                    </Box>
                                                )}

                                                {isActive && (
                                                    <Box sx={{ p: 4, bgcolor: 'white', borderRadius: '16px', border: '1px dashed #cbd5e1', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                                                        <Box sx={{ p: 1.5, borderRadius: '50%', bgcolor: '#f1f5f9' }}>
                                                            <Description sx={{ fontSize: 24, color: '#94a3b8' }} />
                                                        </Box>
                                                        <Typography sx={{ fontSize: '0.875rem', color: '#64748b', textAlign: 'center' }}>
                                                            {round.scheduledDate ? `Interview scheduled for ${formatDateTime(round.scheduledDate)}` : 'Interview round to be scheduled'}
                                                        </Typography>
                                                        <Box sx={{ display: 'flex', gap: 1.5 }}>
                                                            <Button
                                                                variant="contained"
                                                                onClick={() => navigate(`${basePath}/candidates/${id}/rounds/${round._id}/notes`, { state: { candidate, round } })}
                                                                sx={{ textTransform: 'none', fontWeight: 700, bgcolor: PRIMARY, color: 'white', px: 3, borderRadius: '8px', boxShadow: 'none', '&:hover': { bgcolor: SECONDARY, boxShadow: 'none' } }}>
                                                                Add Preliminary Notes
                                                            </Button>
                                                            <Button
                                                                variant="outlined"
                                                                onClick={() => openReschedule(round)}
                                                                sx={{ textTransform: 'none', fontWeight: 700, borderColor: '#e2e8f0', color: '#475569', px: 3, borderRadius: '8px', '&:hover': { bgcolor: '#f8fafc', borderColor: '#cbd5e1' } }}>
                                                                Reschedule
                                                            </Button>
                                                        </Box>
                                                    </Box>
                                                )}

                                                {!isActive && !isPassed && !isRejected && (
                                                    <Box sx={{ py: 1 }}>
                                                        <Typography sx={{ fontSize: '0.8125rem', color: '#94a3b8', fontWeight: 500 }}>
                                                            Status: Locked until previous steps complete
                                                        </Typography>
                                                    </Box>
                                                )}
                                            </Box>
                                        </Box>
                                    );
                                })}
                            </Box>
                        </Paper>
                    </Box>
                </Box>
            </Box>

            {/* ── RESCHEDULE MODAL ── */}
            <Dialog open={rescheduleModal.open} onClose={() => setRescheduleModal({ open: false, round: null })} PaperProps={{ sx: { borderRadius: '16px', maxWidth: 480, width: '100%' } }}>
                <DialogTitle sx={{ fontWeight: 900, fontSize: '1.25rem', color: '#0f172a', pb: 1 }}>
                    Reschedule Interview
                    <Typography sx={{ fontSize: '0.875rem', color: '#64748b', fontWeight: 600, mt: 0.5 }}>{rescheduleModal.round?.roundName}</Typography>
                </DialogTitle>
                <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: '16px !important' }}>
                    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                        <TextField fullWidth label="Date" type="date" size="small" InputLabelProps={{ shrink: true }} value={rescheduleForm.date} onChange={e => setRescheduleForm(p => ({ ...p, date: e.target.value }))} />
                        <TextField fullWidth select label="Time Slot" size="small" value={rescheduleForm.timeSlot} onChange={e => setRescheduleForm(p => ({ ...p, timeSlot: e.target.value }))}>
                            {TIME_SLOTS.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                        </TextField>
                    </Box>
                    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                        {['Remote', 'In-office'].map(mode => (
                            <Box key={mode} onClick={() => setRescheduleForm(p => ({ ...p, mode }))}
                                sx={{
                                    p: 2, borderRadius: '12px', cursor: 'pointer', border: `2px solid ${rescheduleForm.mode === mode ? PRIMARY : '#e2e8f0'}`,
                                    bgcolor: rescheduleForm.mode === mode ? 'rgba(59,78,186,0.04)' : 'white', display: 'flex', alignItems: 'center', gap: 1.5
                                }}>
                                {mode === 'Remote' ? <Videocam sx={{ color: rescheduleForm.mode === mode ? PRIMARY : NEUTRAL }} /> : <Business sx={{ color: rescheduleForm.mode === mode ? PRIMARY : NEUTRAL }} />}
                                <Typography sx={{ fontSize: '0.875rem', fontWeight: 700, color: rescheduleForm.mode === mode ? PRIMARY : '#475569' }}>{mode}</Typography>
                            </Box>
                        ))}
                    </Box>
                    <TextField fullWidth size="small" label={rescheduleForm.mode === 'Remote' ? 'Meeting Link' : 'Office Location'} value={rescheduleForm.mode === 'Remote' ? rescheduleForm.meetingLink : rescheduleForm.officeLocation} onChange={e => setRescheduleForm(p => ({ ...p, [rescheduleForm.mode === 'Remote' ? 'meetingLink' : 'officeLocation']: e.target.value }))} />
                    {rescheduleError && <Typography sx={{ fontSize: '0.75rem', color: DANGER, fontWeight: 600 }}>{rescheduleError}</Typography>}
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, pb: 1 }}>
                        <Button onClick={() => setRescheduleModal({ open: false, round: null })} sx={{ color: NEUTRAL, fontWeight: 700 }}>Cancel</Button>
                        <Button variant="contained" onClick={handleReschedule} disabled={rescheduleLoading} sx={{ bgcolor: PRIMARY, fontWeight: 700, borderRadius: '8px', boxShadow: 'none', '&:hover': { bgcolor: SECONDARY, boxShadow: 'none' } }}>
                            {rescheduleLoading ? <CircularProgress size={20} color="inherit" /> : 'Confirm Reschedule'}
                        </Button>
                    </Box>
                </DialogContent>
            </Dialog>

        </Box>
    );
};

export default CandidateProfile;