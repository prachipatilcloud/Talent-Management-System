import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import API from '../../api/axios';
import {
  Box, Typography, Button, TextField, InputAdornment,
  Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Paper, Chip, Avatar, IconButton, Menu, MenuItem,
  Select, CircularProgress, Pagination, Divider, Dialog,
  DialogTitle, DialogContent, DialogContentText, DialogActions,
  Alert, Snackbar
} from '@mui/material';
import {
  Search, PersonAdd, MoreHoriz, Tune, Close, Visibility, Edit, Delete, CalendarMonth
} from '@mui/icons-material';

const PRIMARY = '#3b4eba';

const statusConfig = {
  Applied:       { bg: '#f1f5f9', color: '#475569', border: '#e2e8f0' },
  Shortlisted:   { bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe' },
  Interviewing:  { bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe' },
  Selected:      { bg: '#f0fdf4', color: '#15803d', border: '#bbf7d0' },
  Rejected:      { bg: '#fff1f2', color: '#be123c', border: '#fecdd3' },
  'On Hold':     { bg: '#fefce8', color: '#a16207', border: '#fef08a' },
  'Talent Pool': { bg: '#faf5ff', color: '#7e22ce', border: '#e9d5ff' },
};

const getInitials = (firstName, lastName) =>
  `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();

const getAvatarColor = (name) => {
  const colors = ['#4f46e5', '#0891b2', '#059669', '#d97706', '#dc2626', '#7c3aed'];
  return colors[(name?.charCodeAt(0) || 0) % colors.length];
};

const formatDate = (dateStr) => {
  const diff = Math.floor((new Date() - new Date(dateStr)) / 1000);
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(dateStr).toLocaleDateString();
};

const selectSx = {
  borderRadius: '8px', fontSize: '0.8125rem', fontWeight: 500, bgcolor: 'white',
  '& .MuiOutlinedInput-notchedOutline': { borderColor: '#e2e8f0' },
  '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: PRIMARY },
  '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: PRIMARY },
};

const CandidatesPage = () => {
  const navigate  = useNavigate();
  const location  = useLocation();

  // Detect base path so admin & hr both work
  const basePath = location.pathname.startsWith('/admin') ? '/admin' : '/hr';

  const [candidates, setCandidates]         = useState([]);
  const [loading, setLoading]               = useState(true);
  const [total, setTotal]                   = useState(0);
  const [page, setPage]                     = useState(1);
  const [search, setSearch]                 = useState('');
  const [statusFilter, setStatusFilter]     = useState('');
  const [sortBy, setSortBy]                 = useState('newest');
  const [menuAnchor, setMenuAnchor]         = useState(null);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting]             = useState(false);
  const [snackbar, setSnackbar]             = useState({ open: false, message: '', severity: 'success' });

  const LIMIT = 10;

  const fetchCandidates = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (statusFilter) params.append('status', statusFilter);
      params.append('sortby', sortBy);
      params.append('page', page);
      params.append('limit', LIMIT);

      const res = await API.get(`/candidates?${params}`);
      setCandidates(res.data.candidates);
      setTotal(res.data.count);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, sortBy, page]);

  useEffect(() => { fetchCandidates(); }, [fetchCandidates]);

  const handleMenuOpen = (e, candidate) => {
    e.stopPropagation();
    setMenuAnchor(e.currentTarget);
    setSelectedCandidate(candidate);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
    setSelectedCandidate(null);
  };

  const handleDeleteClick = () => {
    setDeleteDialogOpen(true);
    setMenuAnchor(null);
    // keep selectedCandidate alive for the dialog
  };

  const handleDeleteConfirm = async () => {
    if (!selectedCandidate) return;
    setDeleting(true);
    try {
      await API.delete(`/candidates/${selectedCandidate._id}`);
      setSnackbar({ open: true, message: 'Candidate deleted successfully', severity: 'success' });
      setDeleteDialogOpen(false);
      setSelectedCandidate(null);
      fetchCandidates();
    } catch (err) {
      console.error(err);
      setSnackbar({
        open: true,
        message: err.response?.data?.message || 'Failed to delete candidate',
        severity: 'error',
      });
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setSelectedCandidate(null);
  };



  const activeFilters = [
    ...(search       ? [{ label: `Search: ${search}`,       key: 'search' }] : []),
    ...(statusFilter ? [{ label: `Status: ${statusFilter}`, key: 'status' }] : []),
  ];

  const removeFilter = (key) => {
    if (key === 'search') setSearch('');
    if (key === 'status') setStatusFilter('');
    setPage(1);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>

      {/* ── Top Header ── */}
      <Box sx={{
        height: 64, bgcolor: 'white', borderBottom: '1px solid #e2e8f0',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        px: 3, flexShrink: 0, gap: 3,
      }}>
        <Typography sx={{ color: '#0f172a', fontSize: '0.875rem', fontWeight: 600, minWidth: 'fit-content' }}>
          Candidates
        </Typography>

        {/* Search */}
        <Box sx={{ flex: 1, maxWidth: 700 }}>
          <TextField
            fullWidth size="medium"
            placeholder="Search candidates, skills, or roles..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search sx={{ fontSize: 18, color: '#94a3b8' }} />
                </InputAdornment>
              ),
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: '8px', bgcolor: '#f8fafc', fontSize: '0.875rem',
                '& fieldset': { borderColor: '#e2e8f0' },
                '&:hover fieldset': { borderColor: PRIMARY },
                '&.Mui-focused fieldset': { borderColor: PRIMARY },
              },
            }}
          />
        </Box>

        {/* Actions */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 'fit-content' }}>
          <Button
            startIcon={<Tune sx={{ fontSize: '1rem !important' }} />}
            onClick={() => navigate(`${basePath}/candidates/filter`)}
            variant="outlined"
            sx={{
              borderRadius: '8px', textTransform: 'none', fontWeight: 600,
              fontSize: '0.875rem', borderColor: '#e2e8f0', color: '#374151',
              '&:hover': { borderColor: PRIMARY, color: PRIMARY, bgcolor: 'rgba(59,78,186,0.04)' },
            }}
          >
            Advanced Filters
          </Button>
          <Button
            variant="contained"
            startIcon={<PersonAdd />}
            onClick={() => navigate(`${basePath}/candidates/add`)}
            sx={{
              bgcolor: PRIMARY, borderRadius: '8px', textTransform: 'none',
              fontWeight: 700, fontSize: '0.875rem',
              boxShadow: '0 4px 14px rgba(59,78,186,0.3)',
              '&:hover': { bgcolor: 'rgba(59,78,186,0.9)' },
            }}
          >
            Add Candidate
          </Button>
        </Box>
      </Box>

      {/* ── Content ── */}
      <Box sx={{ flex: 1, overflow: 'auto', p: 3 }}>

        {/* Filter Row */}
        <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
          <Select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            displayEmpty size="small"
            sx={{ ...selectSx, minWidth: 130 }}
          >
            <MenuItem value=""><em>All Status</em></MenuItem>
            {Object.keys(statusConfig).map(s => (
              <MenuItem key={s} value={s}>{s}</MenuItem>
            ))}
          </Select>

          <Select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            size="small"
            sx={{ ...selectSx, minWidth: 150 }}
          >
            <MenuItem value="newest">Newest First</MenuItem>
            <MenuItem value="oldest">Oldest First</MenuItem>
            <MenuItem value="experience">Most Experience</MenuItem>
          </Select>
        </Box>

        {/* Active Filters */}
        {activeFilters.length > 0 && (
          <Box sx={{
            display: 'flex', alignItems: 'center', gap: 1.5, mb: 2.5,
            bgcolor: 'white', p: 1.5, borderRadius: '10px',
            border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          }}>
            <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', px: 1 }}>
              Active:
            </Typography>
            {activeFilters.map(f => (
              <Chip
                key={f.key} label={f.label}
                onDelete={() => removeFilter(f.key)}
                deleteIcon={<Close sx={{ fontSize: '14px !important' }} />}
                size="small"
                sx={{
                  bgcolor: '#f1f5f9', color: '#374151', fontWeight: 600,
                  fontSize: '0.75rem', border: '1px solid #e2e8f0', borderRadius: '999px',
                  '& .MuiChip-deleteIcon': { color: '#94a3b8', '&:hover': { color: '#ef4444' } },
                }}
              />
            ))}
            <Button
              onClick={() => { setSearch(''); setStatusFilter(''); setPage(1); }}
              sx={{
                ml: 'auto', color: PRIMARY, fontSize: '0.75rem', fontWeight: 700,
                textTransform: 'none', minWidth: 'auto', pl: 2,
                borderLeft: '1px solid #e2e8f0', borderRadius: 0,
              }}
            >
              Clear All
            </Button>
          </Box>
        )}

        {/* Table */}
        <Paper elevation={0} sx={{
          border: '1px solid #e2e8f0', borderRadius: '10px',
          overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: '#f8fafc' }}>
                  {['Candidate Name', 'Status', 'Current Role', 'Experience', 'Top Skills', 'Added'].map(h => (
                    <TableCell key={h} sx={{
                      fontSize: '0.7rem', fontWeight: 700, color: '#64748b',
                      textTransform: 'uppercase', letterSpacing: '0.05em',
                      borderBottom: '1px solid #e2e8f0',
                    }}>
                      {h}
                    </TableCell>
                  ))}
                  <TableCell sx={{ borderBottom: '1px solid #e2e8f0' }} />
                </TableRow>
              </TableHead>

              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                      <CircularProgress size={28} sx={{ color: PRIMARY }} />
                    </TableCell>
                  </TableRow>
                ) : candidates.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 6, color: '#94a3b8', fontSize: '0.875rem' }}>
                      No candidates found
                    </TableCell>
                  </TableRow>
                ) : candidates.map((c) => {
                  const sc          = statusConfig[c.status] || statusConfig.Applied;
                  const initials    = getInitials(c.firstName, c.lastName);
                  const avatarColor = getAvatarColor(c.firstName);

                  return (
                    <TableRow
                      key={c._id} hover
                      onClick={() => navigate(`${basePath}/candidates/${c._id}`)}
                      sx={{
                        cursor: 'pointer',
                        '&:hover': { bgcolor: 'rgba(59,78,186,0.03)' },
                        borderBottom: '1px solid #f1f5f9',
                      }}
                    >

                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Avatar sx={{
                            width: 36, height: 36,
                            bgcolor: `${avatarColor}20`, color: avatarColor,
                            fontSize: '0.7rem', fontWeight: 700,
                          }}>
                            {initials}
                          </Avatar>
                          <Box>
                            <Typography sx={{ fontSize: '0.875rem', fontWeight: 700, color: '#0f172a' }}>
                              {c.firstName} {c.lastName}
                            </Typography>
                            <Typography sx={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                              {c.email}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>

                      <TableCell>
                        <Box component="span" sx={{
                          px: 1.5, py: 0.5, borderRadius: '999px',
                          fontSize: '0.6875rem', fontWeight: 700,
                          bgcolor: sc.bg, color: sc.color,
                          border: `1px solid ${sc.border}`,
                          textTransform: 'uppercase', letterSpacing: '0.03em',
                        }}>
                          {c.status}
                        </Box>
                      </TableCell>

                      <TableCell sx={{ fontSize: '0.875rem', color: '#475569' }}>{c.jobRole}</TableCell>

                      <TableCell sx={{ fontSize: '0.875rem', color: '#475569', fontWeight: 500 }}>
                        {c.experience} yr{c.experience !== 1 ? 's' : ''}
                      </TableCell>

                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
                          {c.skills?.slice(0, 2).map(skill => (
                            <Box key={skill} component="span" sx={{
                              px: 1, py: 0.25, bgcolor: 'rgba(59,78,186,0.08)',
                              color: PRIMARY, borderRadius: '4px',
                              fontSize: '0.6875rem', fontWeight: 700,
                            }}>
                              {skill}
                            </Box>
                          ))}
                          {c.skills?.length > 2 && (
                            <Box component="span" sx={{
                              px: 1, py: 0.25, bgcolor: '#f1f5f9',
                              color: '#64748b', borderRadius: '4px',
                              fontSize: '0.6875rem', fontWeight: 700,
                            }}>
                              +{c.skills.length - 2}
                            </Box>
                          )}
                        </Box>
                      </TableCell>

                      <TableCell sx={{ fontSize: '0.8125rem', color: '#94a3b8' }}>
                        {formatDate(c.createdAt)}
                      </TableCell>

                      <TableCell align="right" onClick={e => e.stopPropagation()}>
                        <IconButton size="small" onClick={(e) => handleMenuOpen(e, c)}
                          sx={{ color: '#94a3b8', '&:hover': { color: PRIMARY } }}>
                          <MoreHoriz fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Pagination */}
          <Box sx={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            px: 3, py: 1.5, bgcolor: '#f8fafc', borderTop: '1px solid #e2e8f0',
          }}>
            <Typography sx={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 500 }}>
              Showing {Math.min((page - 1) * LIMIT + 1, total)}–{Math.min(page * LIMIT, total)} of {total} entries
            </Typography>
            <Pagination
              count={Math.ceil(total / LIMIT) || 1}
              page={page}
              onChange={(_, val) => setPage(val)}
              size="small"
              sx={{
                '& .MuiPaginationItem-root': { fontSize: '0.75rem', fontWeight: 600 },
                '& .Mui-selected': { bgcolor: `${PRIMARY} !important`, color: 'white' },
              }}
            />
          </Box>
        </Paper>
      </Box>

      {/* ── Actions Menu ── */}
      <Menu
        anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={handleMenuClose}
        PaperProps={{ sx: { borderRadius: '10px', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', border: '1px solid #e2e8f0', minWidth: 180 } }}
      >
        <MenuItem
          onClick={() => { navigate(`${basePath}/candidates/${selectedCandidate?._id}`); handleMenuClose(); }}
          sx={{ fontSize: '0.875rem', gap: 1.5 }}
        >
          <Visibility fontSize="small" sx={{ color: '#64748b' }} /> View Profile
        </MenuItem>
        <MenuItem
          onClick={() => { navigate(`${basePath}/candidates/edit/${selectedCandidate?._id}`); handleMenuClose(); }}
          sx={{ fontSize: '0.875rem', gap: 1.5 }}
        >
          <Edit fontSize="small" sx={{ color: '#64748b' }} /> Edit
        </MenuItem>

        {/* ── Schedule Interview ── */}
        <MenuItem
          onClick={() => {
            navigate(`${basePath}/candidates/${selectedCandidate?._id}/schedule-interview`, {
              state: { candidate: selectedCandidate },
            });
            handleMenuClose();
          }}
          sx={{ fontSize: '0.875rem', gap: 1.5 }}
        >
          <CalendarMonth fontSize="small" sx={{ color: '#64748b' }} /> Schedule Interview
        </MenuItem>

        <Divider />
        <MenuItem onClick={handleDeleteClick} sx={{ fontSize: '0.875rem', gap: 1.5, color: '#ef4444' }}>
          <Delete fontSize="small" /> Delete
        </MenuItem>
      </Menu>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteCancel}
        PaperProps={{ sx: { borderRadius: '12px', boxShadow: '0 10px 40px rgba(0,0,0,0.15)', minWidth: 400 } }}
      >
        <DialogTitle sx={{ fontSize: '1.125rem', fontWeight: 700, color: '#0f172a', pb: 1 }}>
          Delete Candidate?
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ fontSize: '0.875rem', color: '#64748b' }}>
            Are you sure you want to delete <strong>{selectedCandidate?.firstName} {selectedCandidate?.lastName}</strong>?
            This will also delete their resume from Google Drive. This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button
            onClick={handleDeleteCancel}
            disabled={deleting}
            sx={{ textTransform: 'none', fontWeight: 600, fontSize: '0.875rem', color: '#64748b', '&:hover': { bgcolor: '#f1f5f9' } }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            disabled={deleting}
            variant="contained"
            sx={{ bgcolor: '#ef4444', textTransform: 'none', fontWeight: 600, fontSize: '0.875rem', '&:hover': { bgcolor: '#dc2626' }, '&:disabled': { bgcolor: '#fca5a5' } }}
          >
            {deleting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%', borderRadius: '8px', fontSize: '0.875rem', fontWeight: 600 }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default CandidatesPage;