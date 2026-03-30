import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
    Box,
    Card,
    CardContent,
    TextField,
    Button,
    Typography,
    Alert,
    CircularProgress,
    Checkbox,
    FormControlLabel,
    Divider,
    IconButton,
    InputAdornment,
    Snackbar,
    Link,
} from '@mui/material';
import {
    AccountTree,
    Visibility,
    VisibilityOff,
    ArrowForward,
    ErrorOutline,
    VerifiedUser,
} from '@mui/icons-material';

const PRIMARY = '#3b4eba';

const LoginPage = () => {
    const { login } = useAuth();
    const navigate = useNavigate();

    const [form, setForm] = useState({ email: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [remember, setRemember] = useState(false);
    const [snackbar, setSnackbar] = useState(false);

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();        
        setLoading(true);
        try {
            const data = await login(form.email, form.password);
            if (data.user.role === 'admin') navigate('/admin');
            else if (data.user.role === 'hr') navigate('/hr/dashboard');
            else navigate('/interviewer/dashboard');

        } catch (err) {
            const msg = err.response?.data?.message || 'Invalid credentials. Please try again.';
            setError(msg);
            setSnackbar(true);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box
            sx={{
                minHeight: '100vh',
                bgcolor: '#f6f6f8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                p: 2,
                fontFamily: 'Inter, sans-serif',
            }}
        >
            <Box sx={{ width: '100%', maxWidth: 450 }}>

                {/* ── Branding ── */}
                <Box sx={{ textAlign: 'center', mb: 4 }}>
                    <Box
                        sx={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: 64,
                            height: 64,
                            bgcolor: PRIMARY,
                            borderRadius: '12px',
                            mb: 1.5,
                            boxShadow: `0 10px 25px rgba(59,78,186,0.25)`,
                        }}
                    >
                        <AccountTree sx={{ color: 'white', fontSize: 32 }} />
                    </Box>
                    <Typography variant="h5" fontWeight={700} color="#0f172a">
                        TalentFlow ATS
                    </Typography>
                    <Typography variant="body2" color="#64748b" mt={0.5}>
                        Enterprise Talent Management System
                    </Typography>
                </Box>

                {/* ── Card ── */}
                <Card
                    elevation={0}
                    sx={{
                        borderRadius: '8px',
                        border: '1px solid #e2e8f0',
                        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.07), 0 2px 4px -1px rgba(0,0,0,0.04)',
                        overflow: 'hidden',
                    }}
                >
                    <CardContent sx={{ p: 4 }}>

                        {/* Heading */}
                        <Box mb={3}>
                            <Typography variant="h6" fontWeight={600} color="#0f172a">
                                Welcome back
                            </Typography>
                            <Typography variant="body2" color="#64748b" mt={0.5}>
                                Sign in to manage your talent pipeline
                            </Typography>
                        </Box>

                        {/* Error Alert */}
                        {error && (
                            <Alert
                                severity="error"
                                icon={<ErrorOutline fontSize="small" />}
                                sx={{ mb: 2.5, borderRadius: '8px', fontSize: '0.875rem' }}
                            >
                                {error}
                            </Alert>
                        )}

                        {/* Form */}
                        <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>

                            {/* Email */}
                            <Box>
                                <Typography variant="body2" fontWeight={500} color="#374151" mb={0.75}>
                                    Email Address
                                </Typography>
                                <TextField
                                    name="email"
                                    type="email"
                                    placeholder="name@company.com"
                                    value={form.email}
                                    onChange={handleChange}
                                    required
                                    fullWidth
                                    autoComplete="email"
                                    size="medium"
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            borderRadius: '8px',
                                            '&:hover fieldset': { borderColor: PRIMARY },
                                            '&.Mui-focused fieldset': { borderColor: PRIMARY },
                                        },
                                    }}
                                />
                            </Box>

                            {/* Password */}
                            <Box>
                                <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.75}>
                                    <Typography variant="body2" fontWeight={500} color="#374151">
                                        Password
                                    </Typography>
                                    <Link href="#" underline="hover" sx={{ fontSize: '0.75rem', fontWeight: 600, color: PRIMARY }}>
                                        Forgot Password?
                                    </Link>
                                </Box>
                                <TextField
                                    name="password"
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="••••••••"
                                    value={form.password}
                                    onChange={handleChange}
                                    required
                                    fullWidth
                                    size="medium"
                                    autoComplete="current-password"
                                    InputProps={{
                                        endAdornment: (
                                            <InputAdornment position="end">
                                                <IconButton
                                                    onClick={() => setShowPassword(!showPassword)}
                                                    edge="end"
                                                    size="small"
                                                    sx={{ color: '#94a3b8' }}
                                                >
                                                    {showPassword
                                                        ? <VisibilityOff fontSize="small" />
                                                        : <Visibility fontSize="small" />
                                                    }
                                                </IconButton>
                                            </InputAdornment>
                                        ),
                                    }}
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            borderRadius: '8px',
                                            '&:hover fieldset': { borderColor: PRIMARY },
                                            '&.Mui-focused fieldset': { borderColor: PRIMARY },
                                        },
                                    }}
                                />
                            </Box>

                            {/* Remember Me */}
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        checked={remember}
                                        onChange={(e) => setRemember(e.target.checked)}
                                        size="small"
                                        sx={{
                                            color: '#cbd5e1',
                                            '&.Mui-checked': { color: PRIMARY },
                                        }}
                                    />
                                }
                                label={
                                    <Typography variant="body2" color="#64748b">
                                        Keep me signed in for 30 days
                                    </Typography>
                                }
                                sx={{ m: 0 }}
                            />

                            {/* Submit Button */}
                            <Button
                                type="submit"
                                variant="contained"
                                fullWidth
                                disabled={loading}
                                endIcon={!loading && (
                                    <ArrowForward sx={{ fontSize: '1rem !important' }} />
                                )}
                                sx={{
                                    bgcolor: PRIMARY,
                                    py: 1.5,
                                    borderRadius: '8px',
                                    fontWeight: 600,
                                    fontSize: '0.9375rem',
                                    textTransform: 'none',
                                    boxShadow: `0 4px 14px rgba(59,78,186,0.3)`,
                                    '&:hover': {
                                        bgcolor: `rgba(59,78,186,0.9)`,
                                        boxShadow: `0 6px 20px rgba(59,78,186,0.4)`,
                                    },
                                    '&.Mui-disabled': {
                                        bgcolor: `rgba(59,78,186,0.6)`,
                                        color: 'white',
                                    },
                                }}
                            >
                                {loading
                                    ? <CircularProgress size={20} sx={{ color: 'white' }} />
                                    : 'Sign In'
                                }
                            </Button>
                        </Box>

                        {/* Divider */}
                        <Divider sx={{ my: 3, fontSize: '0.875rem', color: '#64748b' }}>
                            Or continue with
                        </Divider>

                        {/* Google SSO */}
                        <Button
                            fullWidth
                            variant="outlined"
                            startIcon={
                                <img
                                    src="https://www.google.com/favicon.ico"
                                    alt="Google"
                                    style={{ width: 18, height: 18 }}
                                />
                            }
                            sx={{
                                borderColor: '#e2e8f0',
                                color: '#374151',
                                borderRadius: '8px',
                                textTransform: 'none',
                                fontWeight: 500,
                                py: 1,
                                '&:hover': {
                                    borderColor: '#cbd5e1',
                                    bgcolor: '#f8fafc',
                                },
                            }}
                        >
                            Google SSO
                        </Button>
                    </CardContent>

                    {/* Card Footer */}
                    <Box
                        sx={{
                            bgcolor: '#f8fafc',
                            px: 4,
                            py: 1.5,
                            textAlign: 'center',
                            borderTop: '1px solid #f1f5f9',
                        }}
                    >
                        <Typography variant="caption" color="#64748b">
                            Trouble signing in?{' '}
                            <Link href="#" underline="hover" sx={{ color: PRIMARY, fontWeight: 500 }}>
                                Contact Support
                            </Link>
                        </Typography>
                    </Box>
                </Card>

                {/* Security Note */}
                <Box sx={{ textAlign: 'center', mt: 3 }}>
                    <Box display="flex" alignItems="center" justifyContent="center" gap={0.5}>
                        <VerifiedUser sx={{ fontSize: 12, color: '#94a3b8' }} />
                        <Typography
                            sx={{
                                fontSize: '0.625rem',
                                textTransform: 'uppercase',
                                letterSpacing: '0.1em',
                                color: '#94a3b8',
                                fontWeight: 700,
                            }}
                        >
                            Authorized Personnel Only
                        </Typography>
                    </Box>
                    <Typography
                        sx={{
                            mt: 1,
                            fontSize: '0.625rem',
                            color: 'rgba(100,116,139,0.6)',
                            maxWidth: 300,
                            mx: 'auto',
                            lineHeight: 1.6,
                        }}
                    >
                        Access to this system is monitored. Unauthorized access attempts
                        will be reported to the IT Security Department.
                    </Typography>
                </Box>
            </Box>

            {/* Snackbar */}
            <Snackbar
                open={snackbar}
                autoHideDuration={4000}
                onClose={() => setSnackbar(false)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert
                    severity="error"
                    onClose={() => setSnackbar(false)}
                    sx={{ borderRadius: '8px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}
                >
                    {error}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default LoginPage;