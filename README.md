# SuperPod - AI-Powered Podcast Discovery Platform

SuperPod is an AI-driven podcast discovery and consumption platform that integrates with YouTube to provide personalized podcast recommendations through natural language chat interactions.

## Features

- **YouTube Integration**: Authenticate with Google to access YouTube data
- **AI-Powered Chat**: Conversational podcast discovery using Llama 4.0
- **Personalized Recommendations**: Based on YouTube watch history and subscriptions
- **Caption Navigation**: Search and navigate within podcast videos using captions
- **Video Playback**: Integrated YouTube Player API for seamless streaming

## Tech Stack

### Frontend
- React 18 + TypeScript
- Vite for build tooling
- shadcn/ui + Tailwind CSS for UI components
- React Router for navigation

### Backend
- Node.js + Express + TypeScript
- YouTube Data API v3 integration
- Google OAuth 2.0 authentication
- Llama 4.0 API for AI chat responses

## Quick Start

### Prerequisites
- Node.js 18+ and npm
- Google Cloud Console project with YouTube Data API enabled
- Llama 4.0 API access

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd superpod
   ```

2. **Set up Backend**
   ```bash
   cd backend
   npm install
   cp .env.example .env
   # Edit .env with your API keys and configuration
   npm run dev
   ```

3. **Set up Frontend**
   ```bash
   cd frontend
   npm install
   cp .env.example .env
   # Edit .env with your configuration
   npm run dev
   ```

### Environment Configuration

#### Backend (.env)
```env
PORT=3001
NODE_ENV=development
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
JWT_SECRET=your_jwt_secret_here
LLAMA_API_URL=https://api.llama.ai/v1
LLAMA_API_KEY=your_llama_api_key_here
FRONTEND_URL=http://localhost:5173
```

#### Frontend (.env)
```env
VITE_API_BASE_URL=http://localhost:3001/api
```

### Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable YouTube Data API v3
4. Create OAuth 2.0 credentials
5. Add authorized redirect URIs:
   - `http://localhost:5173/auth/callback` (development)
   - Your production domain (production)

## Development

### Available Scripts

#### Frontend
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript compiler

#### Backend
- `npm run dev` - Start development server with hot reload
- `npm run build` - Build TypeScript to JavaScript
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript compiler

### Project Structure

```
superpod/
├── frontend/
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── hooks/         # Custom React hooks
│   │   ├── services/      # API service layer
│   │   ├── types/         # TypeScript interfaces
│   │   ├── utils/         # Helper functions
│   │   └── api/           # API client
│   └── ...
├── backend/
│   ├── src/
│   │   ├── controllers/   # Route controllers
│   │   ├── services/      # Business logic
│   │   ├── middleware/    # Express middleware
│   │   ├── routes/        # API routes
│   │   ├── types/         # TypeScript interfaces
│   │   └── utils/         # Helper functions
│   └── ...
├── docs/                  # Documentation
├── API_SPECIFICATION.md   # API documentation
├── IMPLEMENTATION_PLAN.md # Development roadmap
└── README.md
```

## API Documentation

See [API_SPECIFICATION.md](./API_SPECIFICATION.md) for detailed API documentation.

## Implementation Roadmap

See [IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md) for the development phases and roadmap.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details