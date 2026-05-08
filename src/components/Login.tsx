import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';

const Login: React.FC = () => {
  const { loginWithGoogle, loginWithEmail, registerWithEmail } = useAppContext();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isRegister) {
        await registerWithEmail(email, password);
      } else {
        await loginWithEmail(email, password);
      }
    } catch (err: any) {
      setError(err.message || '操作失败');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setLoading(true);
    try {
      await loginWithGoogle();
    } catch (err: any) {
      setError(err.message || 'Google 登录失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-icon">✦</div>
        <h1>星星<em>罐子</em></h1>
        <p className="login-subtitle">为每个孩子点亮坚持的光芒</p>

        <div className="login-features">
          <div className="feature-item">
            <span className="feature-icon">★</span>
            <span>多端同步，数据永不丢失</span>
          </div>
          <div className="feature-item">
            <span className="feature-icon">★</span>
            <span>全站排行，激发学生荣誉感</span>
          </div>
          <div className="feature-item">
            <span className="feature-icon">★</span>
            <span>精美奖状，记录每一个成长瞬间</span>
          </div>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>邮箱地址</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              required
            />
          </div>
          <div className="form-group">
            <label>密码</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>
          
          {error && <div style={{ color: 'var(--coral)', fontSize: '13px', marginBottom: '16px' }}>{error}</div>}

          <button className="btn btn-primary login-btn" type="submit" disabled={loading}>
            {loading ? '正在处理...' : (isRegister ? '立即注册' : '登录系统')}
          </button>
        </form>

        <div className="divider">
          <span>或者</span>
        </div>

        <button className="btn btn-google login-btn" onClick={handleGoogleLogin} disabled={loading}>
          使用 Google 账号继续
        </button>

        <div className="login-toggle">
          {isRegister ? '已有账号？' : '还没有账号？'}
          <button onClick={() => setIsRegister(!isRegister)}>
            {isRegister ? '立即登录' : '创建新账号'}
          </button>
        </div>

        <div className="login-footer">
          © 2026 星星罐子 · 专业的班级管理与激励工具
        </div>
      </div>
    </div>
  );
};

export default Login;