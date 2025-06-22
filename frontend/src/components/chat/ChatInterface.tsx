import { useState, useRef, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { ScrollArea } from '../ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { mockApiService } from '../../services/mockApi';
import { usePlayback } from '../../contexts/PlaybackContext';
import type { ChatMessage, Recommendation, TranscriptionSegment } from '../../types/api';
import { Send, Bot, User, Play, Clock } from 'lucide-react';

interface ChatInterfaceProps {
  onRecommendationSelect?: (recommendation: Recommendation) => void;
}

export function ChatInterface({ onRecommendationSelect }: ChatInterfaceProps) {
  const { playSegment } = usePlayback();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hi! I\'m here to help you discover amazing podcast content. Ask me about specific topics, or say something like "play the part about startup funding" to jump directly to relevant segments!',
      timestamp: new Date().toISOString(),
    },
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage,
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await mockApiService.sendChatMessage({
        message: inputMessage,
        conversationId: '1',
      });

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.response,
        timestamp: response.timestamp,
        metadata: {
          recommendations: response.recommendations,
          relatedSegments: response.relatedSegments,
        },
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Auto-trigger playback if the AI detected play intent
      if (response.playbackAction) {
        await playSegment(response.playbackAction.fileId, response.playbackAction.segment);
      }
    } catch (error) {
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Bot className="w-5 h-5" />
          AI Chat Assistant
        </CardTitle>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col p-0">
        <ScrollArea ref={scrollAreaRef} className="flex-1 px-6">
          <div className="space-y-4 pb-4">
            {messages.map((message) => (
              <div key={message.id} className="space-y-2">
                <div
                  className={`flex items-start gap-3 ${
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div className={`flex gap-3 max-w-[80%] ${message.role === 'user' ? 'flex-row-reverse' : ''}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      message.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'
                    }`}>
                      {message.role === 'user' ? (
                        <User className="w-4 h-4" />
                      ) : (
                        <Bot className="w-4 h-4" />
                      )}
                    </div>
                    
                    <div className={`rounded-lg p-3 ${
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}>
                      <p className="text-sm leading-relaxed">{message.content}</p>
                      <p className={`text-xs mt-1 ${
                        message.role === 'user'
                          ? 'text-primary-foreground/70'
                          : 'text-muted-foreground'
                      }`}>
                        {formatTime(message.timestamp)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Related Segments */}
                {message.metadata?.relatedSegments && message.metadata.relatedSegments.length > 0 && (
                  <div className="ml-11 space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">
                      Relevant segments:
                    </p>
                    {message.metadata.relatedSegments.map((segment, index) => (
                      <Card
                        key={segment.id}
                        className="cursor-pointer hover:bg-accent transition-colors"
                        onClick={() => playSegment('file-1', segment)}
                      >
                        <CardContent className="p-3">
                          <div className="flex items-start gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="p-1 h-6 w-6 shrink-0"
                              onClick={(e) => {
                                e.stopPropagation();
                                playSegment('file-1', segment);
                              }}
                            >
                              <Play className="w-3 h-3" />
                            </Button>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm leading-relaxed line-clamp-2">
                                "{segment.text}"
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                <Clock className="w-3 h-3 text-muted-foreground" />
                                <span className="text-xs text-muted-foreground">
                                  {Math.floor(segment.startTime / 60)}:
                                  {String(Math.floor(segment.startTime % 60)).padStart(2, '0')}
                                </span>
                                {segment.confidence && (
                                  <span className="text-xs text-muted-foreground">
                                    • {Math.round(segment.confidence * 100)}% confident
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}

                {/* Recommendations */}
                {message.metadata?.recommendations && message.metadata.recommendations.length > 0 && (
                  <div className="ml-11 space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">
                      Recommended for you:
                    </p>
                    {message.metadata.recommendations.map((rec, index) => (
                      <Card
                        key={index}
                        className="cursor-pointer hover:bg-accent transition-colors"
                        onClick={() => onRecommendationSelect?.(rec)}
                      >
                        <CardContent className="p-3">
                          <h4 className="font-medium text-sm mb-1">{rec.file.title}</h4>
                          <p className="text-xs text-muted-foreground mb-2">
                            {rec.file.description}
                          </p>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">
                              {Math.floor(rec.file.duration / 60)} minutes • {rec.file.genre}
                            </span>
                            <span className="text-xs font-medium text-primary">
                              {Math.round(rec.relevanceScore * 100)}% match
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            ))}
            
            {isLoading && (
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="bg-muted rounded-lg p-3">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="border-t p-4">
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <Input
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Ask about podcasts, topics, or anything..."
              disabled={isLoading}
              className="flex-1"
            />
            <Button type="submit" disabled={isLoading || !inputMessage.trim()}>
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </div>
      </CardContent>
    </Card>
  );
}