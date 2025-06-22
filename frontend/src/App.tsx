import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthPage } from './pages/AuthPage';
import { Dashboard } from './pages/Dashboard';
import { PlaybackProvider } from './contexts/PlaybackContext';
import { mockApiService } from './services/mockApi';
import { Button } from './components/ui/button';
import DashboardComponent from './components/Dashboard';

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
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is already authenticated
    const checkAuth = async () => {
      try {
        if (mockApiService.isAuthenticated()) {
          await mockApiService.getCurrentUser();
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.log('Not authenticated');
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const handleAuthenticated = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <PlaybackProvider>
      <Router>
        <div className="App">
          <Routes>
            <Route 
              path="/" 
              element={
                isAuthenticated ? (
                  <Navigate to="/dashboard" replace />
                ) : (
                  <AuthPage onAuthenticated={handleAuthenticated} />
                )
              } 
            />
            <Route 
              path="/dashboard" 
              element={
                isAuthenticated ? (
                  <Dashboard onLogout={handleLogout} />
                ) : (
                  <Navigate to="/" replace />
                )
              } 
            />
            <Route 
              path="/auth/callback" 
              element={<div>Processing login...</div>} 
            />
            <Route 
              path="*" 
              element={<Navigate to="/" replace />} 
            />
          </Routes>
        </div>
      </Router>
    </PlaybackProvider>
  );
}

export default App;