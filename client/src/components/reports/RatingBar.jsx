import React from 'react';
import { Box, Typography } from '@mui/material';

const getBarColor = (score) => {
    if (score >= 8) return '#4388fd';   // tertiary-container blue (high)
    if (score >= 6) return '#fbbf24';   // amber (medium)
    return '#f87171';                    // red (low)
};

const getScoreColor = (score) => {
    if (score >= 8) return '#005bc4';   // tertiary
    if (score >= 6) return '#b45309';   // amber-700
    return '#b91c1c';                    // red-700
};

const RatingBar = ({ label, score, isOverall = false }) => {
    const barColor = getBarColor(score);
    const scoreColor = getScoreColor(score);
    const percentage = (score / 10) * 100;

    return (
        <Box sx={{
            mb: isOverall ? 0 : 3,
            pt: isOverall ? 2.5 : 0,
            mt: isOverall ? 2.5 : 0,
            borderTop: isOverall ? '1px solid #f1f5f9' : 'none',
        }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography sx={{
                    fontSize: isOverall ? '0.9375rem' : '0.875rem',
                    fontWeight: isOverall ? 800 : 600,
                    color: '#2a3439',
                }}>
                    {label}
                </Typography>
                <Typography sx={{
                    fontSize: isOverall ? '1.0625rem' : '0.875rem',
                    fontWeight: 800,
                    color: scoreColor,
                }}>
                    {score}/10
                </Typography>
            </Box>
            <Box sx={{
                height: isOverall ? 10 : 6,
                width: '100%',
                bgcolor: '#e8eff3',
                borderRadius: '9999px',
                overflow: 'hidden',
            }}>
                <Box sx={{
                    height: '100%',
                    width: `${percentage}%`,
                    bgcolor: isOverall ? '#005bc4' : barColor,
                    borderRadius: '9999px',
                    transition: 'width 0.7s cubic-bezier(0.4, 0, 0.2, 1)',
                }} />
            </Box>
        </Box>
    );
};

export default RatingBar;