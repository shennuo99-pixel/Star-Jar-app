import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { AppState, Student, Jar } from '../types';
import { genId, pickColor, todayStr, yesterdayStr } from '../utils';

interface AppContextType {
  state: AppState;
  globalRankings: Student[];
  addStudent: (name: string, meta?: string, color?: string) => void;
  editStudent: (id: string, name: string, meta: string) => void;
  removeStudent: (id: string) => void;
  addJar: (studentId: string, name: string, goal: number) => void;
  editJar: (studentId: string, jarId: string, name: string, goal: number) => void;
  removeJar: (studentId: string, jarId: string) => void;
  addStar: (studentId: string, jarId: string) => { celebrated: boolean, jarName: string } | null;
  removeStar: (studentId: string, jarId: string) => void;
  addAttendance: (studentId: string, name: string) => void;
  toggleAttendance: (studentId: string, recordId: string) => void;
  updateStageGoal: (studentId: string, goal: number) => void;
  importData: (data: AppState) => void;
  flashMessage: (msg: string) => void;
  message: string | null;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'star_jar_app_data';

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AppState>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    return saved ? JSON.parse(saved) : { students: [] };
  });
  const [message, setMessage] = useState<string | null>(null);

  // 每次状态变化都保存到本地
  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const flashMessage = useCallback((msg: string) => {
    setMessage(msg);
    setTimeout(() => setMessage(null), 2500);
  }, []);

  const addStudent = (name: string, meta?: string, color?: string) => {
    const id = genId();
    const newStudent: Student = {
      id,
      teacherId: 'local-user',
      name,
      meta: meta || '',
      color: color || pickColor(state.students.length),
      jars: [],
      attendanceList: [],
      stageGoal: 10,
      totalStars: 0
    };
    setState(prev => ({ ...prev, students: [...prev.students, newStudent] }));
  };

  const editStudent = (id: string, name: string, meta: string) => {
    setState(prev => ({
      ...prev,
      students: prev.students.map(s => s.id === id ? { ...s, name, meta } : s)
    }));
  };

  const removeStudent = (id: string) => {
    setState(prev => ({
      ...prev,
      students: prev.students.filter(s => s.id !== id)
    }));
  };

  const addJar = (studentId: string, name: string, goal: number) => {
    setState(prev => ({
      ...prev,
      students: prev.students.map(s => {
        if (s.id !== studentId) return s;
        const newJar: Jar = {
          id: genId(),
          name,
          goal,
          stars: [],
          lastDate: null,
          streak: 0,
          celebrated: false
        };
        return { ...s, jars: [...s.jars, newJar] };
      })
    }));
  };

  const editJar = (studentId: string, jarId: string, name: string, goal: number) => {
    setState(prev => ({
      ...prev,
      students: prev.students.map(s => {
        if (s.id !== studentId) return s;
        const newJars = s.jars.map(j => {
          if (j.id !== jarId) return j;
          const celebrated = j.stars.length >= goal ? j.celebrated : false;
          return { ...j, name, goal, celebrated };
        });
        return { ...s, jars: newJars };
      })
    }));
  };

  const removeJar = (studentId: string, jarId: string) => {
    setState(prev => ({
      ...prev,
      students: prev.students.map(s => {
        if (s.id !== studentId) return s;
        const newJars = s.jars.filter(j => j.id !== jarId);
        const newTotalStars = newJars.reduce((sum, jar) => sum + jar.stars.length, 0);
        return { ...s, jars: newJars, totalStars: newTotalStars };
      })
    }));
  };

  const addStar = (studentId: string, jarId: string) => {
    let result: { celebrated: boolean, jarName: string } | null = null;
    let updated = false;

    const newState = {
      ...state,
      students: state.students.map(s => {
        if (s.id !== studentId) return s;

        const totalToday = s.jars.reduce((sum, jar) => {
          return sum + jar.stars.filter(st => st.date === todayStr()).length;
        }, 0);

        if (totalToday >= 5) {
          flashMessage('已达到该学生今日奖励上限（5颗星星）');
          return s;
        }

        updated = true;
        const newJars = s.jars.map(jar => {
          if (jar.id !== jarId) return jar;
          if (jar.stars.length >= jar.goal) return jar;

          const alreadyToday = jar.stars.some(st => st.date === todayStr());
          let newStreak = jar.streak;
          if (!alreadyToday) {
            if (jar.lastDate === yesterdayStr()) {
              newStreak += 1;
            } else {
              newStreak = 1;
            }
          }

          const newStars = [...jar.stars, { date: todayStr(), id: genId() }];
          let celebrated = jar.celebrated;

          if (newStars.length >= jar.goal && !jar.celebrated) {
            celebrated = true;
            result = { celebrated: true, jarName: jar.name };
          }

          return { ...jar, stars: newStars, lastDate: todayStr(), streak: newStreak, celebrated };
        });

        const newTotalStars = newJars.reduce((sum, jar) => sum + jar.stars.length, 0);
        return { ...s, jars: newJars, totalStars: newTotalStars };
      })
    };

    if (updated) setState(newState);
    return result;
  };

  const removeStar = (studentId: string, jarId: string) => {
    setState(prev => ({
      ...prev,
      students: prev.students.map(s => {
        if (s.id !== studentId) return s;
        const newJars = s.jars.map(jar => {
          if (jar.id !== jarId || jar.stars.length === 0) return jar;
          const newStars = [...jar.stars];
          const removed = newStars.pop()!;

          let newStreak = jar.streak;
          let newLastDate = jar.lastDate;

          if (removed.date === todayStr()) {
            const stillHasToday = newStars.some(st => st.date === todayStr());
            if (!stillHasToday) {
              newStreak = Math.max(0, jar.streak - 1);
              const last = newStars[newStars.length - 1];
              newLastDate = last ? last.date : null;
            }
          }

          const celebrated = newStars.length < jar.goal ? false : jar.celebrated;
          return { ...jar, stars: newStars, streak: newStreak, lastDate: newLastDate, celebrated };
        });

        const newTotalStars = newJars.reduce((sum, jar) => sum + jar.stars.length, 0);
        return { ...s, jars: newJars, totalStars: newTotalStars };
      })
    }));
  };

  const addAttendance = (studentId: string, name: string) => {
    setState(prev => ({
      ...prev,
      students: prev.students.map(s => {
        if (s.id !== studentId) return s;
        const d = new Date();
        const dateStr = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
        const newRecord = {
          id: genId(),
          name,
          date: dateStr,
          status: 'present' as const
        };
        return { ...s, attendanceList: [...s.attendanceList, newRecord] };
      })
    }));
  };

  const toggleAttendance = (studentId: string, recordId: string) => {
    setState(prev => ({
      ...prev,
      students: prev.students.map(s => {
        if (s.id !== studentId) return s;
        const list = [...s.attendanceList];
        const idx = list.findIndex(a => a.id === recordId);
        if (idx === -1) return s;

        const record = list[idx];
        if (record.status === 'present') {
          list[idx] = { ...record, status: 'leave' };
        } else if (record.status === 'leave') {
          list[idx] = { ...record, status: 'absent' };
        } else if (record.status === 'absent') {
          if (confirm(`确定要删除【${record.name}】的打卡记录吗？`)) {
            list.splice(idx, 1);
          } else {
            list[idx] = { ...record, status: 'present' };
          }
        }
        return { ...s, attendanceList: list };
      })
    }));
  };

  const updateStageGoal = (studentId: string, goal: number) => {
    setState(prev => ({
      ...prev,
      students: prev.students.map(s => s.id === studentId ? { ...s, stageGoal: goal } : s)
    }));
  };

  const importData = (data: AppState) => {
    setState(data);
  };

  return (
    <AppContext.Provider value={{
      state, 
      globalRankings: [], // 本地版暂不支持全站排行
      addStudent, editStudent, removeStudent,
      addJar, editJar, removeJar, addStar, removeStar,
      addAttendance, toggleAttendance, updateStageGoal,
      importData, flashMessage, message
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useAppContext must be used within AppProvider');
  return context;
};
