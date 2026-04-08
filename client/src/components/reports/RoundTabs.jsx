import React from 'react';
import { Box, Typography } from '@mui/material';
import { CheckCircle as CheckCircleIcon, RadioButtonUnchecked as EmptyCircleIcon } from '@mui/icons-material';

const RoundTabs = ({ rounds = [], activeTab, onTabChange }) => {
    return (
        <Box sx={{ display: 'flex', gap: 1.5, px: 3, py: 2.5, flexWrap: 'wrap' }}>
            {rounds.map((round, i) => {
                const isActive = activeTab === i;
                const hasFeedback = !!(round?.feedback && round.feedback.overallRating);

                return (
                    <Box
                        key={i}
                        onClick={(e) => onTabChange(e, i)}
                        sx={{
                            px: 3,
                            py: 1.25,
                            borderRadius: '9999px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                            cursor: 'pointer',
                            fontWeight: isActive ? 700 : 600,
                            fontSize: '0.875rem',
                            transition: 'all 0.2s ease',
                            bgcolor: isActive ? '#005bc4' : 'white',
                            color: isActive ? 'white' : '#566166',
                            border: isActive ? 'none' : '1px solid rgba(169,180,185,0.3)',
                            boxShadow: isActive ? '0 4px 12px rgba(0,91,196,0.25)' : 'none',
                            '&:hover': !isActive ? {
                                bgcolor: '#f0f4f7',
                                color: '#2a3439',
                            } : {},
                        }}
                    >
                        {hasFeedback ? (
                            <CheckCircleIcon sx={{
                                fontSize: '1.1rem',
                                color: isActive ? 'rgba(255,255,255,0.9)' : '#22c55e',
                            }} />
                        ) : (
                            <EmptyCircleIcon sx={{
                                fontSize: '1.1rem',
                                color: isActive ? 'rgba(255,255,255,0.6)' : '#cbd5e1',
                            }} />
                        )}
                        <Typography sx={{ fontSize: '0.875rem', fontWeight: 'inherit', lineHeight: 1 }}>
                            {round.roundName || `Round ${i + 1}`}
                        </Typography>
                    </Box>
                );
            })}
        </Box>
    );
};

export default RoundTabs;