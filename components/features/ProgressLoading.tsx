"use client";

interface ProgressLoadingProps {
  progress: number; // 0-100
  currentStep: string;
  totalSteps?: number;
  currentStepNumber?: number;
}

// Inline styles for shimmer animation
const shimmerStyle = {
  animation: 'shimmer 1.5s infinite',
};

// Add keyframes to document if not exists
if (typeof document !== 'undefined') {
  const styleId = 'progress-loading-shimmer';
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      @keyframes shimmer {
        0% { transform: translateX(-100%); }
        100% { transform: translateX(100%); }
      }
    `;
    document.head.appendChild(style);
  }
}

export default function ProgressLoading({ 
  progress, 
  currentStep, 
  totalSteps,
  currentStepNumber 
}: ProgressLoadingProps) {
  return (
    <div className="fixed inset-0 z-[99998] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-black border-2 border-white/40 rounded-2xl p-6 sm:p-8 max-w-md w-full mx-4 shadow-2xl">
        <div className="flex flex-col items-center gap-4">
          {/* Spinner */}
          <div className="relative w-16 h-16">
            <svg className="animate-spin h-16 w-16 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>

          {/* Progress Bar */}
          <div className="w-full">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-300 font-medium">{currentStep}</span>
              <span className="text-sm text-gray-400">{Math.round(progress)}%</span>
            </div>
            <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full transition-all duration-300 ease-out relative overflow-hidden"
                style={{ width: `${progress}%` }}
              >
                <div 
                  className="h-full w-full bg-gradient-to-r from-transparent via-white/30 to-transparent absolute inset-0"
                  style={shimmerStyle}
                ></div>
              </div>
            </div>
            {totalSteps && currentStepNumber && (
              <div className="text-xs text-gray-400 mt-1 text-center">
                Bước {currentStepNumber}/{totalSteps}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

