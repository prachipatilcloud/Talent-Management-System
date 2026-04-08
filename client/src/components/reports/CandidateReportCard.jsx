import React from 'react';
import { Box, Typography } from '@mui/material';
import { ArrowForward as ArrowForwardIcon } from '@mui/icons-material';

const COLORS = {
    primary: '#545f73',
    onSurface: '#2a3439',
    onSurfaceVariant: '#566166',
};

const getRecommendationInfo = (rec) => {
    if (!rec) return { label: 'In Progress', color: '#1d4ed8', bg: '#eff6ff', border: '#dbeafe' };
    const r = rec.toLowerCase();
    if (r.includes('shortlist') || r.includes('pass') || r.includes('select'))
        return { label: 'Shortlisted', color: '#166534', bg: '#f0fdf4', border: '#bbf7d0' };
    if (r.includes('reject'))
        return { label: 'Rejected', color: '#991b1b', bg: '#fef2f2', border: '#fecaca' };
    if (r.includes('hold'))
        return { label: 'On Hold', color: '#92400e', bg: '#fffbeb', border: '#fde68a' };
    return { label: 'In Progress', color: '#1d4ed8', bg: '#eff6ff', border: '#dbeafe' };
};

const getProgressColor = (s) => {
    if (s >= 8) return '#22c55e';
    if (s >= 6) return '#f59e0b';
    return '#ef4444';
};

const CircularScore = ({ score }) => {
    const color = getProgressColor(score);
    const r = 26;
    const circumference = 2 * Math.PI * r;
    const offset = circumference * (1 - score / 10);

    return (
        <Box sx={{ position: 'relative', width: 56, height: 56, flexShrink: 0 }}>
            <svg width="56" height="56" viewBox="0 0 56 56">
                <circle cx="28" cy="28" r={r} fill="none" stroke="#e2e8f0" strokeWidth="4" />
                <circle
                    cx="28" cy="28" r={r}
                    fill="none"
                    stroke={color}
                    strokeWidth="4"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    transform="rotate(-90 28 28)"
                    style={{ transition: 'stroke-dashoffset 0.6s ease' }}
                />
            </svg>
            <Box sx={{
                position: 'absolute', top: '50%', left: '50%',
                transform: 'translate(-50%, -50%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
                <Typography sx={{ fontSize: '0.8rem', fontWeight: 800, color: COLORS.onSurface, lineHeight: 1 }}>
                    {Number(score).toFixed(1)}
                </Typography>
            </Box>
        </Box>
    );
};

const CandidateReportCard = ({ candidate, onClick }) => {
    const recInfo = getRecommendationInfo(candidate.recommendation);
    const score = Number(candidate.avgRating) || 0;
    const totalRounds = candidate.totalRounds || 4;
    const roundsCleared = candidate.roundsCleared || 0;

    return (
        <Box
            onClick={onClick}
            sx={{
                bgcolor: 'white',
                borderRadius: '12px',
                p: { xs: 2, md: 2.5 },
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
                boxShadow: '0 4px 20px -4px rgba(42,52,57,0.06)',
                transition: 'box-shadow 0.25s ease, transform 0.25s ease',
                '&:hover': {
                    boxShadow: '0 10px 28px -5px rgba(42,52,57,0.13)',
                    transform: 'translateY(-2px)',
                },
                '&:hover .arrow-icon': { transform: 'translateX(4px)' },
            }}
        >
            {/* Left: Score + Name */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, flex: 1, minWidth: 0 }}>
                <CircularScore score={score} />
                <Box sx={{ minWidth: 0 }}>
                    <Typography sx={{
                        fontSize: '1.0625rem',
                        fontWeight: 800,
                        color: COLORS.onSurface,
                        fontFamily: "'Manrope', sans-serif",
                        lineHeight: 1.25,
                        mb: 0.25,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                    }}>
                        {candidate.name}
                    </Typography>
                    <Typography sx={{ fontSize: '0.875rem', fontWeight: 500, color: COLORS.onSurfaceVariant }}>
                        {candidate.jobRole}
                    </Typography>
                </Box>
            </Box>

            {/* Center: Rounds + Recommendation */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 4, lg: 10 }, flex: 2, justifyContent: 'center' }}>
                {/* Rounds dots */}
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <Typography sx={{
                        fontSize: '0.625rem', fontWeight: 800, color: COLORS.onSurfaceVariant,
                        textTransform: 'uppercase', letterSpacing: '0.15em', mb: 1,
                    }}>
                        Rounds Cleared
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 0.75 }}>
                        {[...Array(totalRounds)].map((_, i) => (
                            <Box key={i} sx={{
                                width: 10, height: 10, borderRadius: '50%',
                                bgcolor: i < roundsCleared ? COLORS.primary : 'transparent',
                                border: i < roundsCleared ? 'none' : '1.5px solid #cbd5e1',
                                transition: 'background-color 0.2s',
                            }} />
                        ))}
                    </Box>
                    <Typography sx={{ fontSize: '0.6875rem', mt: 0.75, fontWeight: 700, color: COLORS.onSurface }}>
                        {roundsCleared}/{totalRounds} rounds
                    </Typography>
                </Box>

                {/* Recommendation chip */}
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 120 }}>
                    <Typography sx={{
                        fontSize: '0.625rem', fontWeight: 800, color: COLORS.onSurfaceVariant,
                        textTransform: 'uppercase', letterSpacing: '0.15em', mb: 1,
                    }}>
                        Recommendation
                    </Typography>
                    <Box sx={{
                        px: 2, py: 0.75,
                        bgcolor: recInfo.bg,
                        color: recInfo.color,
                        borderRadius: '9999px',
                        fontSize: '0.75rem',
                        fontWeight: 800,
                        border: `1px solid ${recInfo.border}`,
                        whiteSpace: 'nowrap',
                    }}>
                        {recInfo.label}
                    </Box>
                </Box>
            </Box>

            {/* Right: View Report */}
            <Box sx={{ flex: 1, display: 'flex', justifyContent: 'flex-end' }}>
                <Typography sx={{
                    color: COLORS.primary, fontWeight: 800, fontSize: '0.875rem',
                    display: 'flex', alignItems: 'center', gap: 0.5,
                }}>
                    View Report
                    <ArrowForwardIcon className="arrow-icon" sx={{ fontSize: '1.2rem', transition: 'transform 0.2s ease' }} />
                </Typography>
            </Box>
        </Box>
    );
};

export default CandidateReportCard;