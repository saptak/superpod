import React, { useState } from 'react';

interface AIButtonProps {
  className?: string;
  onClick?: () => void;
}

const AIButton: React.FC<AIButtonProps> = ({ className = "", onClick }) => {
  const [isGlowing, setIsGlowing] = useState(false);

  const handleClick = () => {
    setIsGlowing(!isGlowing);
    if (onClick) {
      onClick();
    }
  };

    return (
    <>
      {/* Desktop AI Button */}
      <button
        className={`fixed left-1/2 transform -translate-x-1/2 p-4 transition-all duration-300 overflow-hidden hidden md:block ${className}`}
        style={{
          bottom: '61px', // 56px (media player height) + 5px gap
          borderTopLeftRadius: '12px',
          borderTopRightRadius: '12px',
          borderBottomLeftRadius: '12px',
          borderBottomRightRadius: '12px',
          width: '1160px',
          height: '64px',
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 30%, #1e3a8a 100%)',
          border: 'none',
          zIndex: 10,
          boxShadow: isGlowing 
            ? '0 0 25px rgba(30, 58, 138, 0.8), 0 0 50px rgba(30, 58, 138, 0.6), 0 0 75px rgba(30, 58, 138, 0.4)'
            : '0 4px 12px rgba(0, 0, 0, 0.2)'
        }}
        onClick={handleClick}
      >
      {/* Animated stars background */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full opacity-60"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animation: `twinkle 2s infinite ${Math.random() * 2}s, float 4s infinite ${Math.random() * 4}s linear`
            }}
          />
        ))}
      </div>
      
      {/* Scanning line effect */}
      <div 
        className="absolute top-0 left-0 w-full h-full pointer-events-none"
        style={{
          background: isGlowing 
            ? 'linear-gradient(90deg, transparent 0%, rgba(59, 130, 246, 0.3) 50%, transparent 100%)'
            : 'none',
          animation: isGlowing ? 'scan 3s infinite linear' : 'none'
        }}
      />
      
      <div className="flex items-center justify-center h-full relative z-10">
        <div className="flex items-center space-x-3">
          <img 
            src="/src/assets/meta_logo.svg" 
            alt="Meta Logo" 
            className="w-6 h-6"
            style={{ filter: 'brightness(0) invert(1)' }}
          />
          <span className="text-white font-medium text-base">
            {isGlowing ? "Start speaking" : "Ask AI Assistant"}
          </span>
          {isGlowing && (
            <div className="flex space-x-1">
              <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>
              <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
              <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
            </div>
          )}
        </div>
      </div>
      
      <style>
        {`
        @keyframes twinkle {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.2); }
        }
        
        @keyframes float {
          0% { transform: translateX(-10px); }
          100% { transform: translateX(10px); }
        }
        
        @keyframes scan {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        `}
      </style>
          </button>

      {/* Mobile AI Button */}
      <button
        className={`fixed left-4 right-4 p-3 transition-all duration-300 overflow-hidden block md:hidden ${className}`}
        style={{
          bottom: '61px', // 56px (media player height) + 5px gap
          borderTopLeftRadius: '12px',
          borderTopRightRadius: '12px',
          borderBottomLeftRadius: '12px',
          borderBottomRightRadius: '12px',
          height: '64px',
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 30%, #1e3a8a 100%)',
          border: 'none',
          zIndex: 10,
          boxShadow: isGlowing 
            ? '0 0 20px rgba(30, 58, 138, 0.8), 0 0 40px rgba(30, 58, 138, 0.6), 0 0 60px rgba(30, 58, 138, 0.4)'
            : '0 4px 12px rgba(0, 0, 0, 0.2)'
        }}
        onClick={handleClick}
      >
        {/* Animated stars background */}
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-white rounded-full opacity-60"
              style={{
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                animation: `twinkle 2s infinite ${Math.random() * 2}s, float 4s infinite ${Math.random() * 4}s linear`
              }}
            />
          ))}
        </div>
        
        {/* Scanning line effect */}
        <div 
          className="absolute top-0 left-0 w-full h-full pointer-events-none"
          style={{
            background: isGlowing 
              ? 'linear-gradient(90deg, transparent 0%, rgba(59, 130, 246, 0.3) 50%, transparent 100%)'
              : 'none',
            animation: isGlowing ? 'scan 3s infinite linear' : 'none'
          }}
        />
        
        <div className="flex items-center justify-center h-full relative z-10">
          <div className="flex items-center space-x-2">
            <img 
              src="/src/assets/meta_logo.svg" 
              alt="Meta Logo" 
              className="w-5 h-5"
              style={{ filter: 'brightness(0) invert(1)' }}
            />
            <span className="text-white font-medium text-sm">
              {isGlowing ? "Start speaking" : "Ask AI Assistant"}
            </span>
            {isGlowing && (
              <div className="flex space-x-1">
                <div className="w-1 h-1 bg-white rounded-full animate-pulse"></div>
                <div className="w-1 h-1 bg-white rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-1 h-1 bg-white rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
              </div>
            )}
          </div>
        </div>
        
        <style>
          {`
          @keyframes twinkle {
            0%, 100% { opacity: 0.3; transform: scale(1); }
            50% { opacity: 1; transform: scale(1.2); }
          }
          
          @keyframes float {
            0% { transform: translateX(-10px); }
            100% { transform: translateX(10px); }
          }
          
          @keyframes scan {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
          }
          `}
        </style>
      </button>
    </>
  );
};

export default AIButton; 