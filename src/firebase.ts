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

// 已设置 Cloudflare Worker 反向代理以支持在中国访问
const PROXY_HOST = 'firebase-proxy.shennuo99-d55.workers.dev';

const db = initializeFirestore(app, {
  experimentalForceLongPolling: true, // 开启长轮询以支持代理
  host: PROXY_HOST + '/firestore',
  ssl: true
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
