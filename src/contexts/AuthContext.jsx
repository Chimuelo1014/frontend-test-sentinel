import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';
import { jwtDecode } from "jwt-decode";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decoded = jwtDecode(token);
        
        // ✅ Extraer userId del token JWT
        const userData = {
          email: decoded.sub || decoded.email,
          userId: decoded.userId, // ← Debe venir del backend
          globalRole: decoded.globalRole,
          tenantId: decoded.tenantId,
        };
        
        console.log('🔑 Token decoded:', userData);
        
        // ✅ Verificar que userId existe
        if (!userData.userId) {
          console.error('❌ userId not found in token!');
          console.log('Token claims:', decoded);
          localStorage.removeItem('token');
          setUser(null);
        } else {
          setUser(userData);
        }
      } catch (error) {
        console.error('❌ Invalid token', error);
        localStorage.removeItem('token');
        setUser(null);
      }
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      const response = await authAPI.login({ email, password });
      const { token, refreshToken } = response.data;
      
      // ✅ Guardar tokens
      localStorage.setItem('token', token);
      localStorage.setItem('refreshToken', refreshToken);
      
      // ✅ Decodificar token
      const decoded = jwtDecode(token);
      
      console.log('✅ Login successful, token claims:', decoded);
      
      const userData = {
        email: decoded.sub || decoded.email,
        userId: decoded.userId,
        globalRole: decoded.globalRole,
        tenantId: decoded.tenantId,
      };
      
      // ✅ Verificar userId
      if (!userData.userId) {
        console.error('❌ userId missing in login response!');
        console.log('Token claims:', decoded);
        return { 
          success: false, 
          error: 'Authentication error: userId not found in token' 
        };
      }
      
      setUser(userData);
      
      return { success: true };
    } catch (error) {
      console.error('❌ Login error:', error);
      return { 
        success: false, 
        error: error.response?.data?.message || 'Login failed' 
      };
    }
  };

  const register = async (email, password, role = 'USER') => {
    try {
      const response = await authAPI.register({ email, password, role });
      const { token, refreshToken } = response.data;
      
      // ✅ Guardar tokens
      localStorage.setItem('token', token);
      localStorage.setItem('refreshToken', refreshToken);
      
      // ✅ Decodificar token
      const decoded = jwtDecode(token);
      
      console.log('✅ Registration successful, token claims:', decoded);
      
      const userData = {
        email: decoded.sub || decoded.email,
        userId: decoded.userId,
        globalRole: decoded.globalRole,
        tenantId: decoded.tenantId,
      };
      
      // ✅ Verificar userId
      if (!userData.userId) {
        console.error('❌ userId missing in registration response!');
        console.log('Token claims:', decoded);
        return { 
          success: false, 
          error: 'Registration error: userId not found in token' 
        };
      }
      
      setUser(userData);
      
      return { success: true };
    } catch (error) {
      console.error('❌ Register error:', error);
      return { 
        success: false, 
        error: error.response?.data?.message || 'Registration failed' 
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};