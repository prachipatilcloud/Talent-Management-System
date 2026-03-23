import express from 'express';
import { authorize, protect } from '../middlewares/auth.js';
import { createUser, deleteUser, getUser, getUsers, updateUser } from '../controllers/userController.js';

const router = express.Router();

router.use(protect);
router.get('/', authorize('admin', 'hr'), getUsers);

router.post('/', authorize('admin'), createUser);
router.get('/:id', authorize('admin'), getUser);
router.put('/:id', authorize('admin'), updateUser);
router.delete('/:id', authorize('admin'), deleteUser);

export default router;