import React, { useState, useRef, useEffect } from 'react';

// Audio file path
const audioFile = new URL('../../assets/audio/WTF is with Nikhil Kamath-episode-Nikhil Kamath ft. Police Comm\'r & Traffic Police Comm\'r of Bengaluru _ WTF is Policing_ _ Special Ep.mp3', import.meta.url).href;

interface MediaPlayerProps {
  podcastName?: string;
  className?: string;
}

const MediaPlayer: React.FC<MediaPlayerProps> = ({ 
  podcastName = "WTF is with Nikhil Kamath - Policing Special Episode",
  className = ""
}) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [progress, setProgress] = useState(0);

  // Format time in MM:SS format
  const formatTime = (time: number) => {
    if (isNaN(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Handle play/pause
  const handlePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  // Handle progress bar click
  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (audioRef.current) {
      const rect = e.currentTarget.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const width = rect.width;
      const newTime = (clickX / width) * duration;
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  // Audio event handlers
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
      setProgress((audio.currentTime / audio.duration) * 100);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setProgress(0);
      setCurrentTime(0);
    };

    const handleLoadStart = () => {
      console.log('Audio loading started');
    };

    const handleCanPlay = () => {
      console.log('Audio can start playing');
    };

    // Handle custom event from Play Episode button
    const handleStartPlayback = () => {
      if (audio && !isPlaying) {
        audio.play();
        setIsPlaying(true);
      }
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('loadstart', handleLoadStart);
    audio.addEventListener('canplay', handleCanPlay);
    window.addEventListener('startAudioPlayback', handleStartPlayback);

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('loadstart', handleLoadStart);
      audio.removeEventListener('canplay', handleCanPlay);
      window.removeEventListener('startAudioPlayback', handleStartPlayback);
    };
  }, [isPlaying]);

  return (
    <>
      {/* Hidden audio element */}
      <audio ref={audioRef} src={audioFile} preload="metadata" />

      {/* Desktop Media Player */}
      <div 
        className={`fixed bottom-0 left-1/2 transform -translate-x-1/2 border p-3 hidden md:block ${className}`}
        style={{ 
          borderColor: '#374151',
          borderTopLeftRadius: '12px',
          borderTopRightRadius: '12px',
          width: '1160px',
          backgroundColor: '#000000',
          zIndex: 1,
          height: '56px'
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <button 
              className="w-10 h-7 rounded-lg flex items-center justify-center bg-gray-700 text-white border-none shadow-sm hover:bg-gray-600 transition-all duration-200"
              onClick={handlePlayPause}
            >
              {isPlaying ? (
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                  <rect x="6" y="4" width="4" height="16" rx="1"/>
                  <rect x="14" y="4" width="4" height="16" rx="1"/>
                </svg>
              ) : (
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                  <polygon points="5,3 19,12 5,21"/>
                </svg>
              )}
            </button>
            <div className="font-medium text-xs" style={{ color: '#ffffff' }}>
              {formatTime(currentTime)}/{formatTime(duration)}
            </div>
          </div>
          
          <div className="flex-1 mx-4">
            <div className="text-center mb-1 text-sm font-medium" style={{ color: '#ffffff' }}>
              {podcastName}
            </div>
            <div 
              className="w-full rounded-full h-1 cursor-pointer" 
              style={{ backgroundColor: '#374151' }}
              onClick={handleProgressClick}
            >
              <div 
                className="h-1 rounded-full transition-all duration-300" 
                style={{ width: `${progress}%`, backgroundColor: '#ffffff' }}
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button className="p-1 hover:bg-gray-700 rounded transition-colors duration-200">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </button>
            <button className="p-1 hover:bg-gray-700 rounded transition-colors duration-200">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Media Player - Controls Only */}
      <div 
        className={`fixed bottom-0 left-4 right-4 border p-3 block md:hidden ${className}`}
        style={{ 
          borderColor: '#374151',
          borderTopLeftRadius: '12px',
          borderTopRightRadius: '12px',
          backgroundColor: '#000000',
          zIndex: 1,
          height: '56px'
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <button 
              className="w-10 h-8 rounded-lg flex items-center justify-center bg-gray-700 text-white border-none shadow-sm hover:bg-gray-600 transition-all duration-200"
              onClick={handlePlayPause}
            >
              {isPlaying ? (
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                  <rect x="6" y="4" width="4" height="16" rx="1"/>
                  <rect x="14" y="4" width="4" height="16" rx="1"/>
                </svg>
              ) : (
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                  <polygon points="5,3 19,12 5,21"/>
                </svg>
              )}
            </button>
            <div className="font-medium text-xs" style={{ color: '#ffffff' }}>
              {formatTime(currentTime)}/{formatTime(duration)}
            </div>
          </div>
          
          <div className="flex-1 mx-3">
            <div className="text-center text-xs font-medium" style={{ color: '#ffffff' }}>
              {podcastName && podcastName.length > 20 
                ? `${podcastName.substring(0, 20)}...` 
                : podcastName
              }
            </div>
          </div>

          <div className="flex items-center space-x-1">
            <button className="p-1.5 hover:bg-gray-700 rounded transition-colors duration-200">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </button>
            <button className="p-1.5 hover:bg-gray-700 rounded transition-colors duration-200">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default MediaPlayer; 