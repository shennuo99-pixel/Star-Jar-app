import { Student } from '../types';

export const COLORS = [
  '#f4c25a', '#e89eb8', '#7fc8b8', '#b8a8e0', 
  '#f5a07e', '#8ec5e0', '#d4a574', '#a8c47f'
];

export const todayStr = () => new Date().toDateString();
export const yesterdayStr = () => { 
  const d = new Date(); d.setDate(d.getDate() - 1); 
  return d.toDateString(); 
};

export function getInitial(name: string) {
  if (!name) return '?';
  const trimmed = name.trim();
  if (/[\\u4e00-\\u9fa5]/.test(trimmed)) return trimmed.length > 1 ? trimmed.slice(-1) : trimmed;
  return trimmed.charAt(0).toUpperCase();
}

export function genId() { 
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); 
}

export function pickColor(index: number) { 
  return COLORS[index % COLORS.length]; 
}

export function darken(hex: string) {
  const c = hex.replace('#', '');
  const r = Math.round(parseInt(c.slice(0,2),16) * 0.7);
  const g = Math.round(parseInt(c.slice(2,4),16) * 0.7);
  const b = Math.round(parseInt(c.slice(4,6),16) * 0.7);
  return `rgb(${r},${g},${b})`;
}

export function totalStars(student: Student) { 
  return student.jars.reduce((sum, j) => sum + j.stars.length, 0); 
}

export function totalGoal(student: Student) { 
  return student.jars.reduce((sum, j) => sum + j.goal, 0); 
}

export function completedJars(student: Student) { 
  return student.jars.filter(j => j.stars.length >= j.goal).length; 
}

export function maxStreak(student: Student) { 
  return student.jars.reduce((m, j) => Math.max(m, j.streak), 0); 
}
