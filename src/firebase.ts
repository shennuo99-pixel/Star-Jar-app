import { initializeApp } from "firebase/app";
import { getFirestore, enableIndexedDbPersistence } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCFe5w7AxLN3WK3h1-5ZGqg3txCvX63Oj4",
  authDomain: "star-jar-app.firebaseapp.com",
  projectId: "star-jar-app",
  storageBucket: "star-jar-app.firebasestorage.app",
  messagingSenderId: "908573023370",
  appId: "1:908573023370:web:f5a4564a6237b516806173",
  measurementId: "G-5F4N9803FM"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
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