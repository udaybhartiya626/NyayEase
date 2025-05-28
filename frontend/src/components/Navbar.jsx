import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, user, logout, loading } = useAuth();
  
  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <nav className="bg-indigo-700 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0 flex items-center space-x-2">
              <img 
                src="/logo.svg" 
                alt="NyayEase Logo" 
                className="h-8 w-8 rounded-full object-cover bg-white"
              />
              <span className="text-white text-xl font-extralight">NyayEase</span>
            </Link>
          </div>
          
          {/* Desktop menu */}
          <div className="hidden md:flex items-center space-x-4">
            <Link 
              to="/" 
              className={`text-white px-3 py-2 rounded-md text-sm font-medium ${
                location.pathname === '/' ? 'bg-indigo-800' : 'hover:bg-indigo-600'
              }`}
            >
              Home
            </Link>
            
            <Link 
              to="/about" 
              className={`text-white px-3 py-2 rounded-md text-sm font-medium ${
                location.pathname === '/about' ? 'bg-indigo-800' : 'hover:bg-indigo-600'
              }`}
            >
              About
            </Link>
            
            {!isAuthenticated ? (
              <>
                <Link 
                  to="/login" 
                  className="text-white hover:bg-indigo-600 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Login
                </Link>
                <Link 
                  to="/register" 
                  className="bg-white text-indigo-700 hover:bg-gray-100 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Register
                </Link>
              </>
            ) : (
              <>
                <Link 
                  to="/dashboard" 
                  className={`text-white px-3 py-2 rounded-md text-sm font-medium ${
                    location.pathname.startsWith('/dashboard') ? 'bg-indigo-800' : 'hover:bg-indigo-600'
                  }`}
                >
                  Dashboard
                </Link>
                <button 
                  onClick={handleLogout}
                  className="text-white hover:bg-indigo-600 px-3 py-2 rounded-md text-sm font-medium"
                  disabled={loading}
                >
                  {loading ? 'Logging out...' : 'Logout'}
                </button>
                {user && (
                  <span className="text-white px-3 py-2 text-sm font-medium">
                    {user.firstName || user.email}
                  </span>
                )}
              </>
            )}
          </div>
          
          {/* Mobile menu button */}
          <div className="flex md:hidden items-center">
            <button
              onClick={toggleMenu}
              className="inline-flex items-center justify-center p-2 rounded-md text-white hover:bg-indigo-600 focus:outline-none"
            >
              <svg
                className="h-6 w-6"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                {isOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <Link 
              to="/" 
              className={`block text-white px-3 py-2 rounded-md text-base font-medium ${
                location.pathname === '/' ? 'bg-indigo-800' : 'hover:bg-indigo-600'
              }`}
            >
              Home
            </Link>
            
            <Link 
              to="/about" 
              className={`block text-white px-3 py-2 rounded-md text-base font-medium ${
                location.pathname === '/about' ? 'bg-indigo-800' : 'hover:bg-indigo-600'
              }`}
            >
              About
            </Link>
            
            {!isAuthenticated ? (
              <>
                <Link 
                  to="/login" 
                  className="block text-white hover:bg-indigo-600 px-3 py-2 rounded-md text-base font-medium"
                >
                  Login
                </Link>
                <Link 
                  to="/register" 
                  className="block bg-white text-indigo-700 hover:bg-gray-100 px-3 py-2 rounded-md text-base font-medium"
                >
                  Register
                </Link>
              </>
            ) : (
              <>
                <Link 
                  to="/dashboard" 
                  className={`block text-white px-3 py-2 rounded-md text-base font-medium ${
                    location.pathname.startsWith('/dashboard') ? 'bg-indigo-800' : 'hover:bg-indigo-600'
                  }`}
                >
                  Dashboard
                </Link>
                <button 
                  onClick={handleLogout}
                  className="block text-white hover:bg-indigo-600 px-3 py-2 rounded-md text-base font-medium w-full text-left"
                  disabled={loading}
                >
                  {loading ? 'Logging out...' : 'Logout'}
                </button>
                {user && (
                  <span className="block text-white px-3 py-2 text-base font-medium">
                    {user.firstName || user.email}
                  </span>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar; 