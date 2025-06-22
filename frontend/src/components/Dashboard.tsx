import React, { useState } from 'react';
import PodcastCard from './ui/PodcastCard';
import Navbar from './ui/Navbar';
import MediaPlayer from './ui/MediaPlayer';
import AIButton from './ui/AIButton';
import PodcastPage from './PodcastPage';

interface PodcastData {
  id: number;
  title?: string;
  author?: string;
  rating?: number;
  duration?: string;
  isEmpty?: boolean;
  imageUrl?: string;
}

const Dashboard: React.FC = () => {
  const [selectedPodcast, setSelectedPodcast] = useState<PodcastData | null>(null);

  const podcastCards: PodcastData[] = [
    {
      id: 1,
      title: "Future of AI",
      author: "Author Author",
      rating: 4.5,
      duration: "12 min"
    },
    {
      id: 2,
      title: "Tech Talk Daily",
      author: "Sarah Johnson",
      rating: 4.3,
      duration: "25 min"
    },
    {
      id: 3,
      title: "Startup Stories",
      author: "Mike Chen",
      rating: 4.7,
      duration: "18 min"
    },
    {
      id: 4,
      title: "Code & Coffee",
      author: "Alex Rivera",
      rating: 4.1,
      duration: "22 min"
    },
    {
      id: 5,
      title: "Digital Trends",
      author: "Emma Wilson",
      rating: 4.4,
      duration: "16 min"
    },
    {
      id: 6,
      title: "Innovation Hub",
      author: "David Park",
      rating: 4.6,
      duration: "30 min"
    },
    {
      id: 7,
      title: "Machine Learning Basics",
      author: "Tech Author",
      rating: 4.2,
      duration: "15 min"
    },
    {
      id: 8,
      title: "Deep Learning",
      author: "AI Expert",
      rating: 4.8,
      duration: "20 min"
    },
    {
      id: 9,
      title: "Neural Networks",
      author: "Data Scientist",
      rating: 4.6,
      duration: "18 min"
    },
    {
      id: 10,
      title: "Crypto Corner",
      author: "Lisa Martinez",
      rating: 4.0,
      duration: "28 min"
    },
    {
      id: 11,
      title: "Web Dev Weekly",
      author: "Tom Anderson",
      rating: 4.5,
      duration: "24 min"
    },
    {
      id: 12,
      title: "Product Hunt",
      author: "Ryan Foster",
      rating: 4.3,
      duration: "14 min"
    }
  ];

  const handleCardClick = (podcast: PodcastData) => {
    setSelectedPodcast(podcast);
  };

  const handleBackToDashboard = () => {
    setSelectedPodcast(null);
  };

  // If a podcast is selected, show the podcast page
  if (selectedPodcast) {
    return (
      <PodcastPage
        title={selectedPodcast.title}
        author={selectedPodcast.author}
        rating={selectedPodcast.rating}
        duration={selectedPodcast.duration}
        imageUrl={selectedPodcast.imageUrl}
        onBack={handleBackToDashboard}
      />
    );
  }

  return (
    <div className="bg-white min-h-screen">
      <Navbar />

      {/* Main Content */}
      <div className="p-4" style={{ paddingBottom: '200px' }}>
        <div className="max-w-6xl mx-auto" style={{ paddingTop: '100px' }}>
          {/* Desktop Grid */}
          <div className="hidden md:grid grid-cols-3 gap-4 justify-items-center">
            {podcastCards.map((card) => (
              <div key={card.id} onClick={() => handleCardClick(card)}>
                <PodcastCard
                  title={card.title}
                  author={card.author}
                  rating={card.rating}
                  duration={card.duration}
                  isEmpty={card.isEmpty}
                  className="cursor-pointer hover:scale-102 transition-transform duration-200"
                />
              </div>
            ))}
          </div>

          {/* Mobile Grid */}
          <div className="block md:hidden grid grid-cols-1 gap-4 px-4">
            {podcastCards.map((card) => (
              <div key={card.id} onClick={() => handleCardClick(card)}>
                <PodcastCard
                  title={card.title}
                  author={card.author}
                  rating={card.rating}
                  duration={card.duration}
                  isEmpty={card.isEmpty}
                  className="cursor-pointer hover:scale-102 transition-transform duration-200 w-full"
                />
              </div>
            ))}
          </div>
          
          {/* Footer Credits */}
          <div className="text-center mt-12 mb-8">
            <p className="text-gray-600 text-sm" style={{ opacity: 0.7 }}>
              Built by Superpod team - Nand, Vishals2nd, Saptak, Jyrgal at Llama 4 Hackaton Seattle
            </p>
          </div>
        </div>
      </div>

      <AIButton />
      <MediaPlayer />
    </div>
  );
};

export default Dashboard; 