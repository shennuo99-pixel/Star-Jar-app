import React, { useMemo } from 'react';

const BackgroundElements: React.FC = () => {
  const twinkles = useMemo(() => {
    const arr = [];
    for (let i = 0; i < 50; i++) {
      const x = Math.random() * 100; 
      const y = Math.random() * 100; 
      const dur = 2 + Math.random() * 5; 
      const delay = Math.random() * 6;
      const r = Math.random();
      const cls = r < 0.15 ? 'twinkle gold' : (r < 0.3 ? 'twinkle large' : 'twinkle');
      
      arr.push(
        <div 
          key={i} 
          className={cls} 
          style={{
            left: `${x}%`, 
            top: `${y}%`, 
            '--dur': `${dur}s`, 
            '--delay': `${delay}s`
          } as React.CSSProperties}
        />
      );
    }
    return arr;
  }, []);

  return (
    <>
      <div className="twinkle-layer">
        {twinkles}
      </div>
      <div className="meteor-layer">
        <div className="meteor m1"></div>
        <div className="meteor m2"></div>
        <div className="meteor m3"></div>
        <div className="meteor m4"></div>
      </div>
    </>
  );
};

export default BackgroundElements;