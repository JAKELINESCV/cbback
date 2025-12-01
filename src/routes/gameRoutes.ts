import { Router } from 'express';
import { finishGame } from '../controllers/gameController';

const router = Router();

router.post('/:userId/finish', finishGame);

export default router;