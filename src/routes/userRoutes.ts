import { Router } from 'express';
import {
  syncUser,
  getUserProfile,
  updateUserProfile,
  updateUserStats,
  deleteUser,
  getUserRanking,
} from '../controllers/userController';

const router = Router();

// Rutas estáticas primero
router.get('/ranking/top', getUserRanking);

// Luego rutas dinámicas
router.post('/sync', syncUser);
router.get('/:uid', getUserProfile);
router.put('/:uid', updateUserProfile);
router.patch('/:uid/stats', updateUserStats);
router.delete('/:uid', deleteUser);

export default router;
