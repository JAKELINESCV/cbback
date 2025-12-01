import { Request, Response } from 'express';
import { pool } from '../config/database';
import { User, AuthRequest } from '../types';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

// Crear o sincronizar usuario desde Firebase
export const syncUser = async (req: Request, res: Response) => {
  try {
    const { firebase_uid, first_name, last_name, email, birth_date } = req.body;

    // Validar campos requeridos
    if (!firebase_uid || !first_name || !last_name || !email || !birth_date) {
      return res.status(400).json({
        success: false,
        message: 'Todos los campos son requeridos',
      });
    }

    // Verificar si el usuario ya existe
    const [existing] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM users WHERE firebase_uid = ?',
      [firebase_uid]
    );

    if (existing.length > 0) {
      // Usuario ya existe, retornar sus datos
      return res.json({
        success: true,
        message: 'Usuario encontrado',
        user: existing[0],
      });
    }

    // Crear nuevo usuario
    await pool.query(
      `INSERT INTO users (id, firebase_uid, first_name, last_name, email, birth_date, avatar_url) 
       VALUES (UUID(), ?, ?, ?, ?, ?, ?)`,
      [firebase_uid, first_name, last_name, email, birth_date, 'avatar1']
    );

    // Obtener el usuario recién creado
    const [newUser] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM users WHERE firebase_uid = ?',
      [firebase_uid]
    );

    res.status(201).json({
      success: true,
      message: 'Usuario creado exitosamente',
      user: newUser[0],
    });
  } catch (error) {
    console.error('Error al sincronizar usuario:', error);
    res.status(500).json({ success: false, message: 'Error del servidor' });
  }
};

// Obtener perfil de usuario
export const getUserProfile = async (req: AuthRequest, res: Response) => {
  try {
    const { uid } = req.params;

    const [users] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM users WHERE firebase_uid = ?',
      [uid]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado',
      });
    }

    console.log('👤 Usuario obtenido de DB:', users[0]);

    res.json({
      success: true,
      user: users[0],
    });
  } catch (error) {
    console.error('Error al obtener perfil:', error);
    res.status(500).json({ success: false, message: 'Error del servidor' });
  }
};

// Actualizar perfil de usuario
export const updateUserProfile = async (req: Request, res: Response) => {
  try {
    const { uid } = req.params;
    const { first_name, last_name, email, birth_date, avatar_url } = req.body;

    if (!first_name || !last_name || !email || !birth_date) {
      return res.status(400).json({
        success: false,
        message: 'Todos los campos son requeridos',
      });
    }

    const formattedBirthDate = birth_date.includes('T')
      ? birth_date.split('T')[0]
      : birth_date;

    const updates: string[] = [];
    const values: any[] = [];

    updates.push('first_name = ?', 'last_name = ?', 'email = ?', 'birth_date = ?');
    values.push(first_name, last_name, email, formattedBirthDate);

    if (avatar_url !== undefined) {
      updates.push('avatar_url = ?');
      values.push(avatar_url);
    }

    values.push(uid);

    const [result] = await pool.query<ResultSetHeader>(
      `UPDATE users SET ${updates.join(', ')} WHERE firebase_uid = ?`,
      values
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado',
      });
    }

    const [users] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM users WHERE firebase_uid = ?',
      [uid]
    );

    res.json({
      success: true,
      message: 'Perfil actualizado exitosamente',
      user: users[0],
    });
  } catch (error: any) {
    console.error('Error al actualizar perfil:', error);

    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({
        success: false,
        message: 'El email ya está en uso',
      });
    }

    res.status(500).json({ success: false, message: 'Error del servidor' });
  }
};


// Actualizar estadísticas del usuario
export const updateUserStats = async (req: Request, res: Response) => {
  try {
    const { uid } = req.params;
    const { score, is_best_score } = req.body;

    let query = `
      UPDATE users 
      SET 
        total_score = total_score + ?,
        games_played = games_played + 1
    `;

    const params: any[] = [score];

    if (is_best_score) {
      query += ', best_score = ?';
      params.push(score);
    }

    query += ' WHERE firebase_uid = ?';
    params.push(uid);

    await pool.query(query, params);

    // Obtener estadísticas actualizadas
    const [users] = await pool.query<RowDataPacket[]>(
      'SELECT total_score, games_played, best_score FROM users WHERE firebase_uid = ?',
      [uid]
    );

    res.json({
      success: true,
      message: 'Estadísticas actualizadas',
      stats: users[0],
    });
  } catch (error) {
    console.error('Error al actualizar estadísticas:', error);
    res.status(500).json({ success: false, message: 'Error del servidor' });
  }
};

// Eliminar usuario
export const deleteUser = async (req: Request, res: Response) => {
  try {
    const { uid } = req.params;

    const [result] = await pool.query<ResultSetHeader>(
      'DELETE FROM users WHERE firebase_uid = ?',
      [uid]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado',
      });
    }

    res.json({
      success: true,
      message: 'Usuario eliminado exitosamente',
    });
  } catch (error) {
    console.error('Error al eliminar usuario:', error);
    res.status(500).json({ success: false, message: 'Error del servidor' });
  }
};

// Obtener ranking de usuarios
export const getUserRanking = async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;

    const [users] = await pool.query<RowDataPacket[]>(
      `SELECT 
        firebase_uid, 
        first_name, 
        last_name, 
        total_score, 
        games_played, 
        best_score
       FROM users 
       ORDER BY total_score DESC 
       LIMIT ?`,
      [limit]
    );

    res.json({
      success: true,
      ranking: users,
    });
  } catch (error) {
    console.error('Error al obtener ranking:', error);
    res.status(500).json({ success: false, message: 'Error del servidor' });
  }
};