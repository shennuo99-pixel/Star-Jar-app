export interface Star {
  id: string;
  date: string; // YYYY-MM-DD
}

export interface Jar {
  id: string;
  name: string;
  goal: number;
  stars: Star[];
  lastDate: string | null;
  streak: number;
  celebrated: boolean;
}

export interface AttendanceRecord {
  id: string;
  name: string;
  date: string;
  status: 'present' | 'leave' | 'absent';
}

export interface Student {
  id: string;
  teacherId: string; // 绑定到老师的 Firebase UID
  name: string;
  meta: string;
  color: string;
  jars: Jar[];
  attendanceList: AttendanceRecord[];
  stageGoal: number;
  totalStars: number; // Added for global ranking
}

export interface AppState {
  students: Student[];
}
