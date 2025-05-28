import { createContext, useState, useEffect, useContext } from 'react';
import authService from '../services/authService';

// Create auth context
const AuthContext = createContext(null);

// Auth provider component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load user from localStorage on initial render
  useEffect(() => {
    const initAuth = async () => {
      try {
        if (authService.isLoggedIn()) {
          // Load user from localStorage first (for immediate UI update)
          const localUser = authService.getUser();
          if (localUser) {
            console.log('Loading user from localStorage:', localUser);
            setUser(localUser);
            setIsAuthenticated(true);
          }
          
          // Then, verify with the server if possible
          try {
            const userData = await authService.getCurrentUser();
            console.log('Loading user from server:', userData.data);
            setUser(userData.data);
            setIsAuthenticated(true);
          } catch (err) {
            // If server validation fails, log the user out
            console.error('Failed to validate token with server:', err);
            authService.logout();
            setUser(null);
            setIsAuthenticated(false);
          }
        }
      } catch (err) {
        console.error('Auth initialization error:', err);
        setError(err.message || 'Authentication error');
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);
  
  // Register function
  const register = async (userData) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await authService.register(userData);
      console.log('Registration response:', response);
      setUser(response.user);
      setIsAuthenticated(true);
      return response;
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };
  
  // Login function
  const login = async (credentials) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await authService.login(credentials);
      console.log('Login response:', response);
      setUser(response.user);
      setIsAuthenticated(true);
      return response;
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };
  
  // Logout function
  const logout = async () => {
    setLoading(true);
    
    try {
      await authService.logout();
      setUser(null);
      setIsAuthenticated(false);
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setLoading(false);
    }
  };
  
  // Expose auth context values
  const value = {
    user,
    isAuthenticated,
    loading,
    error,
    register,
    login,
    logout
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};

export default AuthContext; 