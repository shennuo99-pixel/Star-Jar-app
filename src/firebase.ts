import { initializeApp } from "firebase/app";
import { initializeFirestore, enableIndexedDbPersistence } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

const app = initializeApp(firebaseConfig);

// 如果你在中国访问 Firebase 遇到困难，请参考 deployment_guide.md 设置 Cloudflare Worker 代理
// 并取消下面 initializeFirestore 的注释，同时注释掉默认的 initializeFirestore
const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
  // host: 'your-worker.workers.dev/firestore', 
  // ssl: true
});

const auth = getAuth(app);

// 开启离线持久化
if (typeof window !== 'undefined') {
  enableIndexedDbPersistence(db).catch((err) => {
    if (err.code === 'failed-precondition') {
      console.warn('Firebase persistence failed-precondition: Multiple tabs open?');
    } else if (err.code === 'unimplemented') {
      console.warn('Firebase persistence unimplemented: Browser not supported');
    }
  });
}

export { db, auth };
