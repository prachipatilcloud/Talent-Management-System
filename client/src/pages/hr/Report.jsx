import React, { useState, useEffect } from 'react';
import { Box, Typography, CircularProgress, InputBase } from '@mui/material';
import {
    Search as SearchIcon,
    Download as DownloadIcon,
    Group as GroupIcon,
    Star as StarIcon,
    CheckCircle as CheckCircleIcon,
    ChevronLeft as ChevronLeftIcon,
    ChevronRight as ChevronRightIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import reportsApi from '../../services/reportsApi';
import CandidateReportCard from '../../components/reports/CandidateReportCard';

const C = {
    primary: '#545f73',
    onPrimary: '#f6f7ff',
    primaryContainer: '#d8e3fb',
    onPrimaryContainer: '#475266',
    secondaryContainer: '#d3e4fe',
    onSecondaryContainer: '#435368',
    tertiary: '#005bc4',
    surfaceContainerLow: '#f0f4f7',
    surfaceContainerLowest: '#ffffff',
    onSurface: '#2a3439',
    onSurfaceVariant: '#566166',
    bg: '#F8F7F4',
};

const NativeSelect = ({ name, value, onChange, options }) => (
    <select
        name={name}
        value={value}
        onChange={onChange}
        style={{
            backgroundColor: C.surfaceContainerLowest,
            border: 'none',
            borderRadius: '0.5rem',
            fontSize: '0.875rem',
            padding: '0.625rem 1rem',
            color: C.onSurface,
            fontFamily: 'Inter, sans-serif',
            cursor: 'pointer',
            outline: 'none',
        }}
    >
        {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
);

const StatPill = ({ icon, label, bg, border, color }) => (
    <Box sx={{
        display: 'flex', alignItems: 'center', gap: 1,
        bgcolor: bg, color, border: `1px solid ${border}`,
        borderRadius: '9999px', px: 2, py: 0.75,
        fontSize: '0.75rem', fontWeight: 600,
        whiteSpace: 'nowrap', fontFamily: "'Inter', sans-serif",
    }}>
        {icon}{label}
    </Box>
);

const PaginationBtn = ({ children, active, disabled, onClick }) => (
    <Box
        component="button"
        onClick={onClick}
        disabled={disabled}
        sx={{
            width: 32, height: 32,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            borderRadius: '0.5rem',
            border: active ? 'none' : '1px solid #e2e8f0',
            bgcolor: active ? C.primary : 'transparent',
            color: active ? 'white' : disabled ? '#94a3b8' : C.onSurface,
            fontWeight: active ? 700 : 400,
            fontSize: '0.75rem',
            fontFamily: "'Inter', sans-serif",
            cursor: disabled ? 'not-allowed' : 'pointer',
            transition: 'background-color 0.15s',
            '&:hover:not(:disabled)': { bgcolor: active ? C.primary : '#f8fafc' },
        }}
    >
        {children}
    </Box>
);

const Report = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [summary, setSummary] = useState({ totalCandidates: 0, avgRating: 0, shortlistedThisMonth: 0 });
    const [candidates, setCandidates] = useState([]);
    const [filters, setFilters] = useState({
        search: '',
        skills: '',
        round: 'All Rounds',
        recommendation: 'All Recommendations', 
        position: 'All Positions',
        page: 1,
        limit: 10
    });
    const [pagination, setPagination] = useState({
        totalResults: 0,
        totalPages: 0,
        currentPage: 1,
        limit: 10
    });

    useEffect(() => { 
        // Reset to page 1 when any search/filter changes
        setFilters(prev => ({ ...prev, page: 1 }));
    }, [filters.search, filters.skills, filters.round, filters.recommendation, filters.position]);

    useEffect(() => { 
        fetchData(); 
    }, [filters.page, filters.round, filters.recommendation, filters.position, filters.skills]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [sRes, cRes] = await Promise.all([
                reportsApi.getSummary(),
                reportsApi.getCandidates(filters),
            ]);
            setSummary(sRes.data);
            setCandidates(cRes.data);
            if (cRes.pagination) {
                setPagination(cRes.pagination);
            }
        } catch (e) {
            console.error('Reports fetch error:', e);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = e => {
        const { name, value } = e.target;
        setFilters(p => ({ ...p, [name]: value, page: 1 })); // Always reset to page 1 when changing filters
    };

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= pagination.totalPages) {
            setFilters(prev => ({ ...prev, page: newPage }));
        }
    };

    if (loading && !candidates.length) return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
            <CircularProgress sx={{ color: C.primary }} />
        </Box>
    );

    return (
        <Box sx={{ pt: { xs: 3, md: 4 }, pb: 6, px: { xs: 3, md: 4 }, bgcolor: C.bg, minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>

            {/* PAGE HEADER */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 4 }}>
                <Box>
                    <Typography sx={{
                        fontFamily: "'Manrope', sans-serif", fontWeight: 800,
                        fontSize: { xs: '1.625rem', md: '1.875rem' },
                        color: C.onSurface, letterSpacing: '-0.025em', lineHeight: 1.15, mb: 0.5,
                    }}>
                        Feedback Reports
                    </Typography>
                    <Typography sx={{ fontSize: '0.9375rem', color: C.onSurfaceVariant }}>
                        View detailed interview feedback across all rounds for each candidate
                    </Typography>
                </Box>
                <Box component="button" onClick={() => { }} sx={{
                    display: 'flex', alignItems: 'center', gap: 1,
                    px: 2.5, py: 1.25,
                    border: '2px solid rgba(113,124,130,0.3)',
                    borderRadius: '0.75rem',
                    bgcolor: 'transparent', color: C.primary,
                    fontFamily: "'Inter', sans-serif", fontWeight: 700, fontSize: '0.875rem',
                    cursor: 'pointer', transition: 'background-color 0.15s',
                    '&:hover': { bgcolor: 'rgba(84,95,115,0.04)' },
                }}>
                    <DownloadIcon sx={{ fontSize: '1rem' }} />
                    + Export All
                </Box>
            </Box>

            {/* FILTER BAR */}
            <Box sx={{
                bgcolor: C.surfaceContainerLow, borderRadius: '0.75rem',
                p: 2, mb: 3, display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center',
            }}>
                <Box sx={{
                    flex: { xs: '1 1 100%', md: 1 }, minWidth: 200,
                    bgcolor: C.surfaceContainerLowest, borderRadius: '0.5rem',
                    display: 'flex', alignItems: 'center', px: 1.5,
                }}>
                    <SearchIcon 
                        onClick={() => { setFilters(p => ({ ...p, page: 1 })); fetchData(); }}
                        sx={{ color: C.onSurfaceVariant, fontSize: '1.25rem', mr: 1, flexShrink: 0, cursor: 'pointer' }} 
                    />
                    <InputBase
                        placeholder="Search by name..."
                        name="search" fullWidth
                        value={filters.search}
                        onChange={handleChange}
                        onKeyPress={e => e.key === 'Enter' && (setFilters(p => ({ ...p, page: 1 })), fetchData())}
                        sx={{
                            py: 1.25, fontSize: '0.875rem', color: C.onSurface,
                            fontFamily: "'Inter', sans-serif",
                            '& input::placeholder': { color: C.onSurfaceVariant, opacity: 1 },
                        }}
                    />
                </Box>

                <Box sx={{
                    flex: { xs: '1 1 100%', md: 1 }, minWidth: 200,
                    bgcolor: C.surfaceContainerLowest, borderRadius: '0.5rem',
                    display: 'flex', alignItems: 'center', px: 1.5,
                }}>
                    <SearchIcon 
                        onClick={() => { setFilters(p => ({ ...p, page: 1 })); fetchData(); }}
                        sx={{ color: C.onSurfaceVariant, fontSize: '1.25rem', mr: 1, flexShrink: 0, cursor: 'pointer' }} 
                    />
                    <InputBase
                        placeholder="Search by skills (e.g. React)..."
                        name="skills" fullWidth
                        value={filters.skills}
                        onChange={handleChange}
                        onKeyPress={e => e.key === 'Enter' && (setFilters(p => ({ ...p, page: 1 })), fetchData())}
                        sx={{
                            py: 1.25, fontSize: '0.875rem', color: C.onSurface,
                            fontFamily: "'Inter', sans-serif",
                            '& input::placeholder': { color: C.onSurfaceVariant, opacity: 1 },
                        }}
                    />
                </Box>
                <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                    <NativeSelect name="round" value={filters.round} onChange={handleChange} options={['All Rounds', 'Round 1', 'Round 2', 'Round 3', 'Round 4']} />
                    <NativeSelect name="recommendation" value={filters.recommendation} onChange={handleChange} options={['All Recommendations', 'Shortlisted', 'On Hold', 'Rejected', 'In Progress']} />
                    <NativeSelect name="position" value={filters.position} onChange={handleChange} options={['All Positions', 'Full Stack Engineer', 'Full Stack Developer', 'Backend Developer', 'UI/UX Designer']} />
                </Box>
            </Box>

            {/* SUMMARY STATS */}
            <Box sx={{ display: 'flex', gap: 2, mb: 5, flexWrap: 'wrap' }}>
                <StatPill icon={<GroupIcon sx={{ fontSize: '1rem' }} />} label={`Total Candidates Reviewed: ${summary.totalCandidates}`} bg="rgba(216,227,251,0.4)" border={C.primaryContainer} color={C.onPrimaryContainer} />
                <StatPill icon={<StarIcon sx={{ fontSize: '1rem' }} />} label={`Average Rating Across All: ${summary.avgRating}/10`} bg="rgba(211,228,254,0.4)" border={C.secondaryContainer} color={C.onSecondaryContainer} />
                <StatPill icon={<CheckCircleIcon sx={{ fontSize: '1rem' }} />} label={`Shortlisted This Month: ${summary.shortlistedThisMonth}`} bg="rgba(67,136,253,0.1)" border="rgba(0,91,196,0.2)" color={C.tertiary} />
            </Box>

            {/* CANDIDATE CARDS */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {loading ? (
                    <Box sx={{ py: 8, display: 'flex', justifyContent: 'center' }}>
                        <CircularProgress sx={{ color: C.primary }} />
                    </Box>
                ) : candidates.length > 0 ? (
                    candidates.map(c => (
                        <CandidateReportCard key={c._id} candidate={c} onClick={() => navigate(`/hr/reports/${c._id}`)} />
                    ))
                ) : (
                    <Box sx={{ py: 10, textAlign: 'center' }}>
                        <Typography sx={{ fontSize: '0.9375rem', color: C.onSurfaceVariant }}>
                            No candidates found matching the filters.
                        </Typography>
                    </Box>
                )}
            </Box>

            {/* PAGINATION */}
            <Box sx={{ mt: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 0.5 }}>
                <Typography sx={{
                    fontSize: '0.75rem', fontWeight: 800, color: C.onSurfaceVariant,
                    textTransform: 'uppercase', letterSpacing: '0.1em',
                }}>
                    Showing {candidates.length} of {pagination.totalResults} Candidates
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <PaginationBtn 
                        disabled={pagination.currentPage === 1}
                        onClick={() => handlePageChange(pagination.currentPage - 1)}
                    >
                        <ChevronLeftIcon sx={{ fontSize: '1.25rem' }} />
                    </PaginationBtn>
                    
                    {[...Array(pagination.totalPages)].map((_, i) => (
                        <PaginationBtn 
                            key={i} 
                            active={pagination.currentPage === i + 1}
                            onClick={() => handlePageChange(i + 1)}
                        >
                            {i + 1}
                        </PaginationBtn>
                    ))}

                    <PaginationBtn 
                        disabled={pagination.currentPage === pagination.totalPages}
                        onClick={() => handlePageChange(pagination.currentPage + 1)}
                    >
                        <ChevronRightIcon sx={{ fontSize: '1.25rem' }} />
                    </PaginationBtn>
                </Box>
            </Box>
        </Box>
    );
};

export default Report;