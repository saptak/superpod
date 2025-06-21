import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Button } from './components/ui/button';

function HomePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8">
      <div className="max-w-md w-full space-y-8 text-center">
        <div>
          <h1 className="text-4xl font-bold text-foreground mb-4">
            SuperPod
          </h1>
          <p className="text-muted-foreground text-lg">
            AI-powered podcast discovery through YouTube
          </p>
        </div>
        
        <div className="space-y-4">
          <Button className="w-full" size="lg">
            Sign in with Google
          </Button>
          
          <p className="text-sm text-muted-foreground">
            Connect your YouTube account to get personalized podcast recommendations
          </p>
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/auth/callback" element={<div>Processing login...</div>} />
          <Route path="/dashboard" element={<div>Dashboard - Coming soon</div>} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;