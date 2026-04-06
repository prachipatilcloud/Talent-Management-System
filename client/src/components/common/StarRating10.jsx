import React from 'react';
import { Box, Typography } from '@mui/material';
import { Star, StarBorder } from '@mui/icons-material';

const StarRating10 = ({ value = 0, onChange, label, description, required = false }) => {
    return (
        <Box sx={{ mb: 3 }}>
            {label && (
                <Typography sx={{ fontSize: '0.875rem', fontWeight: 700, color: '#334155', mb: 0.5 }}>
                    {label} {required && <span style={{ color: '#ef4444' }}>*</span>}
                </Typography>
            )}
            {description && (
                <Typography sx={{ fontSize: '0.75rem', color: '#64748b', mb: 1, fontStyle: 'italic' }}>
                    {description}
                </Typography>
            )}
            
            <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((star) => (
                    <Box 
                        key={star} 
                        onClick={() => onChange(star)}
                        sx={{ 
                            display: 'flex', 
                            flexDirection: 'column', 
                            alignItems: 'center',
                            cursor: 'pointer',
                            '&:hover .star-icon': { transform: 'scale(1.15)' },
                        }}
                    >
                        <Typography sx={{ 
                            fontSize: '0.65rem', 
                            fontWeight: 800, 
                            color: star <= value ? '#f59e0b' : '#94a3b8',
                            mb: 0.5,
                            transition: 'color 0.2s'
                        }}>
                            {star}
                        </Typography>
                        {star <= value ? (
                            <Star className="star-icon" sx={{ color: '#f59e0b', fontSize: 24, transition: 'transform 0.15s' }} />
                        ) : (
                            <StarBorder className="star-icon" sx={{ color: '#cbd5e1', fontSize: 24, transition: 'transform 0.15s' }} />
                        )}
                    </Box>
                ))}
            </Box>
        </Box>
    );
};

export default StarRating10;
