class OpenAIService {
  private apiKey: string;
  private baseURL: string = 'https://api.openai.com/v1';

  constructor() {
    this.apiKey = import.meta.env.VITE_OPENAI_API_KEY || '';
    console.log('OpenAI API Key available:', this.apiKey ? 'Yes' : 'No');
    if (!this.apiKey) {
      console.error('OpenAI API key not found. Please set VITE_OPENAI_API_KEY in your .env file');
    }
  }

  // Convert speech to text using Whisper
  async speechToText(audioBlob: Blob): Promise<string> {
    try {
      const formData = new FormData();
      formData.append('file', audioBlob, 'audio.webm');
      formData.append('model', 'whisper-1');

      const response = await fetch(`${this.baseURL}/audio/transcriptions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.text;
    } catch (error) {
      console.error('Speech to text error:', error);
      throw error;
    }
  }

  // Generate AI response using backend
  async generateResponse(userMessage: string): Promise<string> {
    try {
      console.log('Sending message to backend:', userMessage);
      
      const requestBody = {
        message: userMessage
      };
      console.log('Request body:', JSON.stringify(requestBody));
      const response = await fetch('/api/chat/message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error Response:', errorText);
        throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
      }

      const data = await response.json();
      console.log('Backend response data:', data);
      console.log('Data type:', typeof data);
      console.log('Data keys:', Object.keys(data));
      
      // The backend uses jsonify(response) so the response should directly contain the data
      const result = data.message || data.response || data || 'Sorry, I could not generate a response.';
      console.log('Final result:', result);
      
      return result;
    } catch (error) {
      console.error('Generate response error:', error);
      console.error('Error details:', error instanceof Error ? error.message : String(error));
      throw error;
    }
  }

  // Convert text to speech using OpenAI TTS
  async textToSpeech(text: string): Promise<Blob> {
    try {
      const response = await fetch(`${this.baseURL}/audio/speech`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: 'tts-1',
          input: text,
          voice: 'alloy',
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.blob();
    } catch (error) {
      console.error('Text to speech error:', error);
      throw error;
    }
  }

  // Play audio from blob
  playAudio(audioBlob: Blob): HTMLAudioElement {
    const audioUrl = URL.createObjectURL(audioBlob);
    const audio = new Audio(audioUrl);
    
    // Clean up URL when audio ends
    const originalOnEnded = audio.onended;
    audio.onended = (event) => {
      URL.revokeObjectURL(audioUrl);
      if (originalOnEnded) {
        originalOnEnded.call(audio, event);
      }
    };
    
    audio.play().catch(error => {
      console.error('Audio playback error:', error);
    });
    
    return audio;
  }
}

export const openAIService = new OpenAIService(); 