import { useState, useRef, useEffect } from 'react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { ScrollArea } from '../ui/scroll-area';
import type { MediaFile, TranscriptionSegment } from '../../types/api';
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Volume2, 
  VolumeX,
  Maximize2,
  MessageCircle,
  Square
} from 'lucide-react';

interface AudioPlayerProps {
  podcast: MediaFile | null;
  onToggleChat?: () => void;
  onStop?: () => void;
  onPlayStateChange?: (isPlaying: boolean) => void;
  shouldAutoPlay?: boolean;
}

export function AudioPlayer({ podcast, onToggleChat, onStop, onPlayStateChange, shouldAutoPlay }: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [currentSegment, setCurrentSegment] = useState<TranscriptionSegment | null>(null);
  
  const audioRef = useRef<HTMLAudioElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);

  // Mock transcription segments for demo
  const mockSegments: TranscriptionSegment[] = podcast ? [
    {
      id: '1',
      startTime: 0,
      endTime: 30,
      text: 'Welcome to today\'s episode where we dive deep into the world of entrepreneurship.',
      confidence: 0.95,
    },
    {
      id: '2', 
      startTime: 30,
      endTime: 75,
      text: 'Starting a business is one of the most challenging yet rewarding endeavors you can undertake.',
      confidence: 0.92,
    },
    {
      id: '3',
      startTime: 75,
      endTime: 120,
      text: 'Today we\'ll explore the key strategies that successful entrepreneurs use to scale their businesses.',
      confidence: 0.89,
    },
  ] : [];

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => {
      setCurrentTime(audio.currentTime);
      
      // Find current segment
      const segment = mockSegments.find(
        s => audio.currentTime >= s.startTime && audio.currentTime <= s.endTime
      );
      setCurrentSegment(segment || null);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
      onPlayStateChange?.(false);
    };

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [mockSegments, onPlayStateChange]);

  // Auto-start playing when a new podcast is selected and shouldAutoPlay is true
  useEffect(() => {
    if (podcast && shouldAutoPlay && !isPlaying) {
      const audio = audioRef.current;
      if (audio) {
        audio.currentTime = 0;
        audio.play().then(() => {
          setIsPlaying(true);
          onPlayStateChange?.(true);
        }).catch(console.error);
      }
    }
  }, [podcast, shouldAutoPlay, isPlaying, onPlayStateChange]);

  const togglePlay = async () => {
    const audio = audioRef.current;
    if (!audio) return;

    try {
      if (isPlaying) {
        audio.pause();
        setIsPlaying(false);
        onPlayStateChange?.(false);
      } else {
        await audio.play();
        setIsPlaying(true);
        onPlayStateChange?.(true);
      }
    } catch (error) {
      console.error('Playback error:', error);
    }
  };

  const stopPlayback = () => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.pause();
    audio.currentTime = 0;
    setIsPlaying(false);
    setCurrentTime(0);
    onPlayStateChange?.(false);
    onStop?.();
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    const progressBar = progressRef.current;
    if (!audio || !progressBar || !podcast) return;

    const rect = progressBar.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const newTime = (clickX / rect.width) * podcast.duration;
    
    audio.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const skip = (seconds: number) => {
    const audio = audioRef.current;
    if (!audio || !podcast) return;

    const newTime = Math.max(0, Math.min(podcast.duration, audio.currentTime + seconds));
    audio.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
    setIsMuted(newVolume === 0);
  };

  const toggleMute = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isMuted) {
      audio.volume = volume;
      setIsMuted(false);
    } else {
      audio.volume = 0;
      setIsMuted(true);
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const jumpToSegment = (segment: TranscriptionSegment) => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.currentTime = segment.startTime;
    setCurrentTime(segment.startTime);
  };

  if (!podcast) {
    return (
      <Card className="h-32">
        <CardContent className="h-full flex items-center justify-center">
          <p className="text-muted-foreground">Select a podcast to start listening</p>
        </CardContent>
      </Card>
    );
  }

  const progressPercentage = podcast.duration > 0 ? (currentTime / podcast.duration) * 100 : 0;

  return (
    <div className="space-y-4">
      <audio ref={audioRef} preload="metadata">
        <source src={`https://example.com/audio/${podcast.id}.mp3`} type="audio/mpeg" />
        Your browser does not support the audio element.
      </audio>

      <Card className={isExpanded ? 'h-96' : 'h-auto'}>
        <CardContent className="p-4">
          <div className="space-y-4">
            {/* Podcast Info */}
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-sm mb-1 line-clamp-2">
                  {podcast.title}
                </h3>
                <p className="text-xs text-muted-foreground line-clamp-1">
                  {podcast.description}
                </p>
              </div>
              <div className="flex gap-2 ml-3">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onToggleChat}
                >
                  <MessageCircle className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsExpanded(!isExpanded)}
                >
                  <Maximize2 className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="space-y-2">
              <div
                ref={progressRef}
                className="h-2 bg-secondary rounded-full cursor-pointer relative overflow-hidden"
                onClick={handleSeek}
              >
                <div
                  className="h-full bg-primary rounded-full transition-all duration-150"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(podcast.duration)}</span>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => skip(-15)}
                >
                  <SkipBack className="w-4 h-4" />
                </Button>
                
                <Button
                  size="sm"
                  onClick={togglePlay}
                >
                  {isPlaying ? (
                    <Pause className="w-4 h-4" />
                  ) : (
                    <Play className="w-4 h-4" />
                  )}
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={stopPlayback}
                >
                  <Square className="w-4 h-4" />
                </Button>
                
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => skip(15)}
                >
                  <SkipForward className="w-4 h-4" />
                </Button>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={toggleMute}
                >
                  {isMuted ? (
                    <VolumeX className="w-4 h-4" />
                  ) : (
                    <Volume2 className="w-4 h-4" />
                  )}
                </Button>
                
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                  className="w-20 h-2 bg-secondary rounded-lg appearance-none cursor-pointer slider"
                />
              </div>
            </div>

            {/* Current Segment */}
            {currentSegment && (
              <Card className="bg-accent">
                <CardContent className="p-3">
                  <p className="text-sm">{currentSegment.text}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatTime(currentSegment.startTime)} - {formatTime(currentSegment.endTime)}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Expanded Transcript */}
            {isExpanded && (
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Transcript</h4>
                <ScrollArea className="h-48 border rounded-md">
                  <div className="p-3 space-y-2">
                    {mockSegments.map((segment) => (
                      <div
                        key={segment.id}
                        className={`p-2 rounded cursor-pointer transition-colors ${
                          currentSegment?.id === segment.id
                            ? 'bg-primary text-primary-foreground'
                            : 'hover:bg-accent'
                        }`}
                        onClick={() => jumpToSegment(segment)}
                      >
                        <p className="text-sm">{segment.text}</p>
                        <p className={`text-xs mt-1 ${
                          currentSegment?.id === segment.id
                            ? 'text-primary-foreground/70'
                            : 'text-muted-foreground'
                        }`}>
                          {formatTime(segment.startTime)} - {formatTime(segment.endTime)}
                        </p>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}