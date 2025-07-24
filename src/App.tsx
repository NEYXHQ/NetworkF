import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useWeb3Auth } from './hooks/useWeb3Auth';
import { Web3AuthProvider } from './contexts/Web3AuthProvider';
import { Header } from './components/layout/Header';
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';

const AppContent = () => {
  const { isLoading } = useWeb3Auth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Initializing Web3Auth...</p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/about" element={<div className="p-8">About Page</div>} />
            <Route path="/contact" element={<div className="p-8">Contact Page</div>} />
          </Routes>
        </main>
      </div>
    </Router>
  );
};

function App() {
  return (
    <Web3AuthProvider>
      <AppContent />
    </Web3AuthProvider>
  );
}

export default App;
