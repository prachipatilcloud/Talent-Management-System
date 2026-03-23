import { ChevronLeft, NoteAdd } from '@mui/icons-material';
import API from '../../api/axios';
import { Box, Button, CircularProgress, Paper, TextField, Typography } from '@mui/material';
import { useEffect, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom';


const PRIMARY = '#3b4eba';

const SUGGESTED_TAGS = [
    'Technical Interview', 'Leadership', 'Communication', 'Problem Solving'
];

const formatDateTime = (d) =>
    d ? new Date(d).toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
    }) : '—';

const AddNotes = () => {

    const navigate = useNavigate();
    const location = useLocation();
    const { id, roundId } = useParams();

    const basePath = location.pathname.startsWith('/admin') ? '/admin' : '/hr';
    const prefilled = location.state || {};

    //State for candidate selection (if not prefilled)
    const [candidate, setCandidate] = useState(prefilled.candidate || null);
    const [round, setRound] = useState(prefilled.round || null);
    const [notes, setNotes] = useState('');
    const [tags, setTags] = useState([]);
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        if (candidate && round) return;
        setFetching(true);
        API.get(`/candidates/${id}`)
            .then(res => {
                const c = res.data.candidate;
                setCandidate(c);
                const r = c.interviewRounds?.find(r => r._id === roundId);
                if (r) {
                    setRound(r);
                    setNotes(r.notes || '');
                    setTags(r.tags || []);
                }
            })
            .catch(err => setError('Failed to load candidate details.'))
            .finally(() => setFetching(false));
    }, [id, roundId])

    useEffect(() => {
        if (round) {
            setNotes(round.notes || '')
            setTags(round.tags || [])

        }
    }, [round])


    // Helpers
    const toggleTag = (tag) => {
        setTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag])
    }

    // -----submit---------
    const handleSubmit = async () => {
        if (!notes.trim() && tags.length === 0) {
            setError('Please add notes or select at least one tag.');
            return;
        }
        setLoading(true);
        setError('');
        try {
            await API.patch(`/candidates/${id}/rounds/${roundId}/notes`, { notes, tags })
            setSuccess(true);
            setTimeout(() => {
                navigate(`${basePath}/candidates/${id}`);
            }, 1200);

        } catch (err) {
            setError(err.response?.data?.message || 'Failed to save notes.');
        } finally {
            setLoading(false);
        }
    }

    if (fetching) return (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            <CircularProgress sx={{ color: PRIMARY }} />
        </Box>
    )

    return (
        <Box sx={{ height: '100%', overflow: 'auto', bgcolor: '#f6f6f8' }}>
            <Box sx={{ maxWidth: '700', mx: 'auto', px: 4, py: 5 }}>

                {/* Back Nav */}
                <Box onClick={() => navigate(-1)} sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 0.25,
                    color: PRIMARY,
                    fontWeight: 600,
                    fontSize: '0.9rem',
                    cursor: 'pointer',
                    mb: 3,
                    '&:hover': {
                        textDecoration: 'underline'
                    },
                }}>
                    <ChevronLeft sx={{ fontSize: 20 }} /> Back
                </Box>
                <Paper elevation={0} sx={{
                    borderRadius: '16px', border: '1px solid #e2e8f0',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                    bgcolor: 'white',
                    overflow: 'hidden',
                }}>

                    {/* Header */}
                    <Box sx={{
                        px: 5, pt: 5, pb: 4,
                        background: `linear-gradient(135deg, ${PRIMARY}08 0%, transparent 60%)`,
                        borderBottom: '1px solid #f1f5f9'
                    }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                            <Box sx={{
                                width: 40, height: 40,
                                borderRadius: '10px', bgcolor: `${PRIMARY}15`,
                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}>
                                <NoteAdd sx={{ fontSize: 22, color: PRIMARY }} />
                            </Box>
                            <Box>
                                <Typography sx={{
                                    fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em'
                                }}>
                                    Add Notes
                                </Typography>
                                {candidate && (
                                    <Typography sx={{
                                        color: '#64748b',
                                        fontSize: '0.8125rem',
                                        ml: 0.25
                                    }}>
                                        {candidate.firstName} {candidate.lastName} . {round?.roundName}
                                    </Typography>
                                )}
                            </Box>
                        </Box>
                    </Box>

                    {/* -------form content------------ */}
                    <Box sx={{ px: 5, py: 4, display: 'flex', flexDirection: 'column', gap: 3.5 }}>
                        {round && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2, borderRadius: '10px', border: `2px solid ${PRIMARY}05` }}>
                                <Box sx={{
                                    width: 42, height: 42, borderRadius: '10px', flexShrink: 0,
                                    bgcolor: `${PRIMARY}15`, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                }}>
                                    <Typography sx={{ fontSize: '1.25rem' }}>📋</Typography>
                                </Box>
                                <Box sx={{ flex: 1 }}>
                                    <Typography sx={{ fontWeight: 700, fontSize: '0.9375rem', color: '#0f172a' }}>
                                        {round.roundName}
                                    </Typography>
                                    <Typography sx={{ fontSize: '0.75rem', color: '#64748b' }}>
                                        {round.interviewMode} . {formatDateTime(round.scheduledDate)}
                                    </Typography>
                                </Box>
                                <Box sx={{
                                    px: 1.25, py: 0.25, borderRadius: '6px',
                                    bgcolor: '#fefce8', color: '#a16207', border: '1px solid #fef08a',
                                    fontSize: '0.625rem', fontWeight: 800, letterSpacing: '0.04rem',
                                }}>
                                    {round.status?.toUpperCase() || 'PENDING'}
                                </Box>
                            </Box>
                        )}

                        {/* ── Divider ── */}
                        <Box sx={{ borderTop: '1px solid #f1f5f9' }} />

                        {/* Notes */}
                        <Box>
                            <Typography sx={{
                                fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase', color: '#94a3b8', letterSpacing: '0.08em', mb: 1.25,
                            }}>
                                Note Content
                            </Typography>
                            <TextField
                                fullWidth multiline minRows={5}
                                placeholder='Type your notes here... e.g. candidate prefers morning slots, focus on system design questions'
                                value={notes}
                                onChange={(e) => {
                                    setNotes(e.target.value)
                                    if (error) setError('')
                                }
                                }
                                autoComplete='off'
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        borderRadius: '8px', fontSize: '0.875rem', bgcolor: '#f8fafc',
                                        '& fieldset': { borderColor: '#e2e8f0' },
                                        '&:hover fieldset': { borderColor: PRIMARY },
                                        '&.Mui-focused fieldset': { borderColor: PRIMARY, borderWidth: 2 },
                                    },
                                }}
                            />
                        </Box>
                        {/* ── Divider ── */}
                        <Box sx={{ borderTop: '1px solid #f1f5f9' }} />

                        {/* Tags */}
                        <Box>
                            <Typography sx={{
                                fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase', color: '#94a3b8', letterSpacing: '0.08em', mb: 1.25,
                            }}>
                                Assign Tags
                            </Typography>

                            {/* Selected Tags */}
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                                {tags.length === 0 ? (
                                    <Typography sx={{
                                        color: '#94a3b8',
                                        fontSize: '0.8125rem',
                                    }}>
                                        No tags selected — pick from suggestions below
                                    </Typography>
                                ) : tags.map(tag => (
                                    <Box key={tag} sx={{
                                        display: 'flex', alignItems: 'center', gap: 0.75,
                                        px: 1.5, py: 0.5, borderRadius: '999px',
                                        bgcolor: `${PRIMARY}10`, border: `1px solid ${PRIMARY}25`,
                                    }}>
                                        <Typography sx={{ fontSize: '0.75rem', color: '#64748b' }}>
                                            {tag}
                                        </Typography>
                                        <Box onClick={() => toggleTag(tag)} sx={{
                                            display: 'flex', cursor: 'pointer', color: PRIMARY, opacity: 0.7,
                                            '&:hover': { opacity: 1 }, fontSize: '0.75rem', ml: 0.25,
                                        }}>
                                            ✕
                                        </Box>
                                    </Box>
                                ))
                                }
                            </Box>

                            {/* Suggested Tags */}
                            <Box sx={{ bgcolor: '#f8fafc', p: 2, borderRadius: '10px', border: '1px solid #e2e8e0' }}>
                                <Typography sx={{
                                    fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase',
                                    letterSpacing: '0.08em', color: '#94a3b8', mb: 1.25,
                                }}>
                                    Suggested
                                </Typography>
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                    {SUGGESTED_TAGS.map(tag => {
                                        const selected = tags.includes(tag);
                                        return (
                                            <Box key={tag}
                                                onClick={() => toggleTag(tag)}
                                                sx={{
                                                    px: 1.5, py: 0.5, borderRadius: '6px', cursor: 'pointer',
                                                    transition: 'all 0.15s', fontSize: '0.8125rem', fontWeight: 600,
                                                    border: `2px solid ${selected ? PRIMARY : '#64748b'}`,
                                                    bgcolor: selected ? `${PRIMARY}08` : 'white',
                                                    color: selected ? PRIMARY : '#64748b',
                                                    '&:hover': {
                                                        borderColor: PRIMARY,
                                                        color: PRIMARY,
                                                    }
                                                }}>
                                                {tag}
                                            </Box>
                                        )
                                    })}
                                </Box>
                            </Box>
                        </Box>

                        {/* Error */}
                        {error && (
                            <Box sx={{ p: 2, bgcolor: '#fff1f2', borderRadius: '8px', border: '1px solid #fecdd3' }}>
                                <Typography sx={{ fontSize: '0.875rem', color: '#be123c', fontWeight: 500 }}>
                                    {error}
                                </Typography>
                            </Box>
                        )}

                        {/* Success */}
                        {success && (
                            <Box sx={{ p: 2, bgcolor: '#fff1f2', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
                                <Typography sx={{ fontSize: '0.875rem', color: '#15803d', fontWeight: 500 }}>
                                    Notes saved successfully! Redirecting...
                                </Typography>
                            </Box>
                        )}

                        {/* Footer Buttons */}
                        <Box sx={{ borderTop: '1px solid #f1f5f9', pt: 2, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>

                            {/* Clear button only show if round already has notes/tags  */}
                            <Box>
                                {(round?.notes || round?.tags?.length > 0) && (
                                    <Button
                                        onClick={async () => {
                                            setLoading(true);
                                            setError('');
                                            try {
                                                await API.patch(`/candidates/${id}/rounds/${roundId}/notes`, { notes: '', tags: [] })
                                                setNotes('');
                                                setTags([]);
                                                setRound(prev => ({ ...prev, notes: '', tags: [] }));
                                            } catch (err) {
                                                setError(err.response?.data?.message || 'Failed to clear notes.');
                                            } finally {
                                                setLoading(false);
                                            }
                                        }}
                                        sx={{
                                            textTransform: 'none', color: '#be123c', fontWeight: 600,
                                            fontSize: '0.9rem', px: 3, py: 1.25, borderRadius: '8px',
                                            '&:hover': { bgcolor: '#ffe4e6' },
                                            border: `1px solid #fecdd3`, bgcolor: '#fff1f2',
                                        }}
                                    >
                                        Clear Notes & Tags
                                    </Button>
                                )}
                            </Box>

                            <Box sx={{ display: 'flex', gap: 2 }}>
                                <Button onClick={() => navigate(-1)} sx={{
                                    textTransform: 'none', color: '#64748b', fontWeight: 600,
                                    fontSize: '0.9rem', px: 3, py: 1.25, borderRadius: '8px',
                                    '&:hover': { bgcolor: '#f1f5f9' }
                                }}>
                                    Close
                                </Button>
                                <Button variant='contained' onClick={handleSubmit} disabled={loading || success}
                                    sx={{
                                        textTransform: 'none', fontWeight: 700, fontSize: '0.9rem',
                                        px: 4, py: 1.25, borderRadius: '8px', bgcolor: PRIMARY,
                                        boxShadow: '0 4px 14px rgba(59,78,186,0.25)',
                                        '&:hover': { bgcolor: '#2f3da0', transform: 'translateY(-1px)' },
                                        '&.Mui-disabled': { bgcolor: '#93c5fd', color: 'white' },
                                        transition: 'all 0.2s',
                                    }}>
                                    {loading ? <CircularProgress size={18} sx={{ color: 'white' }} /> : 'Save Notes'}
                                </Button>
                            </Box>

                        </Box>

                    </Box>
                </Paper>
            </Box>
        </Box>
    )
}

export default AddNotes;