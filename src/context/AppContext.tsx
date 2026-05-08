import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { AppState, Student, Jar } from '../types';
import { genId, pickColor, todayStr, yesterdayStr } from '../utils';
import { db, auth } from '../firebase';
import { 
  collection, 
  onSnapshot, 
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where,
  orderBy,
  limit 
} from 'firebase/firestore';
import { 
  onAuthStateChanged, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut, 
  User,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword
} from 'firebase/auth';

interface AppContextType {
  state: AppState;
  user: User | null;
  loading: boolean;
  loginWithGoogle: () => Promise<void>;
  registerWithEmail: (email: string, pass: string) => Promise<void>;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
  globalRankings: Student[];
  addStudent: (name: string, meta?: string, color?: string) => Promise<void>;
  editStudent: (id: string, name: string, meta: string) => Promise<void>;
  removeStudent: (id: string) => Promise<void>;
  addJar: (studentId: string, name: string, goal: number) => Promise<void>;
  editJar: (studentId: string, jarId: string, name: string, goal: number) => Promise<void>;
  removeJar: (studentId: string, jarId: string) => Promise<void>;
  addStar: (studentId: string, jarId: string) => Promise<{ celebrated: boolean, jarName: string } | null>;
  removeStar: (studentId: string, jarId: string) => Promise<void>;
  addAttendance: (studentId: string, name: string) => Promise<void>;
  toggleAttendance: (studentId: string, recordId: string) => Promise<void>;
  updateStageGoal: (studentId: string, goal: number) => Promise<void>;
  importData: (data: AppState) => Promise<void>;
  flashMessage: (msg: string) => void;
  message: string | null;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AppState>({ students: [] });
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [globalRankings, setGlobalRankings] = useState<Student[]>([]);

  useEffect(() => {
    // 监听全局排行榜 (所有老师的学生中星星最多的前 20 名)
    // 注意：这需要 Firestore 规则允许读取所有学生的特定字段，或者完全公开
    const q = query(
      collection(db, 'students'), 
      orderBy('totalStars', 'desc'), 
      limit(20)
    );
    const unsubscribeGlobal = onSnapshot(q, (snapshot) => {
      const rankings: Student[] = [];
      snapshot.forEach((doc) => {
        rankings.push(doc.data() as Student);
      });
      setGlobalRankings(rankings);
    }, (error) => {
      console.error('全局排行榜监听失败:', error);
    });

    const unsubscribeAuth = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => {
      unsubscribeGlobal();
      unsubscribeAuth();
    };
  }, []);

