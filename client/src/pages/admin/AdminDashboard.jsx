import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Grid, Table, TableHead, TableBody, TableRow, TableCell,  
  Button, Alert, AlertTitle, Chip, Avatar, IconButton, TablePagination, 
  CircularProgress, Paper 
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  Group as GroupIcon,
  Work as WorkIcon,
  EventAvailable as EventAvailableIcon,
  RateReview as RateReviewIcon,
  PersonAdd as PersonAddIcon,
  BusinessCenter as BusinessCenterIcon,
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import API from '../../api/axios';

const PRIMARY = '#3b4eba';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [candidatesData, setCandidatesData] = useState([]); // Ensure this remains an array
  const [statusCounts, setStatusCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        const [candidatesRes, statsRes] = await Promise.all([
          API.get('/candidates'),
          API.get('/candidates/stats/status-counts')
        ]);
        
        // FIX: Ensure we are setting an array even if the backend nests the data
        const data = Array.isArray(candidatesRes.data) 
          ? candidatesRes.data 
          : (candidatesRes.data?.candidates || []);
          
        setCandidatesData(data);
        setStatusCounts(statsRes.data.statusCounts || {});
      } catch (err) {
        console.error('Dashboard Data Error:', err);
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  // --- Logic Calculations with Safety Checks ---
  
  const safeCandidates = Array.isArray(candidatesData) ? candidatesData : [];
  const total = safeCandidates.length;

  const todayStr = new Date().toDateString();
  const interviewsToday = safeCandidates.filter(c =>
    c.interviewRounds?.some(r => new Date(r.scheduledDate).toDateString() === todayStr)
  ).length;

  const pendingFeedback = safeCandidates.filter(c =>
    c.interviewRounds?.some(r => 
      new Date(r.scheduledDate) < new Date() && (!r.feedback || !r.feedback.rating)
    )
  ).length;

  // --- Handlers ---
  const handleChangePage = (event, newPage) => setPage(newPage);
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const getStatusColor = (status) => {
    const map = {
      'Applied': { bg: '#f1f5f9', color: '#475569', border: '#94a3b8' },
      'Shortlisted': { bg: '#eff6ff', color: '#1d4ed8', border: '#3b82f6' },
      'Interviewing': { bg: '#eff6ff', color: '#1d4ed8', border: '#3b82f6' },
      'Selected': { bg: '#f0fdf4', color: '#15803d', border: '#22c55e' },
      'Rejected': { bg: '#fff1f2', color: '#be123c', border: '#f43f5e' },
    };
    return map[status] || { bg: '#f1f5f9', color: '#475569', border: '#94a3b8' };
  };

  // --- StatCard Component ---
  const StatCard = ({ icon: Icon, title, value, subtitle }) => (
    <Paper sx={{ p: 2.5, display: 'flex', flexDirection: 'column', gap: 1.5, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Box sx={{ p: 1.25, borderRadius: '8px', bgcolor: PRIMARY, color: '#fff', display: 'flex', width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}>
          <Icon sx={{ fontSize: 24 }} />
        </Box>
        <Box>
          <Typography sx={{ fontSize: '12px', fontWeight: 500, color: '#64748b' }}>{title}</Typography>
          <Typography sx={{ fontSize: '24px', fontWeight: '700', color: '#0f172a' }}>{value}</Typography>
        </Box>
      </Box>
      <Typography sx={{ fontSize: '12px', color: '#64748b' }}>{subtitle}</Typography>
    </Paper>
  );

  return (
    <Box sx={{ height: '100%', bgcolor: '#f6f6f8' }}>
      <Box sx={{ height: 56, bgcolor: 'white', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 3, position: 'sticky', top: 0, zIndex: 10 }}>
        <Typography sx={{ fontWeight: '700', color: '#0f172a', fontSize: '15px' }}>Admin Overview</Typography>
        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
          <IconButton size="small"><NotificationsIcon sx={{ fontSize: 20 }} /></IconButton>
          <Button variant="contained" size="small" startIcon={<PersonAddIcon sx={{ fontSize: 18 }} />} onClick={() => navigate('/admin/add-interviewer')} sx={{ textTransform: 'none', bgcolor: PRIMARY, fontSize: '12px' }}>Add Interviewer</Button>
          <Button variant="outlined" size="small" startIcon={<BusinessCenterIcon sx={{ fontSize: 18 }} />} onClick={() => navigate('/admin/add-hr')} sx={{ textTransform: 'none', color: PRIMARY, borderColor: PRIMARY, fontSize: '12px' }}>Add HR</Button>
        </Box>
      </Box>

      <Box sx={{ p: 3 }}>
        {pendingFeedback > 0 && (
          <Alert severity="warning" sx={{ mb: 3, borderRadius: '8px' }}>
            <AlertTitle sx={{ fontWeight: 600 }}>Action Required</AlertTitle>
            {pendingFeedback} interview feedbacks are overdue.
          </Alert>
        )}

        {/* Updated Grid for MUI v2 Migration */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard icon={GroupIcon} title="Total Candidates" value={total} subtitle={`${statusCounts['Interviewing'] || 0} interviewing`} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard icon={EventAvailableIcon} title="Interviews Today" value={interviewsToday} subtitle="Scheduled for today" />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard icon={RateReviewIcon} title="Pending Feedback" value={pendingFeedback} subtitle="Requires attention" />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard icon={WorkIcon} title="Selected" value={statusCounts['Selected'] || 0} subtitle={`${statusCounts['On Hold'] || 0} on hold`} />
          </Grid>
        </Grid>

        <Paper sx={{ borderRadius: '8px', overflow: 'hidden' }}>
          <Box sx={{ overflowX: 'auto' }}>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: '#f8fafc' }}>
                  <TableCell sx={{ fontSize: '11px', fontWeight: '700' }}>CANDIDATE</TableCell>
                  <TableCell sx={{ fontSize: '11px', fontWeight: '700' }}>APPLIED FOR</TableCell>
                  <TableCell sx={{ fontSize: '11px', fontWeight: '700' }}>ROUND</TableCell>
                  <TableCell sx={{ fontSize: '11px', fontWeight: '700' }}>STATUS</TableCell>
                  <TableCell align="right" sx={{ fontSize: '11px', fontWeight: '700' }}>ACTIONS</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={5} align="center" sx={{ py: 5 }}><CircularProgress /></TableCell></TableRow>
                ) : (
                  safeCandidates.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((row) => (
                    <TableRow key={row._id} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Avatar sx={{ width: 32, height: 32, fontSize: '12px', bgcolor: PRIMARY }}>
                            {row.firstName?.[0]}{row.lastName?.[0]}
                          </Avatar>
                          <Typography sx={{ fontSize: '13px', fontWeight: 600 }}>{row.firstName} {row.lastName}</Typography>
                        </Box>
                      </TableCell>
                      <TableCell sx={{ fontSize: '13px' }}>{row.jobRole || '—'}</TableCell>
                      <TableCell>
                        <Chip label={row.interviewRounds?.slice(-1)[0]?.roundName || 'Not Started'} size="small" sx={{ fontSize: '10px' }} />
                      </TableCell>
                      <TableCell>
                        <Chip label={row.status} size="small" sx={{ ...getStatusColor(row.status), fontSize: '10px' }} />
                      </TableCell>
                      <TableCell align="right">
                        <Button onClick={() => navigate(`/admin/candidates/${row._id}`)} size="small" sx={{ textTransform: 'none', color: PRIMARY }}>View Profile</Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Box>
          <TablePagination
            rowsPerPageOptions={[5, 10]}
            component="div"
            count={total}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </Paper>
      </Box>
    </Box>
  );
};

export default Dashboard;