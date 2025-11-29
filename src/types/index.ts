import { Request } from 'express';

// Tipos para las entidades
export interface User {
  id: string;
  firebase_uid: string;
  first_name: string;
  last_name: string;
  email: string;
  birth_date: string;
  avatar_url?: string;
  total_score: number;
  games_played: number;
  best_score: number;
  current_streak: number;
  created_at: Date;
  updated_at: Date;
}

export interface Question {
  id: number;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: 'A' | 'B' | 'C' | 'D';
  difficulty: 'basic' | 'intermediate' | 'advanced';
  category?: string;
  created_at: Date;
}

export interface Game {
  id: number;
  user_id: string;
  difficulty: 'basic' | 'intermediate' | 'advanced';
  total_score: number;
  correct_answers: number;
  wrong_answers: number;
  time_taken: number;
  completed: boolean;
  started_at: Date;
  completed_at?: Date;
}

export interface Score {
  id: number;
  game_id: number;
  question_id: number;
  user_answer: 'A' | 'B' | 'C' | 'D';
  is_correct: boolean;
  points_earned: number;
  answered_at: Date;
}

// Request con usuario autenticado
export interface AuthRequest extends Request {
  user?: {
    uid: string;
    email: string;
  };
}

// Exportar todo como default también
export default{};