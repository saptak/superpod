import { useState } from 'react';
import { Button } from '../components/ui/button';
import { AudioChatInterface } from '../components/chat/AudioChatInterface';
import { PodcastGrid } from '../components/podcasts/PodcastGrid';
import { AudioPlayer } from '../components/player/AudioPlayer';
import { mockApiService } from '../services/mockApi';
import type { MediaFile, Recommendation } from '../types/api';
import { LogOut, User } from 'lucide-react';

interface DashboardProps {
  onLogout: () => void;
}

export function Dashboard({ onLogout }: DashboardProps) {
  const [selectedPodcast, setSelectedPodcast] = useState<MediaFile | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [shouldAutoPlay, setShouldAutoPlay] = useState(false);

  const handleLogout = async () => {
    await mockApiService.logout();
    onLogout();
  };

  const handlePodcastSelect = (podcast: MediaFile) => {
    setSelectedPodcast(podcast);
    setShouldAutoPlay(false);
  };

  const handlePodcastPlay = (podcast: MediaFile) => {
    setSelectedPodcast(podcast);
    setShouldAutoPlay(true);
    setIsPlaying(true);
  };

  const handleRecommendationSelect = (recommendation: Recommendation) => {
    setSelectedPodcast(recommendation.file);
    setShouldAutoPlay(true);
    setIsPlaying(true);
  };

  const handleStopPlayback = () => {
    setSelectedPodcast(null);
    setIsPlaying(false);
    setShouldAutoPlay(false);
  };

  const handlePlayStateChange = (playing: boolean) => {
    setIsPlaying(playing);
    if (playing) {
      setShouldAutoPlay(false); // Reset after successful auto-play
    }
  };

  const handleAudioChatStart = () => {
    // When audio chat starts, pause any playing podcast
    if (isPlaying) {
      setIsPlaying(false);
    }
  };

  const handleAudioChatStop = () => {
    // Audio chat stopped, can resume podcast playback if needed
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold">SuperPod</h1>
            <p className="text-sm text-muted-foreground">
              AI-powered podcast discovery
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm">
              <User className="w-4 h-4 mr-2" />
              Profile
            </Button>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Podcast Grid */}
          <PodcastGrid
            onPodcastSelect={handlePodcastSelect}
            onPodcastPlay={handlePodcastPlay}
            selectedPodcast={selectedPodcast}
            isPlaying={isPlaying}
          />

          {/* Chat Interface */}
          <AudioChatInterface
            onRecommendationSelect={handleRecommendationSelect}
            onAudioStart={handleAudioChatStart}
            onAudioStop={handleAudioChatStop}
          />
        </div>
      </div>

      {/* Audio Player Footer */}
      {selectedPodcast && (
        <footer className="border-t bg-card p-4">
          <AudioPlayer 
            podcast={selectedPodcast}
            onStop={handleStopPlayback}
            onPlayStateChange={handlePlayStateChange}
            shouldAutoPlay={shouldAutoPlay}
          />
        </footer>
      )}
    </div>
  );
}