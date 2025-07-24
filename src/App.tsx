import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Header } from './components/layout/Header';
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';

function App() {
  // Mock user state - in real app this would come from AuthContext
  const user = null;

  const handleLogin = () => {
    console.log('Navigate to login');
  };

  const handleLogout = () => {
    console.log('Logout user');
  };

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Header user={user} onLogin={handleLogin} onLogout={handleLogout} />
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
}

export default App;
