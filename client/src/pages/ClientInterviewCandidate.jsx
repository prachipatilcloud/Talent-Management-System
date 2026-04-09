import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Box, Typography, Paper, TextField, Button, CircularProgress, Avatar, Rating } from '@mui/material';
import API from '../api/axios';
import UniversalFeedbackForm from '../components/common/UniversalFeedbackForm';

const PRIMARY = '#3b4eba';

const getAvatarColor = (name) => {
    const colors = ['#4f46e5', '#0891b2', '#059669', '#d97706', '#dc2626', '#7c3aed'];
    return colors[(name?.charCodeAt(0) || 0) % colors.length];
};

const ClientInterviewCandidate = () => {
    const { id } = useParams();
    const [candidate, setCandidate] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [submitting, setSubmitting] = useState(false);
    const [submitSuccess, setSubmitSuccess] = useState(false);
    const [submitError, setSubmitError] = useState('');

    useEffect(() => {
        const fetchCandidate = async () => {
            try {
                const res = await API.get(`/public/candidate/${id}`);
                setCandidate(res.data.candidate);
            } catch (err) {
                console.error(err);
                setError('Failed to load candidate profile. It may be unavailable.');
            } finally {
                setLoading(false);
            }
        };
        fetchCandidate();
    }, [id]);

    const handleSubmit = async (formData) => {
        setSubmitError('');

        setSubmitting(true);
        try {
            await API.post(`/public/candidate/${id}/client-feedback`, formData);
            setSubmitSuccess(true);
        } catch (err) {
            setSubmitError('Failed to submit feedback. Please try again later.');
            console.error(err);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', bgcolor: '#f8fafc' }}>
                <CircularProgress sx={{ color: PRIMARY }} />
            </Box>
        );
    }

    if (error || !candidate) {
        return (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', bgcolor: '#f8fafc' }}>
                <Typography color="error" variant="h6">{error || 'Candidate not found'}</Typography>
            </Box>
        );
    }

    const { firstName, lastName, jobRole, skills, interviewRounds, resume } = candidate;
    const avatarBg = getAvatarColor(firstName);
    const initials = `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();

    return (
        <Box sx={{ minHeight: '100vh', bgcolor: '#f8fafc', py: 5, px: 2 }}>
            <Box sx={{ maxWidth: 800, mx: 'auto', display: 'flex', flexDirection: 'column', gap: 3 }}>

                {/* Header Profile */}
                <Paper elevation={0} sx={{ p: 4, borderRadius: '16px', border: '1px solid #e2e8f0', bgcolor: 'white' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                        <Avatar sx={{
                            width: 80, height: 80, borderRadius: '16px', bgcolor: `${avatarBg}15`,
                            color: avatarBg, fontSize: '2rem', fontWeight: 900, border: `1px solid ${avatarBg}30`
                        }}>
                            {initials}
                        </Avatar>
                        <Box>
                            <Typography sx={{ fontSize: '1.5rem', fontWeight: 900, color: '#0f172a' }}>
                                {firstName} {lastName}
                            </Typography>
                            <Typography sx={{ fontSize: '1rem', color: PRIMARY, fontWeight: 700, mt: 0.5 }}>
                                {jobRole}
                            </Typography>
                            {resume?.url && (
                                <Button
                                    variant="outlined"
                                    size="small"
                                    href={resume.url}
                                    target="_blank"
                                    sx={{ mt: 1.5, textTransform: 'none', borderRadius: '8px' }}
                                >
                                    View / Download Resume
                                </Button>
                            )}
                        </Box>
                    </Box>

                    {skills && skills.length > 0 && (
                        <Box sx={{ mt: 4 }}>
                            <Typography sx={{ fontSize: '0.875rem', fontWeight: 800, color: '#0f172a', mb: 1 }}>KEY SKILLS</Typography>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                {skills.map(skill => (
                                    <Box key={skill} sx={{
                                        px: 1.5, py: 0.5, borderRadius: '999px', fontSize: '0.75rem', fontWeight: 700,
                                        bgcolor: '#f1f5f9', color: '#475569', border: `1px solid #e2e8f0`
                                    }}>
                                        {skill}
                                    </Box>
                                ))}
                            </Box>
                        </Box>
                    )}
                </Paper>

                {/* Interview Rounds Summary */}
                <Paper elevation={0} sx={{ p: 4, borderRadius: '16px', border: '1px solid #e2e8f0', bgcolor: 'white' }}>
                    <Typography sx={{ fontSize: '1.125rem', fontWeight: 800, color: '#0f172a', mb: 2 }}>Interview Rounds Summary</Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        {interviewRounds && interviewRounds.length > 0 ? interviewRounds.map((round, idx) => (
                            <Box key={idx} sx={{ p: 2, borderRadius: '12px', border: '1px solid #e2e8f0', bgcolor: '#f8fafc' }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Typography sx={{ fontWeight: 700, color: '#0f172a' }}>{round.roundName}</Typography>
                                    <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: round.status === 'passed' ? '#15803d' : (round.status === 'rejected' ? '#be123c' : '#64748b'), textTransform: 'uppercase' }}>
                                        {round.status}
                                    </Typography>
                                </Box>
                                {(round.status === 'passed' && round.feedback?.rating) && (
                                    <Typography sx={{ fontSize: '0.875rem', color: '#475569', mt: 1 }}>
                                        Rating: {round.feedback.rating} / 5
                                    </Typography>
                                )}
                            </Box>
                        )) : (
                            <Typography sx={{ fontSize: '0.875rem', color: '#64748b' }}>No rounds recorded yet.</Typography>
                        )}
                    </Box>
                </Paper>

                {/* Feedback Form */}
                {submitSuccess ? (
                    <Paper elevation={0} sx={{ p: 4, borderRadius: '16px', border: '1px solid #e2e8f0', bgcolor: 'white' }}>
                        <Typography sx={{ fontSize: '1.125rem', fontWeight: 800, color: '#0f172a', mb: 3 }}>Client Feedback</Typography>
                        <Box sx={{ p: 3, borderRadius: '12px', bgcolor: '#f0fdf4', border: '1px solid #bbf7d0', textAlign: 'center' }}>
                            <Typography sx={{ color: '#15803d', fontWeight: 700, mb: 1 }}>Thank you!</Typography>
                            <Typography sx={{ color: '#166534', fontSize: '0.875rem' }}>Your feedback has been successfully submitted.</Typography>
                        </Box>
                    </Paper>
                ) : (
                    <UniversalFeedbackForm
                        isPublic={true}
                        submitting={submitting}
                        error={submitError}
                        onSubmit={handleSubmit}
                        initialData={{
                            candidateName: `${firstName} ${lastName}`,
                            positionAppliedFor: jobRole,
                            interviewStage: 'Round 3'
                        }}
                    />
                )}

            </Box>
        </Box>
    );
};

export default ClientInterviewCandidate;
