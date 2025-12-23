/**
 * App Component - Cyberpunk Retro Gaming Hub
 */

import { Suspense, lazy, useEffect, Component, type ReactNode } from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { useGameStore } from './stores';
import { ImmersiveHome } from './components/home';
// Direct import for PlayPage to avoid lazy loading issues
import { PlayPage } from './pages/PlayPage';

// Error Boundary to catch rendering errors
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<{ children: ReactNode }, ErrorBoundaryState> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '40px',
          backgroundColor: '#0a0a0f',
          color: '#ff0055',
          minHeight: '100vh',
          fontFamily: 'sans-serif'
        }}>
          <h1>Something went wrong</h1>
          <pre style={{
            backgroundColor: '#1a1a2e',
            padding: '20px',
            borderRadius: '8px',
            overflow: 'auto',
            color: '#ffffff'
          }}>
            {this.state.error?.message}
            {'\n\n'}
            {this.state.error?.stack}
          </pre>
          <button
            onClick={() => window.location.reload()}
            style={{
              marginTop: '20px',
              padding: '10px 20px',
              backgroundColor: '#00ffff',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// Simple loading fallback
function PageLoader() {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      backgroundColor: '#0a0a0f',
      color: '#00ffff',
      fontSize: '24px',
      fontFamily: 'sans-serif'
    }}>
      Loading...
    </div>
  );
}

// Minimal layout for non-home pages
function MinimalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#0a0a0f',
      color: '#ffffff',
      fontFamily: 'Rajdhani, sans-serif'
    }}>
      <header style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        padding: '15px 30px',
        backgroundColor: 'rgba(26, 26, 46, 0.95)',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid rgba(0, 255, 255, 0.2)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <Link to="/" style={{
          color: '#00ffff',
          fontFamily: 'Orbitron, sans-serif',
          fontSize: '1.25rem',
          fontWeight: 700,
          textDecoration: 'none',
          textShadow: '0 0 10px rgba(0, 255, 255, 0.5)'
        }}>
          KOMPLEXÁCI <span style={{ color: '#ffffff' }}>RETRO</span>
        </Link>
        <nav style={{ display: 'flex', gap: '25px' }}>
          <Link to="/" style={{ color: '#a0a0a0', textDecoration: 'none', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Home</Link>
          <Link to="/browse" style={{ color: '#a0a0a0', textDecoration: 'none', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Browse</Link>
          <Link to="/favorites" style={{ color: '#a0a0a0', textDecoration: 'none', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Favorites</Link>
        </nav>
      </header>
      <main style={{ paddingTop: '80px', minHeight: '100vh' }}>
        {children}
      </main>
    </div>
  );
}

// Full-screen layout for home page (no header)
function FullScreenLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#0a0a0f',
      color: '#ffffff',
      fontFamily: 'Rajdhani, sans-serif'
    }}>
      {children}
    </div>
  );
}

// Lazy load pages (except PlayPage which is directly imported)
const BrowsePage = lazy(() => import('./pages/BrowsePage'));
const FavoritesPage = lazy(() => import('./pages/FavoritesPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));

function App() {
  const fetchGames = useGameStore((state) => state.fetchGames);

  // Fetch games on app initialization
  useEffect(() => {
    fetchGames().catch(console.error);
  }, [fetchGames]);

  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          {/* Home page - full screen immersive experience */}
          <Route
            path="/"
            element={
              <FullScreenLayout>
                <ImmersiveHome />
              </FullScreenLayout>
            }
          />

          {/* PlayPage - full screen for gaming */}
          <Route
            path="/play/:gameId"
            element={
              <FullScreenLayout>
                <PlayPage />
              </FullScreenLayout>
            }
          />

          {/* Other pages with minimal layout (header + nav) */}
          <Route
            path="/browse"
            element={
              <MinimalLayout>
                <Suspense fallback={<PageLoader />}>
                  <BrowsePage />
                </Suspense>
              </MinimalLayout>
            }
          />
          <Route
            path="/favorites"
            element={
              <MinimalLayout>
                <Suspense fallback={<PageLoader />}>
                  <FavoritesPage />
                </Suspense>
              </MinimalLayout>
            }
          />
          <Route
            path="/settings"
            element={
              <MinimalLayout>
                <Suspense fallback={<PageLoader />}>
                  <SettingsPage />
                </Suspense>
              </MinimalLayout>
            }
          />
          <Route
            path="*"
            element={
              <MinimalLayout>
                <Suspense fallback={<PageLoader />}>
                  <NotFoundPage />
                </Suspense>
              </MinimalLayout>
            }
          />
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
