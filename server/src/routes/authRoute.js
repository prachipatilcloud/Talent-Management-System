import express from 'express';
import { getMe, login, register, logout, refresh } from '../controllers/authController.js';
import { protect } from '../middlewares/auth.js';


const router = express.Router();

router.get('/role-check', protect, (req, res) => {
    res.json({ role: req.user.role });
});
router.post('/register', register);
router.post('/login', login);
router.post('/refresh', refresh);
router.post('/logout', logout);
router.get('/me', protect, getMe);

export default router;