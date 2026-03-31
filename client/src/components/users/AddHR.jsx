import { Box, Button, Divider, FormControl, InputLabel, MenuItem, Paper, Select, TextField, Typography, CircularProgress, Alert } from "@mui/material"
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../api/axios";
import { ChevronLeft } from "@mui/icons-material";

const PRIMARY = '#3b4eba';

const departmentOptions = [
  'HR', 'Finance', 'Marketing', 'Sales', 'Engineering', 'Operations', 'Product'
];

const inputSx = {
  '& .MuiOutlinedInput-root': {
    borderRadius: '8px',
    fontSize: '0.9rem',
    bgcolor: 'transparent',
    '& fieldset': { borderColor: '#cbd5e1' },
    '&:hover fieldset': { borderColor: PRIMARY },
    '&.Mui-focused fieldset': { borderColor: PRIMARY, borderWidth: 2 },
  },
  '& .MuiInputLabel-root.Mui-focused': { color: PRIMARY },
};

const SectionTitle = ({ children }) => (
  <Typography sx={{
    fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase',
    letterSpacing: '0.08em', color: '#94a3b8', mb: 2,
  }}>
    {children}
  </Typography>
);

const AddHR = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    phone: '',
    department: 'HR',
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const handleChange = (field) => (e) => {
    let value = e.target.value;

    if (field === 'phone') {
      value = value.replace(/\D/g, '');
      if (value.length > 10) return;
      if (value.length === 1 && !/[6-9]/.test(value)) return;
    }

    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const validate = () => {
    const errs = {};
    if (!form.firstName.trim()) errs.firstName = 'First name is required';
    if (!form.lastName.trim()) errs.lastName = 'Last name is required';
    if (!form.email.trim()) errs.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Invalid email';
    if (!form.password.trim()) errs.password = 'Password is required';
    else if (form.password.length < 6) errs.password = 'Password must be at least 6 characters';
    if (!form.department) errs.department = 'Department is required';
    return errs;
  };

  const handleSubmit = async () => {
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setLoading(true);
    setSuccessMsg('');
    try {
      await API.post('/auth/register', {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim(),
        password: form.password.trim(),
        phone: form.phone.trim(),
        department: form.department,
        role: 'hr'
      });

      setSuccessMsg('HR account created successfully!');
      setTimeout(() => {
        navigate('/admin');
      }, 2000);
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to create HR account';
      setErrors({ submit: msg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ height: '100%', overflow: 'auto', bgcolor: '#f6f6f8' }}>
      <Box sx={{ maxWidth: 860, mx: 'auto', px: 4, py: 5 }}>

        {/* Back Nav */}
        <Box
          onClick={() => navigate('/admin')}
          sx={{
            display: 'inline-flex', alignItems: 'center', gap: 0.25,
            color: PRIMARY, fontWeight: 600, fontSize: '0.9rem',
            cursor: 'pointer', mb: 3,
            '&:hover': { textDecoration: 'underline' },
          }}
        >
          <ChevronLeft sx={{ fontSize: 20 }} />
          Back to Dashboard
        </Box>

        {/* Main Card */}
        <Paper elevation={0} sx={{
          borderRadius: '16px',
          border: '1px solid rgba(226,232,240,0.5)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          bgcolor: 'white', overflow: 'hidden',
        }}>
          {/* Card Header */}
          <Box sx={{ px: 5, pt: 5, pb: 4 }}>
            <Typography sx={{ fontSize: '1.5rem', fontWeight: 800, color: PRIMARY, letterSpacing: '-0.02em' }}>
              Create New HR Account
            </Typography>
            <Typography sx={{ color: '#64748b', fontSize: '0.9rem', mt: 0.75 }}>
              Complete the information below to add a new HR member to your team.
            </Typography>
          </Box>

          <Box sx={{ px: 5, pb: 5 }}>

            {successMsg && (
              <Alert severity="success" sx={{ mb: 3, borderRadius: '8px' }}>
                {successMsg}
              </Alert>
            )}

            {errors.submit && (
              <Alert severity="error" sx={{ mb: 3, borderRadius: '8px' }}>
                {errors.submit}
              </Alert>
            )}

            {/* ── Personal Information ── */}
            <SectionTitle>Personal Information</SectionTitle>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2.5, mb: 4 }}>
              <TextField
                label="First Name" placeholder="e.g. John"
                value={form.firstName} onChange={handleChange('firstName')}
                error={!!errors.firstName} helperText={errors.firstName}
                fullWidth size="small" sx={inputSx}
                autoComplete="given-name"
              />
              <TextField
                label="Last Name" placeholder="e.g. Smith"
                value={form.lastName} onChange={handleChange('lastName')}
                error={!!errors.lastName} helperText={errors.lastName}
                fullWidth size="small" sx={inputSx}
                autoComplete="family-name"
              />
              <TextField
                label="Email Address" placeholder="john.smith@company.com" type="email"
                value={form.email} onChange={handleChange('email')}
                error={!!errors.email} helperText={errors.email}
                fullWidth size="small" sx={inputSx}
                autoComplete="email"
              />
              <TextField
                label="Phone Number" placeholder="9876543210" type="tel"
                value={form.phone} onChange={handleChange('phone')}
                fullWidth size="small" sx={inputSx}
                inputProps={{ maxLength: 10 }}
                autoComplete="tel"
              />
            </Box>

            <Divider sx={{ borderColor: '#f1f5f9', mb: 4 }} />

            {/* ── Account Information ── */}
            <SectionTitle>Account Information</SectionTitle>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2.5, mb: 4 }}>
              <TextField
                label="Password" type="password" placeholder="Minimum 6 characters"
                value={form.password} onChange={handleChange('password')}
                error={!!errors.password} helperText={errors.password}
                fullWidth size="small" sx={inputSx}
                autoComplete="new-password"
              />
              <FormControl size="small" error={!!errors.department} sx={inputSx}>
                <InputLabel>Department</InputLabel>
                <Select
                  value={form.department} onChange={handleChange('department')}
                  label="Department" sx={{ borderRadius: '8px' }}
                >
                  {departmentOptions.map(d => (
                    <MenuItem key={d} value={d}>{d}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            <Divider sx={{ borderColor: '#f1f5f9', mb: 4 }} />

            {/* ── Actions ── */}
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                onClick={() => navigate('/admin')}
                variant="outlined"
                sx={{
                  textTransform: 'none', fontWeight: 600, fontSize: '0.9rem',
                  color: '#64748b', borderColor: '#cbd5e1',
                  '&:hover': { borderColor: '#94a3b8', bgcolor: '#f8fafc' }
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={loading}
                variant="contained"
                sx={{
                  textTransform: 'none', fontWeight: 700, fontSize: '0.9rem',
                  bgcolor: PRIMARY,
                  '&:hover': { bgcolor: 'rgba(59,78,186,0.9)' }
                }}
              >
                {loading ? <CircularProgress size={20} sx={{ color: 'white' }} /> : 'Create HR Account'}
              </Button>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Box>
  );
};

export default AddHR;
