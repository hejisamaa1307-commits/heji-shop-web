"use client";

import { useEffect, useState } from 'react';
import './Loading.css';

export default function Loading() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          return 0; 
        }

        return Math.min(prev + Math.random() * 15, 100);
      });
    }, 200);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="loading-overlay">
      <div className="loading-container">
        <div className="loading-content">
          <div className="loading-progress-wrapper">
            <div className="loading-progress-track">
              <div 
                className="loading-progress-indicator"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="loading-progress-label">
              {Math.round(progress)}%
            </div>
          </div>
          
          <p className="loading-text">
            Đang tải dữ liệu...
          </p>
        </div>
      </div>
    </div>
  );
}
