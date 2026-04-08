import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Grid, Paper, Avatar, Chip,
    Button, Divider, Stack, CircularProgress, IconButton,
} from '@mui/material';
import {
    ArrowBack as BackIcon,
    Email as EmailIcon,
    Phone as PhoneIcon,
    Download as DownloadIcon,
    ChevronLeft as ChevronLeftIcon,
    Analytics as AnalyticsIcon,
    Verified as VerifiedIcon,
    ThumbUp as ThumbUpIcon,
    Bolt as BoltIcon,
    Warning as WarningIcon,
    Chat as ChatIcon,
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import reportsApi from '../../services/reportsApi';
import RatingBar from '../../components/reports/RatingBar';
import RoundTabs from '../../components/reports/RoundTabs';
import ComparisonTable from '../../components/reports/ComparisonTable';

const COLORS = {
    primary: '#545f73',
    onSurface: '#2a3439',
    onSurfaceVariant: '#566166',
    surfaceContainerLow: '#f0f4f7',
    surfaceContainerLowest: '#ffffff',
    tertiary: '#005bc4',
    tertiaryContainer: '#4388fd',
    outline: 'rgba(113,124,130,0.3)',
};

const getStatusChipProps = (status = '') => {
    const s = status.toLowerCase();
    if (s === 'passed' || s === 'shortlisted')
        return { bgcolor: '#f0fdf4', color: '#166534', label: 'PASSED' };
    if (s === 'failed' || s === 'rejected')
        return { bgcolor: '#fef2f2', color: '#991b1b', label: 'FAILED' };
    return { bgcolor: '#fffbeb', color: '#92400e', label: status.toUpperCase() };
};

const CandidateReport = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState(null);
    const [activeTab, setActiveTab] = useState(0);

    useEffect(() => {
        const fetchDetail = async () => {
            try {
                const res = await reportsApi.getCandidateDetail(id);
                setData(res.data);
            } catch (err) {
                console.error('Error fetching candidate report:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchDetail();
    }, [id]);

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
                <CircularProgress sx={{ color: COLORS.primary }} />
            </Box>
        );
    }
    if (!data) {
        return (
            <Box sx={{ p: 4 }}>
                <Typography sx={{ color: COLORS.onSurfaceVariant }}>Candidate not found.</Typography>
            </Box>
        );
    }

    const { candidate, metrics } = data;
    const rounds = candidate.interviewRounds || [];
    const currentRound = rounds[activeTab] || {};
    const feedback = currentRound?.feedback || {};
    const statusProps = getStatusChipProps(currentRound?.status || '');

    const handleTabChange = (_, newValue) => setActiveTab(newValue);

    return (
        <Box sx={{ bgcolor: '#F8F7F4', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>

            {/* ── Main Content ── */}
            <Box sx={{ p: { xs: 3, md: 5 }, maxWidth: 1440, mx: 'auto' }}>

                {/* ── Back + Header ── */}
                <Box sx={{ mb: 5 }}>
                    {/* Back link */}
                    <Box
                        onClick={() => navigate('/hr/reports')}
                        sx={{
                            display: 'flex', alignItems: 'center', gap: 0.75,
                            color: COLORS.primary, fontWeight: 600, fontSize: '0.875rem',
                            mb: 3, cursor: 'pointer', width: 'fit-content',
                            '&:hover': { textDecoration: 'underline' },
                        }}
                    >
                        <BackIcon sx={{ fontSize: '1rem' }} />
                        Back to Reports
                    </Box>

                    {/* Candidate name + status chips */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 2 }}>
                        <Box>
                            <Typography sx={{
                                fontWeight: 800,
                                fontFamily: "'Manrope', sans-serif",
                                fontSize: { xs: '1.75rem', md: '2.25rem' },
                                color: COLORS.onSurface,
                                letterSpacing: '-0.02em',
                                lineHeight: 1.1,
                            }}>
                                {candidate.firstName} {candidate.lastName}
                            </Typography>
                            <Typography sx={{ color: COLORS.onSurfaceVariant, fontWeight: 500, fontSize: '1.0625rem', mt: 0.5 }}>
                                {candidate.jobRole}
                            </Typography>
                        </Box>

                        <Box sx={{ display: 'flex', gap: 1.5 }}>
                            <Box sx={{
                                px: 3, py: 1.5,
                                bgcolor: COLORS.tertiaryContainer,
                                color: '#000311',
                                borderRadius: '9999px',
                                display: 'flex', alignItems: 'center', gap: 1,
                                boxShadow: '0 2px 8px rgba(67,136,253,0.3)',
                            }}>
                                <AnalyticsIcon sx={{ fontSize: '1.1rem' }} />
                                <Typography sx={{ fontWeight: 700, fontSize: '0.875rem' }}>
                                    Overall Average: {metrics?.avgOverallScore || '—'}/10
                                </Typography>
                            </Box>
                            <Box sx={{
                                px: 3, py: 1.5,
                                bgcolor: '#e1f3e9', color: '#1e5a3c',
                                border: '1px solid #b2e0c9',
                                borderRadius: '9999px',
                                display: 'flex', alignItems: 'center', gap: 1,
                                boxShadow: '0 2px 8px rgba(22,101,52,0.1)',
                            }}>
                                <VerifiedIcon sx={{ fontSize: '1.1rem' }} />
                                <Typography sx={{ fontWeight: 700, fontSize: '0.875rem' }}>
                                    Final Status: {candidate.status || 'In Progress'}
                                </Typography>
                            </Box>
                        </Box>
                    </Box>
                </Box>

                {/* ── Round Tabs ── */}
                <Box sx={{ mb: 4 }}>
                    <RoundTabs rounds={rounds} activeTab={activeTab} onTabChange={handleTabChange} />
                </Box>

                {/* ── Main Grid: Ratings + Qualitative ── */}
                <Grid container spacing={4} sx={{ mb: 6 }}>

                    {/* Left: Evaluation Ratings (7 col) */}
                    <Grid item xs={12} lg={7}>
                        <Paper sx={{
                            p: { xs: 3, md: 4 },
                            borderRadius: '16px',
                            border: '1px solid #e5e7eb',
                            boxShadow: '0 1px 8px rgba(0,0,0,0.04)',
                        }}>
                            {/* Card header */}
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 4 }}>
                                <Box>
                                    <Typography sx={{
                                        fontSize: '1.1875rem', fontWeight: 800,
                                        fontFamily: "'Manrope', sans-serif", color: COLORS.onSurface, mb: 0.5,
                                    }}>
                                        Evaluation Ratings
                                    </Typography>
                                    <Typography sx={{ fontSize: '0.8125rem', color: COLORS.onSurfaceVariant }}>
                                        {currentRound.roundName || `Round ${activeTab + 1}`} • {currentRound.stageName || 'Technical Screening'}
                                    </Typography>
                                </Box>
                                <Box sx={{ textAlign: 'right' }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, justifyContent: 'flex-end', mb: 0.5 }}>
                                        <EmailIcon sx={{ fontSize: '1rem', color: COLORS.primary }} />
                                        <Typography sx={{ fontSize: '0.875rem', fontWeight: 700, color: COLORS.onSurface }}>
                                            {feedback.interviewerName || '—'}
                                        </Typography>
                                    </Box>
                                    <Typography sx={{ fontSize: '0.75rem', color: COLORS.onSurfaceVariant }}>
                                        {currentRound.scheduledDate
                                            ? new Date(currentRound.scheduledDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                                            : '—'
                                        }
                                    </Typography>
                                </Box>
                            </Box>

                            {/* Rating bars */}
                            <RatingBar label="Educational Background" score={feedback.educationalBackground || 0} />
                            <RatingBar label="Work Experience" score={feedback.priorWorkExperience || 0} />
                            <RatingBar label="Technical Qualifications" score={feedback.technicalQualifications || 0} />
                            <RatingBar label="Verbal Communication" score={feedback.verbalCommunication || 0} />
                            <RatingBar label="Candidate Interest" score={feedback.candidateInterest || 0} />
                            <RatingBar label="Teambuilding" score={feedback.teambuildingSkills || 0} />
                            <RatingBar label="Overall Score" score={feedback.overallRating || 0} isOverall />
                        </Paper>
                    </Grid>

                    {/* Right: Qualitative (5 col) */}
                    <Grid item xs={12} lg={5}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, height: '100%' }}>

                            {/* Recommendation */}
                            <Paper sx={{ p: 3, borderRadius: '16px', border: '1px solid #e5e7eb', boxShadow: '0 1px 8px rgba(0,0,0,0.04)' }}>
                                <Typography sx={{ fontSize: '0.625rem', fontWeight: 800, color: COLORS.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: '0.15em', mb: 2 }}>
                                    Overall Recommendation
                                </Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                    <Box sx={{ width: 40, height: 40, borderRadius: '50%', bgcolor: '#e1f3e9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <ThumbUpIcon sx={{ fontSize: '1.1rem', color: '#1e5a3c' }} />
                                    </Box>
                                    <Typography sx={{ fontSize: '1.1875rem', fontWeight: 800, color: '#1e5a3c' }}>
                                        {feedback.overallRecommendation || '—'}
                                    </Typography>
                                </Box>
                            </Paper>

                            {/* Key Strengths */}
                            <Paper sx={{ p: 3, borderRadius: '16px', border: '1px solid #e5e7eb', boxShadow: '0 1px 8px rgba(0,0,0,0.04)', flex: 1 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                                    <BoltIcon sx={{ fontSize: '1.1rem', color: '#1e5a3c' }} />
                                    <Typography sx={{ fontSize: '0.8125rem', fontWeight: 800, color: COLORS.onSurface }}>
                                        Key Strengths
                                    </Typography>
                                </Box>
                                <Typography sx={{ fontSize: '0.875rem', color: COLORS.onSurfaceVariant, lineHeight: 1.7 }}>
                                    {feedback.keyStrengths || 'No strengths recorded.'}
                                </Typography>
                            </Paper>

                            {/* Areas for Improvement */}
                            <Paper sx={{ p: 3, borderRadius: '16px', border: '1px solid #e5e7eb', boxShadow: '0 1px 8px rgba(0,0,0,0.04)', flex: 1 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                                    <WarningIcon sx={{ fontSize: '1.1rem', color: '#9f403d' }} />
                                    <Typography sx={{ fontSize: '0.8125rem', fontWeight: 800, color: COLORS.onSurface }}>
                                        Areas for Improvement
                                    </Typography>
                                </Box>
                                <Typography sx={{ fontSize: '0.875rem', color: COLORS.onSurfaceVariant, lineHeight: 1.7 }}>
                                    {feedback.areasForImprovement || 'No areas recorded.'}
                                </Typography>
                            </Paper>
                        </Box>
                    </Grid>

                    {/* Detailed Comments — full width below */}
                    <Grid item xs={12}>
                        <Box sx={{
                            bgcolor: COLORS.surfaceContainerLow,
                            p: { xs: 3, md: 4 },
                            borderRadius: '16px',
                            border: '2px dashed rgba(169,180,185,0.25)',
                        }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                                <ChatIcon sx={{ fontSize: '1.1rem', color: COLORS.primary }} />
                                <Typography sx={{ fontSize: '0.875rem', fontWeight: 800, color: COLORS.onSurface }}>
                                    Detailed Comments
                                </Typography>
                            </Box>
                            <Typography sx={{ fontSize: '0.9375rem', color: COLORS.onSurfaceVariant, lineHeight: 1.8 }}>
                                {feedback.detailedComments || 'No detailed comments provided for this round.'}
                            </Typography>
                        </Box>
                    </Grid>
                </Grid>

                {/* ── Performance Across All Rounds ── */}
                <Box sx={{ mt: 4 }}>
                    <Box sx={{ mb: 3 }}>
                        <Typography sx={{
                            fontSize: '1.5rem', fontWeight: 800,
                            fontFamily: "'Manrope', sans-serif",
                            color: COLORS.onSurface, letterSpacing: '-0.01em',
                        }}>
                            Performance Across All Rounds
                        </Typography>
                        <Typography sx={{ color: COLORS.onSurfaceVariant, fontWeight: 500, mt: 0.5 }}>
                            How ratings evolved throughout the recruitment journey.
                        </Typography>
                    </Box>
                    <ComparisonTable rounds={rounds} />
                </Box>

            </Box>
        </Box>
    );
};

export default CandidateReport;