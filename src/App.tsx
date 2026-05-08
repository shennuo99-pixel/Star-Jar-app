import React, { useState } from 'react';
import { AppProvider, useAppContext } from './context/AppContext';
import BackgroundElements from './components/BackgroundElements';
import Home from './components/Home';
import StudentDetail from './components/StudentDetail';
import Login from './components/Login';

const AppContent: React.FC = () => {
  const { message, loading, user, logout } = useAppContext();
  const [view, setView] = useState<{ type: 'home' | 'student'; id?: string }>({ type: 'home' });

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <p>正在连接星空...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <>
        <BackgroundElements />
        <Login />
      </>
    );
  }

  return (
    <>
      <BackgroundElements />
      
      <div className="nav">
        <div className="nav-brand" onClick={() => setView({ type: 'home' })}>
          <span className="nav-brand-icon">✦</span>
          <span className="nav-brand-text">星星<em>罐子</em></span>
        </div>
        <div className="breadcrumb">
          {view.type === 'student' && (
            <>
              <button onClick={() => setView({ type: 'home' })}>班级总览</button> · 学生页
            </>
          )}
        </div>
        <div className="nav-user">
          <span className="user-name">{user.email || '老师'}</span>
          <button className="btn-ghost btn-sm btn" onClick={logout}>退出</button>
        </div>
      </div>

      {view.type === 'home' ? (
        <Home onSelectStudent={(id) => setView({ type: 'student', id })} />
      ) : (
        <StudentDetail studentId={view.id!} />
      )}

      {message && (
        <div className="flash-msg" style={{ opacity: 1 }}>
          {message}
        </div>
      )}
    </>
  );
};

function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App;