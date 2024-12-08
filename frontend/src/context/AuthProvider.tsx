import { createContext, useState, useEffect } from 'react';
import api from '../api';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [authTokens, setAuthTokens] = useState(() => (
    localStorage.getItem('authTokens')
      ? JSON.parse(localStorage.getItem('authTokens'))
      : null
  ));
  const [userId, setUserId] = useState(() => (
    localStorage.getItem('userId')
      ? JSON.parse(localStorage.getItem('userId'))
      : null
  ));
  const [loading, setLoading] = useState(true);

  function logout() {
    setAuthTokens(null);
    setUserId(null);
    localStorage.removeItem('authTokens');
    localStorage.removeItem('userId');
  }

  useEffect(() => {
    if (loading) {
      refreshToken();
    }

    const intervalId = setInterval(() => {
      if (authTokens) {
        refreshToken();
      }
    }, 1000 * 60 * 4);
    return () => clearInterval(intervalId);
  }, [authTokens, loading]);

  async function refreshToken() {
    try {
      const response = await api.post(
        'auth/jwt/refresh/',
        JSON.stringify({
          refresh: authTokens?.refresh
        }),
        {
          headers: {
            'Content-Type': 'application/json'
          },
          withCredentials: true
        }
      );
      
      setAuthTokens(response.data);
      localStorage.setItem('authTokens', JSON.stringify(authTokens));

      if (loading) {
        setLoading(false);
      }
    } catch (error) {
      if (!error.response) {
        console.error('No server response');
      } else {
        console.error('Token refresh failed');
        logout();
      }
    } finally {
      setLoading(false);
    }
  }
  
  return (
    <AuthContext.Provider
      value={{ authTokens, setAuthTokens, userId, setUserId, logout }}
    >
      {loading ? null : children}
    </AuthContext.Provider>
  )
}

export default AuthContext;