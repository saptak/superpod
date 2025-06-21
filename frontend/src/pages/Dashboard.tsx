import { useState } from 'react';
import { Button } from '../components/ui/button';
import { ChatInterface } from '../components/chat/ChatInterface';
import { PodcastList } from '../components/podcasts/PodcastList';
import { AudioPlayer } from '../components/player/AudioPlayer';
import { mockApiService } from '../services/mockApi';
import type { MediaFile, Recommendation } from '../types/api';
import { LogOut, MessageCircle, Library, User } from 'lucide-react';

interface DashboardProps {
  onLogout: () => void;
}

export function Dashboard({ onLogout }: DashboardProps) {
  const [selectedPodcast, setSelectedPodcast] = useState<MediaFile | null>(null);
  const [activeView, setActiveView] = useState<'podcasts' | 'chat'>('podcasts');
  const [showChat, setShowChat] = useState(false);

  const handleLogout = async () => {
    await mockApiService.logout();
    onLogout();
  };

  const handlePodcastSelect = (podcast: MediaFile) => {
    setSelectedPodcast(podcast);
  };

  const handleRecommendationSelect = (recommendation: Recommendation) => {
    setSelectedPodcast(recommendation.file);
    setActiveView('podcasts');
  };

  const toggleChat = () => {
    setShowChat(!showChat);
    if (!showChat) {
      setActiveView('chat');
    }
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold">SuperPod</h1>
            
            <nav className="flex gap-2">
              <Button
                variant={activeView === 'podcasts' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveView('podcasts')}
              >
                <Library className="w-4 h-4 mr-2" />
                Library
              </Button>
              <Button
                variant={activeView === 'chat' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveView('chat')}
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                Chat
              </Button>
            </nav>
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
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar/Main Content */}
        <div className={`flex-1 ${showChat ? 'flex' : ''}`}>
          {/* Primary Content */}
          <div className={`${showChat ? 'flex-1 border-r' : 'w-full'} p-4`}>
            {activeView === 'podcasts' ? (
              <PodcastList
                onPodcastSelect={handlePodcastSelect}
                selectedPodcast={selectedPodcast}
              />
            ) : (
              <ChatInterface
                onRecommendationSelect={handleRecommendationSelect}
              />
            )}
          </div>

          {/* Chat Sidebar */}
          {showChat && (
            <div className="w-96 p-4">
              <ChatInterface
                onRecommendationSelect={handleRecommendationSelect}
              />
            </div>
          )}
        </div>
      </div>

      {/* Audio Player Footer */}
      <footer className="border-t bg-card p-4">
        <AudioPlayer 
          podcast={selectedPodcast} 
          onToggleChat={toggleChat}
        />
      </footer>
    </div>
  );
}