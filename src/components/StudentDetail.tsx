import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { totalStars, completedJars, getInitial, darken } from '../utils';
import JarComponent from './JarComponent';

interface StudentDetailProps {
  studentId: string;
}

const StudentDetail: React.FC<StudentDetailProps> = ({ studentId }) => {
  const { 
    state, 
    addJar, 
    editJar, 
    removeJar, 
    addAttendance, 
    toggleAttendance, 
    updateStageGoal 
  } = useAppContext();
  
  const [showJarModal, setShowJarModal] = useState(false);
  const [editingJarId, setEditingJarId] = useState<string | null>(null);
  const [jarName, setJarName] = useState('');
  const [jarGoal, setJarGoal] = useState(21);
  const [showCertModal, setShowCertModal] = useState(false);
  const [teacherSignature, setTeacherSignature] = useState('星星罐子导师');

  const student = state.students.find(s => s.id === studentId);
  if (!student) return <div>未找到学生</div>;

  const totalS = totalStars(student);
  const completedJ = completedJars(student);

  // Calculate streak for attendance
  let streak = 0;
  const list = [...(student.attendanceList || [])].reverse();
  for (const record of list) {
    if (record.status === 'present') streak++;
    else break;
  }

  const handleSaveJar = () => {
    if (!jarName.trim()) return;
    if (editingJarId) {
      editJar(studentId, editingJarId, jarName, jarGoal);
    } else {
      addJar(studentId, jarName, jarGoal);
    }
    setShowJarModal(false);
    setEditingJarId(null);
    setJarName('');
    setJarGoal(21);
  };

  const handleAddAttendance = () => {
    const name = prompt('课程名称', `第${student.attendanceList.length + 1}课`);
    if (name) addAttendance(studentId, name);
  };

  return (
    <div id="page-student">
      <div className="student-header">
        <div className="avatar" style={{ background: `linear-gradient(135deg, ${student.color}, ${darken(student.color)})` }}>
          {getInitial(student.name)}
        </div>
        <div>
          <h1>{student.name} <em>的星图</em></h1>
          <div className="student-header-meta">
            {totalS} 颗星星 · {student.jars.length} 个罐子 · {completedJ} 个装满
            {student.meta ? ` · ${student.meta}` : ''}
          </div>
        </div>
        <div className="student-header-actions">
          <button className="btn" onClick={() => { setShowJarModal(true); setEditingJarId(null); }}>＋ 新罐子</button>
        </div>
      </div>

      <div className="heatmap-section">
        <div className="heatmap-header">
          <div>
            <div className="heatmap-title">出勤<em>打卡轨迹</em></div>
            <div className="heatmap-sub">— independent attendance track —</div>
          </div>
          <div className="stage-goal-wrap">
            <span style={{ fontSize: '13px', color: 'var(--ink-soft)' }}>阶段目标:</span>
            <input 
              type="number" 
              className="stage-input" 
              value={student.stageGoal} 
              onChange={(e) => updateStageGoal(studentId, parseInt(e.target.value) || 10)} 
            />
            <span style={{ fontSize: '13px', color: 'var(--ink-soft)' }}>节</span>
            <span id="streak-text" style={{ marginLeft: '12px', fontSize: '13px', color: 'var(--gold)', fontStyle: 'italic' }}>
              已连续: {streak} 节
            </span>
            <button 
              className={`certificate-btn ${streak >= student.stageGoal ? 'show' : ''}`}
              onClick={() => setShowCertModal(true)}
            >
              🏆 颁发奖状
            </button>
          </div>
        </div>
        <div className="heatmap-single" style={{ gap: '8px' }}>
          {student.attendanceList.map(record => {
            let cls = '';
            let txt = '';
            if (record.status === 'present') { cls = 'att-present'; txt = '✓'; }
            if (record.status === 'leave') { cls = 'att-leave'; txt = '请'; }
            if (record.status === 'absent') { cls = 'att-absent'; txt = '缺'; }
            
            return (
              <div 
                key={record.id} 
                className={`heat-cell att-cell ${cls}`} 
                onClick={() => toggleAttendance(studentId, record.id)}
                title={`${record.name} (${record.date})`}
              >
                {txt}
              </div>
            );
          })}
          <div 
            className="heat-cell att-cell" 
            style={{ background: 'rgba(244,194,90,0.05)', border: '1px dashed var(--gold-soft)', color: 'var(--gold)', fontSize: '16px' }}
            onClick={handleAddAttendance}
          >
            +
          </div>
        </div>
        <div className="heatmap-legend">
          <span className="legend-item"><span className="legend-cell" style={{ background: 'rgba(244, 194, 90, 0.7)', borderColor: 'var(--gold)' }}></span>出勤</span>
          <span className="legend-item"><span className="legend-cell" style={{ background: 'rgba(142, 197, 224, 0.4)', borderColor: 'var(--sky)' }}></span>请假</span>
          <span className="legend-item"><span className="legend-cell" style={{ background: 'rgba(245, 160, 126, 0.4)', borderColor: 'var(--coral)' }}></span>缺席</span>
        </div>
      </div>

      <div className="jars">
        {student.jars.length === 0 ? (
          <div className="empty-state" style={{ gridColumn: '1/-1' }}>
            <div className="empty-state-icon">✦</div>
            <h3>给 <em>{student.name}</em> 加一个罐子</h3>
            <p>每个罐子收集一个习惯的星星</p>
            <div className="empty-state-actions">
              <button className="btn btn-primary" onClick={() => setShowJarModal(true)}>＋ 创建罐子</button>
            </div>
          </div>
        ) : (
          student.jars.map(jar => (
            <JarComponent 
              key={jar.id} 
              jar={jar} 
              studentId={studentId} 
              onEdit={(id) => {
                const j = student.jars.find(x => x.id === id);
                if (j) {
                  setEditingJarId(id);
                  setJarName(j.name);
                  setJarGoal(j.goal);
                  setShowJarModal(true);
                }
              }}
              onDelete={(id) => {
                if (confirm('确定删除罐子？')) removeJar(studentId, id);
              }}
            />
          ))
        )}
      </div>

      {showJarModal && (
        <div className="modal show" onClick={() => setShowJarModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3>{editingJarId ? '编辑' : '新的'}<em>罐子</em></h3>
            <div className="form-group">
              <label>习惯名称</label>
              <input 
                type="text" 
                value={jarName} 
                onChange={e => setJarName(e.target.value)} 
                placeholder="例如：晨间阅读" 
              />
            </div>
            <div className="form-group">
              <label>目标星星数</label>
              <input 
                type="number" 
                value={jarGoal} 
                onChange={e => setJarGoal(parseInt(e.target.value) || 21)} 
              />
            </div>
            <div className="modal-actions">
              <button className="btn" onClick={() => setShowJarModal(false)}>取消</button>
              <button className="btn btn-primary" onClick={handleSaveJar}>保存</button>
            </div>
          </div>
        </div>
      )}

      {showCertModal && (
        <div className="modal show" onClick={() => setShowCertModal(false)}>
          <div className="modal-content" style={{ maxWidth: '900px', width: '95%', textAlign: 'center', background: 'rgba(13, 20, 36, 0.95)', border: '1px solid var(--gold-soft)', padding: '40px' }} onClick={e => e.stopPropagation()}>
            <div id="print-area" className="print-area" style={{ 
              background: '#0d1424', 
              padding: '40px', 
              border: '2px solid #b28a3c', 
              borderRadius: '8px', 
              color: '#f5e9c8', 
              position: 'relative',
              overflow: 'hidden'
            }}>
              {/* Starry Decorations */}
              <div style={{ position: 'absolute', top: '10px', right: '10px', fontSize: '40px', opacity: 0.4 }}>✨</div>
              <div style={{ position: 'absolute', bottom: '10px', left: '10px', fontSize: '40px', opacity: 0.4 }}>✨</div>
              <div style={{ position: 'absolute', top: '50%', left: '-20px', fontSize: '24px', opacity: 0.2 }}>✦</div>
              <div style={{ position: 'absolute', top: '20%', right: '5%', fontSize: '24px', opacity: 0.2 }}>✦</div>

              <div style={{ border: '1px solid rgba(178, 138, 60, 0.3)', padding: '40px', position: 'relative', zIndex: 1 }}>
                <div style={{ marginBottom: '40px' }}>
                  <div style={{ color: 'var(--gold)', fontSize: '14px', letterSpacing: '8px', marginBottom: '16px', textTransform: 'uppercase' }}>Certificate of Excellence</div>
                  <h1 style={{ fontSize: '64px', color: 'var(--gold)', marginBottom: '0', fontWeight: 600, fontFamily: 'var(--serif-display)' }}>荣誉证书</h1>
                  <div style={{ height: '2px', background: 'linear-gradient(90deg, transparent, var(--gold), transparent)', width: '60%', margin: '20px auto' }}></div>
                </div>

                <div style={{ textAlign: 'left', fontSize: '24px', marginBottom: '40px', lineHeight: 1.8 }}>
                  兹证明 <span style={{ fontSize: '36px', color: 'var(--gold)', fontWeight: 600, borderBottom: '2px solid var(--gold)', padding: '0 12px', margin: '0 8px' }}>{student.name}</span> 同学：
                </div>

                <div style={{ fontSize: '22px', lineHeight: 2, textAlign: 'justify', textIndent: '2em', marginBottom: '50px', color: 'rgba(245, 233, 200, 0.9)' }}>
                  在星图探索之旅中，展现了如恒星般的持久毅力。在最近的 <strong style={{ color: 'var(--gold)', fontSize: '28px' }}>{student.stageGoal}</strong> 节课程中，不仅出色完成了各项任务，更以<strong>完美的出勤记录</strong>照亮了整个班级。
                </div>

                <div style={{ margin: '60px 0' }}>
                  <div style={{ fontSize: '16px', color: 'var(--gold)', marginBottom: '12px', letterSpacing: '4px' }}>授予荣誉称号</div>
                  <div style={{ fontSize: '42px', fontWeight: 700, color: '#fff', textShadow: '0 0 20px rgba(244, 194, 90, 0.6)', padding: '16px', border: '1px solid var(--gold-soft)', borderRadius: '12px', display: 'inline-block', background: 'rgba(244, 194, 90, 0.1)' }}>
                    恒星学者 · 卓越出勤奖
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '40px', padding: '0 20px' }}>
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontSize: '14px', color: 'var(--ink-faint)', marginBottom: '4px' }}>颁发日期</div>
                    <div style={{ fontSize: '18px' }}>{new Date().toLocaleDateString()}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '14px', color: 'var(--ink-faint)', marginBottom: '4px' }}>导师签章</div>
                    <div style={{ fontSize: '28px', color: 'var(--gold)', fontFamily: 'var(--serif-display)', fontStyle: 'italic' }}>{teacherSignature}</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="cert-controls" style={{ marginTop: '32px', display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center' }}>
              <div className="form-group" style={{ width: '100%', maxWidth: '300px', marginBottom: 0 }}>
                <label style={{ color: 'var(--ink-soft)' }}>修改导师署名</label>
                <input 
                  type="text" 
                  value={teacherSignature} 
                  onChange={e => setTeacherSignature(e.target.value)}
                  style={{ textAlign: 'center', background: 'rgba(255,255,255,0.05)' }}
                />
              </div>
              <div className="modal-actions" style={{ justifyContent: 'center', width: '100%' }}>
                <button className="btn" onClick={() => setShowCertModal(false)}>返回</button>
                <button className="btn btn-primary" onClick={() => window.print()}>⇩ 导出高清 PDF 奖状</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentDetail;