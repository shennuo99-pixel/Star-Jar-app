import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { totalStars, completedJars, getInitial, darken, COLORS } from '../utils';

interface HomeProps {
  onSelectStudent: (id: string) => void;
}

const Home: React.FC<HomeProps> = ({ onSelectStudent }) => {
  const { 
    state, 
    addStudent, 
    removeStudent, 
    editStudent, 
    importData,
    globalRankings,
    user
  } = useAppContext();
  const [search, setSearch] = useState('');
  const [showImportModal, setShowImportModal] = useState(false);
  const [importTab, setImportTab] = useState<'manual' | 'paste' | 'csv'>('manual');
  const [leaderboardTab, setLeaderboardTab] = useState<'class' | 'global'>('class');
  const [manualName, setManualName] = useState('');
  const [manualMeta, setManualMeta] = useState('');
  const [manualColor, setManualColor] = useState(COLORS[0]);
  const [pasteText, setPasteText] = useState('');

  const filteredStudents = state.students.filter(s => 
    s.name.toLowerCase().includes(search.toLowerCase()) || 
    s.meta.toLowerCase().includes(search.toLowerCase())
  );

  const stats = {
    totalStudents: state.students.length,
    totalStars: state.students.reduce((acc, s) => acc + totalStars(s), 0),
    avgStars: state.students.length ? (state.students.reduce((acc, s) => acc + totalStars(s), 0) / state.students.length).toFixed(1) : '0',
    totalJars: state.students.reduce((acc, s) => acc + s.jars.length, 0),
    completedJars: state.students.reduce((acc, s) => acc + completedJars(s), 0),
  };

  const rankedStudents = [...state.students]
    .map(s => ({ ...s, total: totalStars(s) }))
    .filter(s => s.total > 0)
    .sort((a, b) => b.total - a.total)
    .slice(0, 8);

  const handleConfirmImport = () => {
    if (importTab === 'manual') {
      if (!manualName.trim()) return;
      addStudent(manualName.trim(), manualMeta, manualColor);
      setManualName('');
      setManualMeta('');
      setManualColor(COLORS[0]);
    } else if (importTab === 'paste') {
      const names = pasteText.split('\n').map(n => n.trim()).filter(Boolean);
      names.forEach(name => addStudent(name));
      setPasteText('');
    }
    setShowImportModal(false);
  };

  const handleExport = () => {
    const dataStr = JSON.stringify(state);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = 'star-jar-backup.json';
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        importData(data);
      } catch (err) {
        alert('导入失败');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div id="page-home">
      <div className="header">
        <div className="header-mark">— a teacher's small ritual —</div>
        <h1>班级<em>星图</em></h1>
        <p>每一颗星星，都是一个孩子坚持下来的瞬间</p>
      </div>

      <div className="toolbar">
        <div className="search-box">
          <span className="search-icon">⌕</span>
          <input 
            type="text" 
            placeholder="搜索学生姓名…" 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="toolbar-actions">
          <button className="btn" onClick={() => setShowImportModal(true)}>＋ 添加学生</button>
          <button className="btn-ghost btn" onClick={handleExport} title="备份所有数据">⇩ 备份</button>
          <label className="btn-ghost btn" style={{ cursor: 'pointer' }}>
            ⇧ 恢复
            <input type="file" accept=".json" style={{ display: 'none' }} onChange={handleImportFile} />
          </label>
        </div>
      </div>

      <div className="class-stats">
        <div className="stat-card">
          <div className="stat-label">学生人数</div>
          <div className="stat-value">{stats.totalStudents}</div>
          <div className="stat-detail">{stats.totalStudents ? '正在闪耀' : '还未添加'}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">收集星星</div>
          <div className="stat-value">{stats.totalStars}</div>
          <div className="stat-detail">人均 {stats.avgStars} 颗</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">习惯罐子</div>
          <div className="stat-value">{stats.totalJars}</div>
          <div className="stat-detail">{stats.completedJars} 个已装满</div>
        </div>
      </div>

      <div className="main-layout">
        <div id="students-section">
          <div className="students-grid">
            {filteredStudents.length === 0 && state.students.length === 0 ? (
              <div className="empty-state" style={{ gridColumn: '1/-1' }}>
                <div className="empty-state-icon">✦</div>
                <h3>开始你的<em>班级星图</em></h3>
                <p>添加你的第一位学生，给他们一个收集星星的小宇宙</p>
                <div className="empty-state-actions">
                  <button className="btn btn-primary" onClick={() => setShowImportModal(true)}>＋ 添加学生</button>
                </div>
              </div>
            ) : filteredStudents.length === 0 ? (
              <div className="empty-state" style={{ gridColumn: '1/-1' }}>
                <div className="empty-state-icon">⌕</div>
                <h3>没有找到 <em>"{search}"</em></h3>
                <p>试试其他关键词吧</p>
              </div>
            ) : (
              <>
                {filteredStudents.map(s => (
                  <div key={s.id} className="student-card" onClick={() => onSelectStudent(s.id)}>
                    <div className="student-card-actions">
                      <button className="icon-btn" onClick={(e) => {
                        e.stopPropagation();
                        const name = prompt('姓名', s.name);
                        const meta = prompt('备注', s.meta);
                        if (name) editStudent(s.id, name, meta || '');
                      }}>✎</button>
                      <button className="icon-btn" onClick={(e) => {
                        e.stopPropagation();
                        if (confirm('确定删除？')) removeStudent(s.id);
                      }}>✕</button>
                    </div>
                    <div className="student-card-top">
                      <div className="avatar" style={{ background: `linear-gradient(135deg, ${s.color}, ${darken(s.color)})` }}>
                        {getInitial(s.name)}
                      </div>
                      <div>
                        <div className="student-name">{s.name}</div>
                        {s.meta && <div className="student-meta">{s.meta}</div>}
                      </div>
                    </div>
                    <div className="student-progress">
                      <div className="progress-stat">
                        <div className="progress-num">{totalStars(s)}</div>
                        <div className="progress-label">stars</div>
                      </div>
                      <div className="progress-stat">
                        <div className="progress-num">{s.jars.length}</div>
                        <div className="progress-label">jars</div>
                      </div>
                      <div className="progress-stat">
                        <div className="progress-num">{completedJars(s)}</div>
                        <div className="progress-label">filled</div>
                      </div>
                    </div>
                  </div>
                ))}
                <div className="add-student-card" onClick={() => setShowImportModal(true)}>
                  <div className="add-student-icon">+</div>
                  <div className="add-student-text">添加学生</div>
                </div>
              </>
            )}
          </div>
        </div>
        <div className="leaderboard">
          <div className="leaderboard-header">
            <div className={`leaderboard-tab ${leaderboardTab === 'class' ? 'active' : ''}`} onClick={() => setLeaderboardTab('class')}>
              班级荣誉
            </div>
            <div className={`leaderboard-tab ${leaderboardTab === 'global' ? 'active' : ''}`} onClick={() => setLeaderboardTab('global')}>
              全站排行
            </div>
          </div>
          
          <div className="leaderboard-title">
            {leaderboardTab === 'class' ? <>荣誉<em>星图</em></> : <>全站<em>星榜</em></>}
          </div>
          <div className="leaderboard-sub">
            {leaderboardTab === 'class' ? '— class honor roll —' : '— global leaderboard —'}
          </div>

          <ul className="rank-list">
            {leaderboardTab === 'class' ? (
              rankedStudents.length === 0 ? (
                <li style={{ color: 'var(--ink-faint)', fontStyle: 'italic', textAlign: 'center', padding: '20px 0' }}>还没有星星呢</li>
              ) : (
                rankedStudents.map((s, i) => (
                  <li key={s.id} className={`rank-item ${i < 3 ? 'top-' + (i + 1) : ''}`} onClick={() => onSelectStudent(s.id)}>
                    <div className="rank-num">{i + 1}</div>
                    <div className="rank-avatar" style={{ background: `linear-gradient(135deg, ${s.color}, ${darken(s.color)})` }}>
                      {getInitial(s.name)}
                    </div>
                    <div className="rank-info">
                      <div className="rank-name">{s.name}</div>
                      <div className="rank-stars">{totalStars(s)} 颗星星</div>
                    </div>
                  </li>
                ))
              )
            ) : (
              globalRankings.length === 0 ? (
                <li style={{ color: 'var(--ink-faint)', fontStyle: 'italic', textAlign: 'center', padding: '20px 0' }}>暂无排行数据</li>
              ) : (
                globalRankings.map((s, i) => {
                  const isMine = s.teacherId === user?.uid;
                  return (
                    <li 
                      key={s.id} 
                      className={`rank-item ${i < 3 ? 'top-' + (i + 1) : ''} ${isMine ? 'is-mine' : ''}`}
                      onClick={() => isMine && onSelectStudent(s.id)}
                      title={isMine ? '查看详细信息' : '该学生属于其他老师'}
                    >
                      <div className="rank-num">{i + 1}</div>
                      <div className="rank-avatar" style={{ background: `linear-gradient(135deg, ${s.color}, ${darken(s.color)})` }}>
                        {getInitial(s.name)}
                      </div>
                      <div className="rank-info">
                        <div className="rank-name">
                          {s.name}
                          {isMine && <span className="mine-badge">我的</span>}
                        </div>
                        <div className="rank-stars">{s.totalStars || 0} 颗星星</div>
                      </div>
                    </li>
                  );
                })
              )
            )}
          </ul>
        </div>
      </div>

      {showImportModal && (
        <div className="modal show" onClick={() => setShowImportModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3>添加<em>学生</em></h3>
            <div className="modal-tabs">
              <button className={`modal-tab ${importTab === 'manual' ? 'active' : ''}`} onClick={() => setImportTab('manual')}>单个添加</button>
              <button className={`modal-tab ${importTab === 'paste' ? 'active' : ''}`} onClick={() => setImportTab('paste')}>批量粘贴</button>
            </div>
            {importTab === 'manual' && (
              <div className="tab-pane active">
                <div className="form-group">
                  <label>学生姓名</label>
                  <input 
                    type="text" 
                    placeholder="例如：张小明" 
                    value={manualName}
                    onChange={e => setManualName(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>备注/称号（可选）</label>
                  <input 
                    type="text" 
                    placeholder="例如：英语课代表" 
                    value={manualMeta}
                    onChange={e => setManualMeta(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>专属颜色</label>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '8px' }}>
                    {COLORS.map(c => (
                      <div 
                        key={c}
                        onClick={() => setManualColor(c)}
                        style={{ 
                          width: '32px', height: '32px', borderRadius: '50%', backgroundColor: c,
                          cursor: 'pointer', border: manualColor === c ? '3px solid white' : '2px solid transparent',
                          boxShadow: manualColor === c ? '0 0 10px rgba(255,255,255,0.3)' : 'none'
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}
            {importTab === 'paste' && (
              <div className="tab-pane active">
                <div className="form-group">
                  <label>粘贴姓名（一行一个）</label>
                  <textarea 
                    placeholder="张小明\n李小红\n王小华"
                    value={pasteText}
                    onChange={e => setPasteText(e.target.value)}
                  ></textarea>
                </div>
              </div>
            )}
            <div className="modal-actions">
              <button className="btn" onClick={() => setShowImportModal(false)}>取消</button>
              <button className="btn btn-primary" onClick={handleConfirmImport}>确认添加</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;