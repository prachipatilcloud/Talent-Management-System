import React from 'react';
import { Box, Typography } from '@mui/material';
import { TrendingUp as TrendingUpIcon } from '@mui/icons-material';

const CRITERIA = [
    { key: 'educationalBackground', label: 'Educational Bg' },
    { key: 'priorWorkExperience', label: 'Work Exp' },
    { key: 'technicalQualifications', label: 'Tech Skills' },
    { key: 'verbalCommunication', label: 'Communication' },
    { key: 'candidateInterest', label: 'Interest' },
    { key: 'teambuildingSkills', label: 'Teambuilding' },
    { key: 'overallRating', label: 'Overall' },
];

const getCellColor = (val) => {
    if (!val) return '#94a3b8';
    if (val >= 8) return '#166534';   // green
    if (val >= 6) return '#b45309';   // amber
    return '#991b1b';                  // red
};

const ScoreCell = ({ val }) => (
    <Box component="td" sx={{
        px: 3, py: 2.5,
        textAlign: 'center',
        fontWeight: 700,
        fontSize: '0.9375rem',
        color: getCellColor(val),
    }}>
        {val || '—'}
    </Box>
);

const ComparisonTable = ({ rounds = [] }) => {
    // Build round averages
    const roundAverages = rounds.map(r => {
        const fb = r?.feedback;
        if (!fb) return null;
        const vals = CRITERIA.map(c => fb[c.key]).filter(Boolean);
        if (!vals.length) return null;
        return (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1);
    });

    const validAvgs = roundAverages.filter(Boolean).map(Number);
    const isImproving = validAvgs.length >= 2 && validAvgs[validAvgs.length - 1] > validAvgs[0];

    return (
        <Box sx={{ bgcolor: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 4px 20px -5px rgba(0,0,0,0.05)' }}>
            {/* Table */}
            <Box sx={{ overflowX: 'auto' }}>
                <Box component="table" sx={{ width: '100%', borderCollapse: 'collapse', minWidth: 500 }}>
                    {/* Head */}
                    <Box component="thead">
                        <Box component="tr" sx={{ bgcolor: '#f0f4f7' }}>
                            <Box component="th" sx={{ px: 3, py: 2.5, textAlign: 'left', fontSize: '0.6875rem', fontWeight: 800, color: '#566166', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                                Evaluation Criteria
                            </Box>
                            {rounds.map((r, i) => (
                                <Box component="th" key={i} sx={{ px: 3, py: 2.5, textAlign: 'center', fontSize: '0.6875rem', fontWeight: 800, color: '#566166', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                                    {r.roundName || `Round ${i + 1}`}
                                </Box>
                            ))}
                        </Box>
                    </Box>

                    {/* Body */}
                    <Box component="tbody">
                        {CRITERIA.map((criterion, ci) => (
                            <Box
                                component="tr"
                                key={criterion.key}
                                sx={{
                                    borderTop: '1px solid rgba(232,239,243,0.5)',
                                    transition: 'background-color 0.15s',
                                    '&:hover': { bgcolor: 'rgba(216,227,251,0.1)' },
                                }}
                            >
                                <Box component="td" sx={{ px: 3, py: 2.5, fontWeight: 600, fontSize: '0.9375rem', color: '#2a3439' }}>
                                    {criterion.label}
                                </Box>
                                {rounds.map((r, ri) => (
                                    <ScoreCell key={ri} val={r?.feedback?.[criterion.key]} />
                                ))}
                            </Box>
                        ))}
                    </Box>

                    {/* Footer: Round Average */}
                    <Box component="tfoot">
                        <Box component="tr" sx={{ bgcolor: '#e8eff3', borderTop: '2px solid #d9e4ea' }}>
                            <Box component="td" sx={{ px: 3, py: 2.5 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                    <Typography sx={{ fontWeight: 800, fontSize: '0.9375rem', color: '#2a3439', fontFamily: "'Manrope', sans-serif" }}>
                                        Round Average
                                    </Typography>
                                    {isImproving && (
                                        <Box sx={{
                                            display: 'flex', alignItems: 'center', gap: 0.5,
                                            bgcolor: '#e1f3e9', color: '#1e5a3c',
                                            px: 1.25, py: 0.25, borderRadius: '9999px',
                                            fontSize: '0.625rem', fontWeight: 800,
                                            textTransform: 'uppercase', letterSpacing: '0.05em',
                                        }}>
                                            <TrendingUpIcon sx={{ fontSize: '0.75rem' }} />
                                            Improving
                                        </Box>
                                    )}
                                </Box>
                            </Box>
                            {roundAverages.map((avg, i) => (
                                <Box component="td" key={i} sx={{ px: 3, py: 2.5, textAlign: 'center' }}>
                                    <Typography sx={{ fontWeight: 800, fontSize: '1.0625rem', color: '#2a3439', fontFamily: "'Manrope', sans-serif" }}>
                                        {avg ?? '—'}
                                    </Typography>
                                </Box>
                            ))}
                        </Box>
                    </Box>
                </Box>
            </Box>
        </Box>
    );
};

export default ComparisonTable;