import {
  createContext,
  useState,
  useEffect,
  useContext,
  ReactNode,
  Dispatch,
  SetStateAction
} from 'react';
import api from '../api';

interface AuthContextType {
  authTokens: {
    access: string;
  };
  setAuthTokens: Dispatch<SetStateAction<{
    access: string;
  } | null>>;
  userId: number;
  setUserId: Dispatch<SetStateAction<number | null>>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [authTokens, setAuthTokens] = useState(() => (
    localStorage.getItem('authTokens')
      ? JSON.parse(localStorage.getItem('authTokens')!)
      : null
  ));
  const [userId, setUserId] = useState(() => (
    localStorage.getItem('userId')
      ? JSON.parse(localStorage.getItem('userId')!)
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
    } catch (error: any) {
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

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default useAuth;