  useEffect(() => {
    if (!user) {
      setState({ students: [] });
      return;
    }

    const q = query(collection(db, 'students'), where('teacherId', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const students: Student[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as Student;
        students.push(data);
        
        // 自动修复：如果旧数据缺少 totalStars 字段，则进行补全
        // 这样他们才能出现在全局排行榜上
        if (data.totalStars === undefined) {
          const calculated = data.jars.reduce((sum, j) => sum + j.stars.length, 0);
          updateDoc(doc(db, 'students', data.id), { totalStars: calculated });
        }
      });
      setState({ students });
    }, (error) => {
      console.error('Firestore 监听失败:', error);
    });

    return () => unsubscribe();
  }, [user]);

  const flashMessage = useCallback((msg: string) => {
    setMessage(msg);
    setTimeout(() => setMessage(null), 2500);
  }, []);

  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  const registerWithEmail = async (email: string, pass: string) => {
    await createUserWithEmailAndPassword(auth, email, pass);
  };

  const loginWithEmail = async (email: string, pass: string) => {
    await signInWithEmailAndPassword(auth, email, pass);
  };

  const logout = async () => {
    await signOut(auth);
  };

  const addStudent = async (name: string, meta?: string, color?: string) => {
    if (!user) return;
    const id = genId();
    const newStudent: Student = {
      id,
      teacherId: user.uid,
      name,
      meta: meta || '',
      color: color || pickColor(state.students.length),
      jars: [],
      attendanceList: [],
      stageGoal: 10,
      totalStars: 0
    };
    await setDoc(doc(db, 'students', id), newStudent);
  };

  const editStudent = async (id: string, name: string, meta: string) => {
    await updateDoc(doc(db, 'students', id), { name, meta });
  };

  const removeStudent = async (id: string) => {
    await deleteDoc(doc(db, 'students', id));
  };

  const addJar = async (studentId: string, name: string, goal: number) => {
    const student = state.students.find(s => s.id === studentId);
    if (!student) return;

    const newJar: Jar = {
      id: genId(),
      name,
      goal,
      stars: [],
      lastDate: null,
      streak: 0,
      celebrated: false
    };

    await updateDoc(doc(db, 'students', studentId), {
      jars: [...student.jars, newJar]
    });
  };

  const editJar = async (studentId: string, jarId: string, name: string, goal: number) => {
    const student = state.students.find(s => s.id === studentId);
    if (!student) return;

    const newJars = student.jars.map(j => {
      if (j.id !== jarId) return j;
      const celebrated = j.stars.length >= goal ? j.celebrated : false;
      return { ...j, name, goal, celebrated };
    });

    await updateDoc(doc(db, 'students', studentId), { jars: newJars });
  };

  const removeJar = async (studentId: string, jarId: string) => {
    const student = state.students.find(s => s.id === studentId);
    if (!student) return;

    const newJars = student.jars.filter(j => j.id !== jarId);
    const newTotalStars = newJars.reduce((sum, jar) => sum + jar.stars.length, 0);

    await updateDoc(doc(db, 'students', studentId), { 
      jars: newJars,
      totalStars: newTotalStars
    });
  };

  const addStar = async (studentId: string, jarId: string) => {
    const student = state.students.find(s => s.id === studentId);
    if (!student) return null;

    const totalToday = student.jars.reduce((sum, jar) => {
      return sum + jar.stars.filter(st => st.date === todayStr()).length;
    }, 0);

    if (totalToday >= 5) {
      flashMessage('已达到该学生今日奖励上限（5颗星星）');
      return null;
    }

    let result: { celebrated: boolean, jarName: string } | null = null;
    const newJars = student.jars.map(jar => {
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

    await updateDoc(doc(db, 'students', studentId), { 
      jars: newJars,
      totalStars: newTotalStars
    });
    return result;
  };

  const removeStar = async (studentId: string, jarId: string) => {
    const student = state.students.find(s => s.id === studentId);
    if (!student) return;

    const newJars = student.jars.map(jar => {
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

    await updateDoc(doc(db, 'students', studentId), { 
      jars: newJars,
      totalStars: newTotalStars
    });
  };

  const addAttendance = async (studentId: string, name: string) => {
    const student = state.students.find(s => s.id === studentId);
    if (!student) return;

    const d = new Date();
    const dateStr = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    const newRecord = {
      id: genId(),
      name,
      date: dateStr,
      status: 'present' as const
    };

    await updateDoc(doc(db, 'students', studentId), {
      attendanceList: [...student.attendanceList, newRecord]
    });
  };

  const toggleAttendance = async (studentId: string, recordId: string) => {
    const student = state.students.find(s => s.id === studentId);
    if (!student) return;

    const list = [...student.attendanceList];
    const idx = list.findIndex(a => a.id === recordId);
    if (idx === -1) return;

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

    await updateDoc(doc(db, 'students', studentId), { attendanceList: list });
  };

  const updateStageGoal = async (studentId: string, goal: number) => {
    await updateDoc(doc(db, 'students', studentId), { stageGoal: goal });
  };

  const importData = async (data: AppState) => {
    if (!user) return;
    for (const student of data.students) {
      await setDoc(doc(db, 'students', student.id), { ...student, teacherId: user.uid });
    }
  };

  return (
    <AppContext.Provider value={{
      state, user, loading, loginWithGoogle, registerWithEmail, loginWithEmail, logout,
      globalRankings,
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
