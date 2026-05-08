import React from 'react';
import { Jar } from '../types';
import { useAppContext } from '../context/AppContext';

interface JarComponentProps {
  jar: Jar;
  studentId: string;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

const JarComponent: React.FC<JarComponentProps> = ({ jar, studentId, onEdit, onDelete }) => {
  const { addStar, removeStar } = useAppContext();

  // Calculate star positions (visual only)
  const starPositions = React.useMemo(() => {
    return jar.stars.map((_, i) => ({
      left: 20 + (i % 5) * 25 + (Math.random() * 10 - 5),
      bottom: 20 + Math.floor(i / 5) * 20 + (Math.random() * 5),
      rotate: Math.random() * 360,
      scale: 0.8 + Math.random() * 0.4
    }));
  }, [jar.stars.length]);

  return (
    <div className={`jar-card ${jar.celebrated ? 'complete' : ''}`}>
      <div className="jar-label">{jar.name}</div>
      <div className="jar-streak">
        连续奖励: <strong>{jar.streak}</strong> 天
      </div>
      
      <div className="jar" onClick={() => addStar(studentId, jar.id)}>
        <svg viewBox="0 0 100 130">
          {/* Jar Body */}
          <path 
            className="jar-body" 
            d="M20,30 Q20,20 30,20 L70,20 Q80,20 80,30 L85,110 Q85,125 70,125 L30,125 Q15,125 15,110 Z" 
          />
          {/* Highlight */}
          <path 
            className="jar-highlight" 
            d="M30,25 L45,25 Q48,25 48,28 L48,115 Q48,120 45,120 L35,120 Q30,120 30,115 Z" 
            opacity="0.3"
          />
          {/* Lid */}
          <rect className="jar-lid" x="25" y="12" width="50" height="10" rx="3" />
          {/* Tag String */}
          <path className="jar-tag-string" d="M50,22 L65,45" />
          {/* Tag */}
          <rect className="jar-tag" x="55" y="45" width="25" height="15" rx="2" transform="rotate(15 67 52)" />
        </svg>

        <div className="stars-container">
          {starPositions.map((pos, i) => (
            <div 
              key={jar.stars[i].id} 
              className="star-piece"
              style={{ 
                left: `${pos.left}%`, 
                bottom: `${pos.bottom}px`,
                transform: `rotate(${pos.rotate}deg) scale(${pos.scale})`
              }}
            >
              <svg viewBox="0 0 24 24" fill="#f4c25a">
                <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
              </svg>
            </div>
          ))}
        </div>
      </div>

      <div className="jar-stats">
        <span className="count-current">{jar.stars.length}</span>
        <span className="count-divider">/</span>
        <span className="count-goal">{jar.goal}</span>
      </div>

      <div className="jar-actions">
        <button className="btn btn-sm" onClick={(e) => { e.stopPropagation(); onEdit(jar.id); }}>编辑</button>
        <button className="btn btn-sm" onClick={(e) => { e.stopPropagation(); removeStar(studentId, jar.id); }}>撤销星星</button>
        <button className="btn btn-sm btn-ghost" onClick={(e) => { e.stopPropagation(); onDelete(jar.id); }}>删除</button>
      </div>
    </div>
  );
};

export default JarComponent;