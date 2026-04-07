import React, { useState } from 'react';
import { 
    Box, Typography, TextField, Button, CircularProgress, 
    RadioGroup, FormControlLabel, Radio, Paper, Grid
} from '@mui/material';
import StarRating10 from './StarRating10';
import { ROUND_NAMES } from '../../constants/roundConstants';

const PRIMARY = '#3b4eba';

const UniversalFeedbackForm = ({ 
    initialData = {}, 
    isPublic = false, 
    onSubmit, 
    onCancel, 
    submitting = false,
    error = '' 
}) => {
    const [form, setForm] = useState({
        candidateName: initialData.candidateName || '',
        interviewerName: initialData.interviewerName || '',
        interviewDateTime: initialData.interviewDateTime || '',
        positionAppliedFor: initialData.positionAppliedFor || '',
        interviewStage: initialData.interviewStage || '',
        educationalBackground: 0,
        priorWorkExperience: 0,
        technicalQualifications: 0,
        verbalCommunication: 0,
        candidateInterest: 0,
        teambuildingSkills: 0,
        overallRating: 0,
        detailedComments: '',
        overallRecommendation: '',
        keyStrengths: '',
        areasForImprovement: ''
    });

    const [validationError, setValidationError] = useState('');

    const handleChange = (field, value) => {
        setForm(prev => ({ ...prev, [field]: value }));
        if (validationError) setValidationError('');
    };

    const handleSubmit = () => {
        if (!isPublic) {
            // Internal validation: all star ratings required + recommendation
            if (
                !form.educationalBackground || !form.priorWorkExperience || 
                !form.technicalQualifications || !form.verbalCommunication || 
                !form.candidateInterest || !form.teambuildingSkills || !form.overallRating
            ) {
                setValidationError("Please fill out all numerical ratings (1-10).");
                return;
            }
            if (!form.overallRecommendation) {
                setValidationError("Please select an Overall Recommendation.");
                return;
            }
        } else {
            // Public validation: Only Overall Rating is required
            if (!form.overallRating) {
                setValidationError("Please provide an Overall Rating.");
                return;
            }
        }
        onSubmit(form);
    };

    // Shared input props for read-only fields
    const readOnlyInputProps = { 
        readOnly: true, 
        style: { backgroundColor: '#f8fafc', color: '#475569', fontWeight: 600 } 
    };

    return (
        <Paper elevation={0} sx={{ p: 4, borderRadius: '12px', border: '1px solid #e2e8f0', bgcolor: 'white' }}>
            <Typography sx={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', mb: 3 }}>
                Candidate Interview Feedback
            </Typography>

            <Grid container spacing={3}>
                {/* 1. Candidate Name */}
                <Grid item xs={12} sm={6}>
                    <TextField 
                        fullWidth 
                        label="1. Candidate Name" 
                        value={form.candidateName}
                        InputProps={readOnlyInputProps}
                        variant="outlined"
                        size="small"
                        focused={false}
                    />
                </Grid>

                {/* 2. Interviewer Name */}
                <Grid item xs={12} sm={6}>
                    <TextField 
                        fullWidth 
                        label="2. Name of Interviewer" 
                        value={form.interviewerName}
                        onChange={(e) => handleChange('interviewerName', e.target.value)}
                        InputProps={!isPublic ? readOnlyInputProps : undefined}
                        variant="outlined"
                        size="small"
                        placeholder="Enter your name"
                        focused={!isPublic ? false : undefined}
                    />
                </Grid>

                {/* 3. Interview Date and Time */}
                <Grid item xs={12} sm={6}>
                    <TextField 
                        fullWidth 
                        label="3. Interview Date and Time" 
                        type="datetime-local"
                        InputLabelProps={{ shrink: true }}
                        value={form.interviewDateTime}
                        onChange={(e) => handleChange('interviewDateTime', e.target.value)}
                        variant="outlined"
                        size="small"
                    />
                </Grid>

                {/* 4. Position Applied For */}
                <Grid item xs={12} sm={6}>
                    <TextField 
                        fullWidth 
                        label="4. Position Applied For" 
                        value={form.positionAppliedFor}
                        InputProps={readOnlyInputProps}
                        variant="outlined"
                        size="small"
                        focused={false}
                    />
                </Grid>

                {/* 5. Interview Stage */}
                <Grid item xs={12}>
                    <Box sx={{ p: 2, bgcolor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                        <Typography sx={{ fontSize: '0.875rem', fontWeight: 700, color: '#475569', mb: 1 }}>
                            5. Interview Stage
                        </Typography>
                        <RadioGroup row value={form.interviewStage}>
                            {[...ROUND_NAMES, form.interviewStage]
                                .filter((v, i, a) => a.indexOf(v) === i && v)
                                .map(stage => (
                                    <FormControlLabel 
                                        key={stage} 
                                        value={stage} 
                                        control={<Radio disabled sx={{ color: '#cbd5e1', '&.Mui-checked': { color: PRIMARY } }} />} 
                                        label={<Typography sx={{ fontSize: '0.875rem', fontWeight: stage === form.interviewStage ? 700 : 500, color: stage === form.interviewStage ? '#0f172a' : '#64748b' }}>{stage}</Typography>} 
                                    />
                                ))}
                        </RadioGroup>
                    </Box>
                </Grid>
            </Grid>

            {/* Ratings Section */}
            <Box sx={{ mt: 5 }}>
                <Typography sx={{ fontSize: '1rem', fontWeight: 800, color: '#3b4eba', mb: 3, pb: 1, borderBottom: '2px solid #e2e8f0' }}>
                    Evaluation Ratings (1 = Poor, 10 = Excellent)
                </Typography>

                {/* 6. Educational Background */}
                <StarRating10 
                    label="6. Educational Background" 
                    description="Does the candidate have the appropriate educational qualifications or training for this position?" 
                    value={form.educationalBackground} 
                    onChange={(v) => handleChange('educationalBackground', v)} 
                    required={!isPublic}
                />

                {/* 7. Prior Work Experience */}
                <StarRating10 
                    label="7. Prior Work Experience" 
                    description="Has the candidate acquired similar skills or qualifications through past work experiences?" 
                    value={form.priorWorkExperience} 
                    onChange={(v) => handleChange('priorWorkExperience', v)} 
                    required={!isPublic}
                />

                {/* 8. Technical Qualifications */}
                <StarRating10 
                    label="8. Technical Qualifications/Knowledge/Experience" 
                    description="Does the candidate have the technical skills necessary for this position?" 
                    value={form.technicalQualifications} 
                    onChange={(v) => handleChange('technicalQualifications', v)} 
                    required={!isPublic}
                />

                {/* 9. Verbal Communication Skill */}
                <StarRating10 
                    label="9. Verbal Communication Skill" 
                    description="How were the candidate's communication skills during the interview?" 
                    value={form.verbalCommunication} 
                    onChange={(v) => handleChange('verbalCommunication', v)} 
                    required={!isPublic}
                />

                {/* 10. Candidate Interest / Gesture */}
                <StarRating10 
                    label="10. Candidate Interest / Gesture" 
                    description="How much interest did the candidate show in the position and the organization?" 
                    value={form.candidateInterest} 
                    onChange={(v) => handleChange('candidateInterest', v)} 
                    required={!isPublic}
                />

                {/* 11. Teambuilding/Interpersonal Skills */}
                <StarRating10 
                    label="11. Teambuilding/Interpersonal Skills" 
                    description="Did the candidate demonstrate, through their answers, good teambuilding/interpersonal skills?" 
                    value={form.teambuildingSkills} 
                    onChange={(v) => handleChange('teambuildingSkills', v)} 
                    required={!isPublic}
                />

                {/* 12. Overall Rating */}
                <StarRating10 
                    label="12. Overall Rating" 
                    description="Overall impression of the candidate's performance." 
                    value={form.overallRating} 
                    onChange={(v) => handleChange('overallRating', v)} 
                    required={true} // Overall is always required
                />
            </Box>

            <Box sx={{ mt: 5, display: 'flex', flexDirection: 'column', gap: 4 }}>
                {/* 13. Detailed Comments */}
                <Box>
                    <Typography sx={{ fontSize: '0.875rem', fontWeight: 700, color: '#334155', mb: 1 }}>
                        13. Detailed Comments on Candidate's Performance
                    </Typography>
                    <TextField
                        fullWidth multiline minRows={4}
                        placeholder="Provide detailed comments..."
                        value={form.detailedComments}
                        onChange={e => handleChange('detailedComments', e.target.value)}
                        sx={{ bgcolor: '#f8fafc', '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                    />
                </Box>

                {/* 14. Overall Recommendation */}
                <Box>
                    <Typography sx={{ fontSize: '0.875rem', fontWeight: 700, color: '#334155', mb: 1 }}>
                        14. Overall Recommendation {!isPublic && <span style={{ color: '#ef4444' }}>*</span>}
                    </Typography>
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
                        {['Shortlisted', 'On-hold', 'Rejected but can be re-approached in future', 'Rejected-Poor Rating'].map(rec => (
                            <Box 
                                key={rec} 
                                onClick={() => handleChange('overallRecommendation', rec)}
                                sx={{
                                    p: 1.5, borderRadius: '8px', cursor: 'pointer',
                                    border: `2px solid ${form.overallRecommendation === rec ? PRIMARY : '#e2e8f0'}`,
                                    bgcolor: form.overallRecommendation === rec ? 'rgba(59,78,186,0.05)' : 'white',
                                    fontWeight: form.overallRecommendation === rec ? 700 : 500,
                                    color: form.overallRecommendation === rec ? PRIMARY : '#475569',
                                    transition: 'all 0.15s', textAlign: 'center', fontSize: '0.875rem'
                                }}
                            >
                                {rec}
                            </Box>
                        ))}
                    </Box>
                </Box>

                <Grid container spacing={3}>
                    {/* 15. Key Strengths */}
                    <Grid item xs={12} md={6}>
                        <Typography sx={{ fontSize: '0.875rem', fontWeight: 700, color: '#334155', mb: 1 }}>
                            15. Key Strengths Observed
                        </Typography>
                        <TextField
                            fullWidth multiline minRows={3}
                            placeholder="E.g., Strong technical knowledge, great communicator..."
                            value={form.keyStrengths}
                            onChange={e => handleChange('keyStrengths', e.target.value)}
                            sx={{ bgcolor: '#f8fafc', '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                        />
                    </Grid>

                    {/* 16. Areas for Improvement */}
                    <Grid item xs={12} md={6}>
                        <Typography sx={{ fontSize: '0.875rem', fontWeight: 700, color: '#334155', mb: 1 }}>
                            16. Areas for Improvement / Concerns
                        </Typography>
                        <TextField
                            fullWidth multiline minRows={3}
                            placeholder="E.g., Lacks experience with X framework..."
                            value={form.areasForImprovement}
                            onChange={e => handleChange('areasForImprovement', e.target.value)}
                            sx={{ bgcolor: '#f8fafc', '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                        />
                    </Grid>
                </Grid>
            </Box>

            {/* Error / Error display */}
            {(error || validationError) && (
                <Box sx={{ mt: 3, p: 2, bgcolor: '#fff1f2', borderRadius: '8px', border: '1px solid #fecdd3' }}>
                    <Typography sx={{ color: '#be123c', fontSize: '0.875rem', fontWeight: 600 }}>
                        {validationError || error}
                    </Typography>
                </Box>
            )}

            {/* Actions */}
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 4, pt: 3, borderTop: '1px solid #f1f5f9' }}>
                {onCancel && (
                    <Button onClick={onCancel} sx={{ color: '#64748b', fontWeight: 700 }}>
                        Cancel
                    </Button>
                )}
                <Button 
                    variant="contained" 
                    onClick={handleSubmit} 
                    disabled={submitting}
                    sx={{ bgcolor: PRIMARY, fontWeight: 700, px: 4, borderRadius: '8px', '&:hover': { bgcolor: '#2f3da0' } }}
                >
                    {submitting ? <CircularProgress size={20} color="inherit" /> : 'Submit Feedback'}
                </Button>
            </Box>
        </Paper>
    );
};

export default UniversalFeedbackForm;
