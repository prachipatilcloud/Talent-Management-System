import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import API from '../../api/axios';
import {
    Box, Typography, Button, Avatar, IconButton,
    CircularProgress, Divider, Paper, TextField,
} from '@mui/material';
import {
    ArrowBack, Email, Phone,
    Download, ZoomIn, ZoomOut,
    OpenInNew, InsertDriveFile,
    Videocam, Business, CalendarMonth,
    Star, StarBorder, StarHalf,
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import UniversalFeedbackForm from '../../components/common/UniversalFeedbackForm';

const PRIMARY = '#3b4eba';
const GREEN = '#16a34a';
const RED = '#dc2626';

const getAvatarColor = (name) => {
    const colors = ['#4f46e5', '#0891b2', '#059669', '#d97706', '#dc2626', '#7c3aed'];
    return colors[(name?.charCodeAt(0) || 0) % colors.length];
};

const formatDateTime = (d) =>
    d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

const formatDate = (d) =>
    d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';

const recommendationConfig = {
    'Hire': { bg: '#f0fdf4', color: '#15803d', border: '#bbf7d0' },
    'No Hire': { bg: '#fff1f2', color: '#be123c', border: '#fecdd3' },
    'Maybe': { bg: '#fefce8', color: '#a16207', border: '#fef08a' },
    'Shortlisted': { bg: '#f0fdf4', color: '#15803d', border: '#bbf7d0' },
    'On-hold': { bg: '#fefce8', color: '#a16207', border: '#fef08a' },
    'Rejected but can be re-approached in future': { bg: '#fff1f2', color: '#be123c', border: '#fecdd3' },
    'Rejected-Poor Rating': { bg: '#fef2f2', color: '#991b1b', border: '#fca5a5' },
};

// ── Interactive Star Rating ───────────────────────────────────────
const StarRatingInput = ({ value, onChange }) => (
    <Box sx={{ display: 'flex', gap: 0.5 }}>
        {[1, 2, 3, 4, 5].map(i => (
            <Box key={i} onClick={() => onChange(i)} sx={{ cursor: 'pointer', color: i <= value ? '#f59e0b' : '#d1d5db', fontSize: 32, transition: 'color 0.1s', '&:hover': { color: '#f59e0b' } }}>
                {i <= value ? <Star sx={{ fontSize: 32 }} /> : <StarBorder sx={{ fontSize: 32 }} />}
            </Box>
        ))}
    </Box>
);

// ── Display Star Rating ───────────────────────────────────────────
const StarRatingDisplay = ({ value = 0, max = 5 }) => (
    <Box sx={{ display: 'flex', gap: 0.25, flexWrap: 'wrap' }}>
        {Array.from({ length: max }, (_, i) => i + 1).map(i => (
            i <= Math.floor(value)
                ? <Star key={i} sx={{ fontSize: 15, color: '#f59e0b' }} />
                : i - 0.5 <= value
                    ? <StarHalf key={i} sx={{ fontSize: 15, color: '#f59e0b' }} />
                    : <StarBorder key={i} sx={{ fontSize: 15, color: '#d1d5db' }} />
        ))}
    </Box>
);

// ════════════════════════════════════════════════════════════════════
const InterviewerCandidateProfile = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuth();

    const [candidate, setCandidate] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Resume
    const [iframeZoom, setIframeZoom] = useState(0.85);
    const [resumeBlobUrl, setResumeBlobUrl] = useState(null);
    const [resumeLoading, setResumeLoading] = useState(false);
    const [resumeError, setResumeError] = useState(false);
    const blobUrlRef = useRef(null);

    // Feedback form
    const [submitLoading, setSubmitLoading] = useState(false);
    const [submitError, setSubmitError] = useState('');
    const [submitSuccess, setSubmitSuccess] = useState(false);

    // The round passed from MyInterviews page
    const passedInterview = location.state?.interview || null;

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

    // ── Fetch resume ─────────────────────────────────────────────────
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
            } catch {
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

    // ── Find MY assigned round ───────────────────────────────────────
    const myRound = candidate?.interviewRounds?.find(r =>
        r._id.toString() === passedInterview?.roundId?.toString() ||
        candidate?.interviewRounds?.find(r =>
            r.roundName === passedInterview?.roundName &&
            r.interviewers?.some(iv =>
                (typeof iv === 'object' ? iv._id : iv)?.toString() === user?._id?.toString()
            )
        ) || null
    )
    // fallback for old singular interviewer field 

    const hasFeedback = !!(myRound?.feedback?.overallRating || myRound?.feedback?.rating || myRound?.feedback?.detailedComments || myRound?.feedback?.comments);

    // ── Submit feedback ─────────────────────────────────────────────
    const handleSubmitFeedback = async (formData) => {
        setSubmitLoading(true);
        setSubmitError('');
        try {
            const roundId = myRound._id;
            const res = await API.patch(
                `/interviewer/candidates/${id}/rounds/${roundId}/feedback`,
                formData
            );
            setCandidate(res.data.candidate);
            setSubmitSuccess(true);
        } catch (err) {
            setSubmitError(err.response?.data?.message || 'Failed to submit feedback.');
        } finally {
            setSubmitLoading(false);
        }
    };

    // ── Loading / error ──────────────────────────────────────────────
    if (loading) return (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            <CircularProgress sx={{ color: PRIMARY }} />
        </Box>
    );
    if (error || !candidate) return (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 2 }}>
            <Typography sx={{ color: '#ef4444', fontWeight: 600 }}>{error || 'Candidate not found'}</Typography>
            <Button onClick={() => navigate('/interviewer/my-interviews')} startIcon={<ArrowBack />}
                sx={{ textTransform: 'none', color: PRIMARY }}>
                Back to My Interviews
            </Button>
        </Box>
    );

    const initials = `${candidate.firstName?.[0] || ''}${candidate.lastName?.[0] || ''}`.toUpperCase();
    const avatarColor = getAvatarColor(candidate.firstName);
    const resume = candidate.resume;
    const hasResume = !!(resume?.driveFileId);

    return (
        <Box sx={{ height: '100%', overflow: 'auto', bgcolor: '#f6f6f8' }}>

            {/* ── Top Bar ── */}
            <Box sx={{
                height: 56, bgcolor: 'white', borderBottom: '1px solid #e2e8f0',
                display: 'flex', alignItems: 'center', px: 3,
                position: 'sticky', top: 0, zIndex: 10, gap: 2,
            }}>
                <IconButton size="small" onClick={() => navigate('/interviewer/my-interviews')}
                    sx={{ color: '#64748b', '&:hover': { color: PRIMARY } }}>
                    <ArrowBack fontSize="small" />
                </IconButton>
                <Typography sx={{ fontWeight: 700, color: '#0f172a', fontSize: '0.9375rem' }}>
                    Candidate Profile
                </Typography>

                {/* Read only badge - interviewer cannot edit anything */}
                <Box sx={{
                    px: 1.5, py: 0.3, borderRadius: '6px',
                    bgcolor: 'rgba(59,78,186,0.08)', border: '1px solid rgba(59,78,186,0.2)',
                    fontSize: '0.75rem', fontWeight: 600, color: PRIMARY,
                }}>
                    Read Only
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
                                    <Typography sx={{ fontSize: '1.0625rem', fontWeight: 800, color: '#0f172a', mb: 0.25 }}>
                                        {candidate.firstName} {candidate.lastName}
                                    </Typography>
                                    <Typography sx={{ fontSize: '0.8125rem', color: '#64748b', fontWeight: 500 }}>
                                        {candidate.jobRole}
                                    </Typography>
                                    {candidate.experience != null && (
                                        <Box component="span" sx={{
                                            display: 'inline-block', mt: 0.75,
                                            px: 1.25, py: 0.3, borderRadius: '999px',
                                            bgcolor: '#f8fafc', color: '#475569', border: '1px solid #e2e8f0',
                                            fontSize: '0.6875rem', fontWeight: 600,
                                        }}>
                                            {candidate.experience} yr{candidate.experience !== 1 ? 's' : ''} exp
                                        </Box>
                                    )}
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
                                }}>
                                    <InsertDriveFile sx={{ fontSize: 16, color: '#dc2626' }} />
                                </Box>
                                <Box>
                                    <Typography sx={{ fontSize: '0.8125rem', fontWeight: 700, color: '#0f172a', lineHeight: 1.2 }}>
                                        {hasResume ? resume.fileName : 'No resume uploaded'}
                                    </Typography>
                                    {hasResume && (
                                        <Typography sx={{ fontSize: '0.7rem', color: '#94a3b8' }}>Google Drive</Typography>
                                    )}
                                </Box>
                            </Box>
                            {hasResume && (
                                <Box sx={{ display: 'flex', gap: 0.5 }}>
                                    <IconButton size="small" onClick={() => setIframeZoom(z => Math.min(z + 0.1, 1.5))} sx={{ color: '#94a3b8', '&:hover': { color: PRIMARY } }}>
                                        <ZoomIn sx={{ fontSize: 16 }} />
                                    </IconButton>
                                    <IconButton size="small" onClick={() => setIframeZoom(z => Math.max(z - 0.1, 0.5))} sx={{ color: '#94a3b8', '&:hover': { color: PRIMARY } }}>
                                        <ZoomOut sx={{ fontSize: 16 }} />
                                    </IconButton>
                                    <Box sx={{ width: 1, height: 16, bgcolor: '#e2e8f0', mx: 0.5, alignSelf: 'center' }} />
                                    <IconButton size="small" onClick={() => window.open(resume.url, '_blank')} sx={{ color: '#94a3b8', '&:hover': { color: PRIMARY } }}>
                                        <OpenInNew sx={{ fontSize: 16 }} />
                                    </IconButton>
                                    <IconButton size="small" onClick={handleDownload} disabled={!resumeBlobUrl} sx={{ color: '#94a3b8', '&:hover': { color: PRIMARY } }}>
                                        <Download sx={{ fontSize: 16 }} />
                                    </IconButton>
                                </Box>
                            )}
                        </Box>
                        <Box sx={{ bgcolor: '#f1f5f9', p: 1.5 }}>
                            {!hasResume ? (
                                <Box sx={{ height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'white', borderRadius: '8px', border: '1px dashed #e2e8f0' }}>
                                    <Typography sx={{ fontSize: '0.8125rem', color: '#94a3b8' }}>No resume uploaded</Typography>
                                </Box>
                            ) : resumeLoading ? (
                                <Box sx={{ height: 380, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'white', borderRadius: '8px' }}>
                                    <CircularProgress size={24} sx={{ color: PRIMARY }} />
                                </Box>
                            ) : resumeError ? (
                                <Box sx={{ height: 160, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 1.5, bgcolor: 'white', borderRadius: '8px' }}>
                                    <Typography sx={{ fontSize: '0.8rem', color: '#ef4444' }}>Failed to load resume</Typography>
                                    <Button size="small" variant="outlined" onClick={() => window.open(resume.url, '_blank')}
                                        endIcon={<OpenInNew sx={{ fontSize: 14 }} />}
                                        sx={{ textTransform: 'none', fontSize: '0.8rem', borderColor: PRIMARY, color: PRIMARY, borderRadius: '8px' }}>
                                        Open in Drive
                                    </Button>
                                </Box>
                            ) : resumeBlobUrl ? (
                                <Box sx={{ bgcolor: 'white', borderRadius: '8px', border: '1px solid #e2e8f0', overflow: 'hidden', height: 380, position: 'relative' }}>
                                    <iframe src={resumeBlobUrl} title="Resume Preview"
                                        style={{
                                            width: `${(1 / iframeZoom) * 100}%`, height: `${(1 / iframeZoom) * 100}%`,
                                            border: 'none', transform: `scale(${iframeZoom})`, transformOrigin: 'top left', display: 'block',
                                        }}
                                    />
                                </Box>
                            ) : null}
                        </Box>
                    </Paper>
                </Box>

                {/* ═══════ RIGHT PANEL ═══════ */}
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>

                    {/* ── Interview Round Details ── */}
                    {myRound ? (
                        <Paper elevation={0} sx={{
                            borderRadius: '12px', border: '1px solid #e2e8f0',
                            bgcolor: 'white', p: 3, boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                        }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2.5 }}>
                                <Box sx={{ width: 32, height: 32, borderRadius: '8px', bgcolor: `${PRIMARY}10`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <CalendarMonth sx={{ fontSize: 18, color: PRIMARY }} />
                                </Box>
                                <Typography sx={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a' }}>
                                    {myRound.roundName}
                                </Typography>
                                <Box sx={{
                                    ml: 'auto', px: 1.5, py: 0.3, borderRadius: '6px',
                                    bgcolor: myRound.status === 'passed' ? '#f0fdf4' : myRound.status === 'rejected' ? '#fff1f2' : '#fefce8',
                                    color: myRound.status === 'passed' ? '#15803d' : myRound.status === 'rejected' ? '#be123c' : '#a16207',
                                    border: `1px solid ${myRound.status === 'passed' ? '#bbf7d0' : myRound.status === 'rejected' ? '#fecdd3' : '#fef08a'}`,
                                    fontSize: '0.65rem', fontWeight: 800, letterSpacing: '0.04em', textTransform: 'uppercase',
                                }}>
                                    {myRound.status}
                                </Box>
                            </Box>

                            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                                {/* Scheduled Date */}
                                <Box sx={{ p: 2, bgcolor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                    <Typography sx={{ fontSize: '0.6875rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', mb: 0.5 }}>
                                        Scheduled
                                    </Typography>
                                    <Typography sx={{ fontSize: '0.875rem', fontWeight: 600, color: '#0f172a' }}>
                                        {formatDateTime(myRound.scheduledDate)}
                                    </Typography>
                                </Box>

                                {/* Mode */}
                                <Box sx={{ p: 2, bgcolor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                    <Typography sx={{ fontSize: '0.6875rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', mb: 0.5 }}>
                                        Mode
                                    </Typography>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                                        {myRound.interviewMode === 'Remote'
                                            ? <Videocam sx={{ fontSize: 16, color: PRIMARY }} />
                                            : <Business sx={{ fontSize: 16, color: PRIMARY }} />
                                        }
                                        <Typography sx={{ fontSize: '0.875rem', fontWeight: 600, color: '#0f172a' }}>
                                            {myRound.interviewMode || '—'}
                                        </Typography>
                                    </Box>
                                    {myRound.interviewMode === 'Remote' && myRound.interviewLink && (
                                        <Box component="a" href={myRound.interviewLink} target="_blank"
                                            sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5, fontSize: '0.75rem', color: PRIMARY, textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}>
                                            <OpenInNew sx={{ fontSize: 12 }} /> Join Link
                                        </Box>
                                    )}
                                    {myRound.interviewMode === 'In-office' && myRound.officeLocation && (
                                        <Typography sx={{ fontSize: '0.75rem', color: '#64748b', mt: 0.5 }}>
                                            {myRound.officeLocation}
                                        </Typography>
                                    )}
                                </Box>
                            </Box>

                            {/* HR Notes (if any) */}
                            {myRound.notes && (
                                <Box sx={{ mt: 2, p: 2, bgcolor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                    <Typography sx={{ fontSize: '0.6875rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', mb: 0.75 }}>
                                        Notes from HR
                                    </Typography>
                                    <Typography sx={{ fontSize: '0.8125rem', color: '#475569', fontStyle: 'italic', lineHeight: 1.7, borderLeft: `3px solid ${PRIMARY}30`, pl: 1.5 }}>
                                        "{myRound.notes}"
                                    </Typography>
                                </Box>
                            )}
                        </Paper>
                    ) : (
                        <Paper elevation={0} sx={{ borderRadius: '12px', border: '1px solid #e2e8f0', bgcolor: 'white', p: 3 }}>
                            <Typography sx={{ color: '#94a3b8', fontSize: '0.875rem' }}>No interview round found for you.</Typography>
                        </Paper>
                    )}

                    {/* ── Feedback Section ── */}
                    {myRound && (
                        <Paper elevation={0} sx={{
                            borderRadius: '12px', border: '1px solid #e2e8f0',
                            bgcolor: 'white', p: 3, boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                        }}>
                            <Typography sx={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a', mb: 2.5 }}>
                                {hasFeedback ? '📝 Feedback Submitted' : '📝 Submit Feedback'}
                            </Typography>

                            {/* ── Already submitted — show feedback card ── */}
                            {hasFeedback ? (
                                <Box sx={{ p: 2.5, bgcolor: '#fafbff', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <StarRatingDisplay value={myRound.feedback.overallRating || myRound.feedback.rating} max={myRound.feedback.overallRating ? 10 : 5} />
                                                <Typography sx={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>
                                                    {myRound.feedback.overallRating || myRound.feedback.rating}/{myRound.feedback.overallRating ? 10 : 5}
                                                </Typography>
                                            </Box>
                                            {myRound.feedback.submittedAt && (
                                                <Typography sx={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                                                    Submitted {formatDate(myRound.feedback.submittedAt)}
                                                </Typography>
                                            )}
                                        </Box>
                                        {(myRound.feedback.overallRecommendation || myRound.feedback.recommendation) && (() => {
                                            const rec = recommendationConfig[myRound.feedback.overallRecommendation || myRound.feedback.recommendation];
                                            return rec ? (
                                                <Box sx={{
                                                    px: 1.5, py: 0.4, borderRadius: '6px',
                                                    bgcolor: rec.bg, color: rec.color, border: `1px solid ${rec.border}`,
                                                    fontSize: '0.7rem', fontWeight: 800, letterSpacing: '0.04em', textAlign: 'center'
                                                }}>
                                                    {(myRound.feedback.overallRecommendation || myRound.feedback.recommendation).toUpperCase()}
                                                </Box>
                                            ) : null;
                                        })()}
                                    </Box>
                                    {(myRound.feedback.detailedComments || myRound.feedback.comments) && (
                                        <Typography sx={{
                                            fontSize: '0.8125rem', color: '#475569', fontStyle: 'italic',
                                            lineHeight: 1.7, borderLeft: `3px solid ${PRIMARY}30`, pl: 1.5,
                                        }}>
                                            "{myRound.feedback.detailedComments || myRound.feedback.comments}"
                                        </Typography>
                                    )}
                                </Box>

                            ) : (
                                <UniversalFeedbackForm 
                                    isPublic={false} 
                                    submitting={submitLoading} 
                                    error={submitError} 
                                    onSubmit={handleSubmitFeedback} 
                                    onCancel={() => navigate('/interviewer/my-interviews')} 
                                    initialData={{ 
                                        candidateName: `${candidate.firstName} ${candidate.lastName}`, 
                                        positionAppliedFor: candidate.jobRole, 
                                        interviewStage: myRound.roundName, 
                                        interviewerName: `${user?.firstName || ''} ${user?.lastName || ''}`.trim() 
                                    }} 
                                />
                            )}
                        </Paper>
                    )}
                </Box>
            </Box>
        </Box>
    );
};

export default InterviewerCandidateProfile;