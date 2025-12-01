import { Request, Response } from 'express';
import { pool } from '../config/database';

// Finalizar una partida y actualizar estadísticas del usuario
export const finishGame = async (req: Request, res: Response) => {
  try {
    const { difficulty, totalScore, correctAnswers, wrongAnswers, timeTaken } = req.body;
    const firebaseUid = req.params.userId; 

    console.log('🎮 Finalizando juego para usuario:', firebaseUid);
    console.log('📊 Datos recibidos:', { difficulty, totalScore, correctAnswers, wrongAnswers, timeTaken });

    // Obtener usuario directamente por UID
    const [users] = await pool.query(`SELECT * FROM users WHERE firebase_uid = ?`, [firebaseUid]);

    if (!users || (users as any).length === 0) {
      console.log('❌ Usuario no encontrado:', firebaseUid);
      return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    }

    const user = (users as any)[0];
    console.log('👤 Usuario encontrado:', user.id);

    // Crear partida
    const [gameResult] = await pool.query(
      `INSERT INTO games (user_id, difficulty, total_score, correct_answers, wrong_answers, time_taken, completed, started_at, completed_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [user.id, difficulty, totalScore, correctAnswers, wrongAnswers, timeTaken, true]
    );

    const gameId = (gameResult as any).insertId;
    console.log('🎯 Partida creada con ID:', gameId);

    // Actualizar estadísticas del usuario
    const newTotalScore = user.total_score + totalScore;
    const newGamesPlayed = user.games_played + 1;
    const newBestScore = Math.max(user.best_score, totalScore);

    await pool.query(
      `UPDATE users SET total_score = ?, games_played = ?, best_score = ?, updated_at = NOW() WHERE id = ?`,
      [newTotalScore, newGamesPlayed, newBestScore, user.id]
    );

    console.log('✅ Estadísticas actualizadas:', { newTotalScore, newGamesPlayed, newBestScore });

    return res.json({
      success: true,
      gameId,
      totalScore: newTotalScore,
      gamesPlayed: newGamesPlayed,
      bestScore: newBestScore
    });
  } catch (error) {
    console.error('❌ Error en finishGame:', error);
    return res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
};