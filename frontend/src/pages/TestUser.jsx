import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const TestUser = () => {
  const navigate = useNavigate();
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("testuser@example.com");
  const [password, setPassword] = useState("password123");
  const [name, setName] = useState("Test User");

  const registerTestUser = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      // Simple user data with all required fields
      const userData = {
        name: name,
        email: email,
        password: password,
        phone: "1234567890",
        role: "litigant", // Always using litigant role
        address: {
          street: "123 Test Street",
          city: "Test City",
          state: "Test State",
          postalCode: "110001",
          country: "India"
        }
      };

      console.log('Sending direct test registration:', userData);
      
      // Making direct API call to backend without going through services
      const response = await axios.post('http://localhost:5000/api/auth/register', userData, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      setResult(response.data);
      
      // Store token and user if received
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }
    } catch (err) {
      console.error('Test registration error:', err.response?.data || err.message);
      setError(err.response?.data || { message: err.message });
    } finally {
      setLoading(false);
    }
  };
  
  const loginTestUser = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      // Login with only email, password and litigant role
      const loginData = {
        email: email,
        password: password,
        role: "litigant" // Always using litigant role
      };

      console.log('Sending direct test login:', { email, role: "litigant" });
      
      // Making direct API call to backend
      const response = await axios.post('http://localhost:5000/api/auth/login', loginData, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      setResult(response.data);
      
      // Store token and user
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }
    } catch (err) {
      console.error('Test login error:', err.response?.data || err.message);
      setError(err.response?.data || { message: err.message });
    } finally {
      setLoading(false);
    }
  };
  
  const goToDashboard = () => {
    navigate('/dashboard');
  };
  
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setResult({ message: "Logged out successfully" });
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Test User Operations</h1>
      
      <div className="mb-4 space-y-2">
        <div>
          <label className="block text-sm font-medium text-gray-700">Email</label>
          <input 
            type="email" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700">Password</label>
          <input 
            type="text" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700">Name (for registration)</label>
          <input 
            type="text" 
            value={name} 
            onChange={(e) => setName(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
          />
        </div>
      </div>
      
      <div className="flex space-x-4 mb-6">
        <button
          onClick={registerTestUser}
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:bg-blue-300"
        >
          {loading ? 'Processing...' : 'Register Test User'}
        </button>
        
        <button
          onClick={loginTestUser}
          disabled={loading}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:bg-green-300"
        >
          {loading ? 'Processing...' : 'Login Test User'}
        </button>
        
        <button
          onClick={goToDashboard}
          className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
        >
          Go to Dashboard
        </button>
        
        <button
          onClick={logout}
          className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
        >
          Logout
        </button>
      </div>
      
      {result && (
        <div className="mt-4 p-4 bg-green-100 rounded">
          <h2 className="font-bold">Success:</h2>
          <pre className="mt-2 whitespace-pre-wrap">{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
      
      {error && (
        <div className="mt-4 p-4 bg-red-100 rounded">
          <h2 className="font-bold">Error:</h2>
          <pre className="mt-2 whitespace-pre-wrap">{JSON.stringify(error, null, 2)}</pre>
        </div>
      )}
    </div>
  );
};

export default TestUser; 