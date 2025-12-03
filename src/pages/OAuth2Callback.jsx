import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';

export default function OAuth2Callback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();
  const [status, setStatus] = useState('processing'); // processing | success | error
  const [message, setMessage] = useState('Processing OAuth2 login...');

  useEffect(() => {
    handleOAuth2Callback();
  }, []);

  const handleOAuth2Callback = async () => {
    try {
      // ✅ Extraer token de la URL
      const token = searchParams.get('token');
      const success = searchParams.get('success');
      const error = searchParams.get('error');
      
      if (error) {
        setStatus('error');
        setMessage(`Authentication failed: ${error}`);
        setTimeout(() => navigate('/login'), 3000);
        return;
      }

      if (!token || success !== 'true') {
        setStatus('error');
        setMessage('No authentication token received');
        setTimeout(() => navigate('/login'), 3000);
        return;
      }

      // ✅ Guardar token en localStorage
      localStorage.setItem('token', token);
      
      // ✅ Decodificar para obtener userId
      const { jwtDecode } = await import('jwt-decode');
      const decoded = jwtDecode(token);
      
      console.log('✅ OAuth2 token received:', decoded);
      
      // ✅ Verificar que tenga userId
      if (!decoded.userId) {
        console.error('❌ userId missing in OAuth2 token!');
        setStatus('error');
        setMessage('Authentication error: Invalid token structure');
        setTimeout(() => navigate('/login'), 3000);
        return;
      }

      setStatus('success');
      setMessage('Login successful! Redirecting...');
      
      // Redirigir al dashboard
      setTimeout(() => {
        window.location.href = '/dashboard'; // Force refresh para cargar contexto
      }, 1500);
      
    } catch (err) {
      console.error('OAuth2 callback error:', err);
      setStatus('error');
      setMessage('An unexpected error occurred');
      setTimeout(() => navigate('/login'), 3000);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8 text-center">
        {status === 'processing' && (
          <>
            <Loader2 className="w-16 h-16 text-indigo-600 mx-auto mb-4 animate-spin" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Processing Login</h2>
            <p className="text-gray-600">{message}</p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle2 className="w-16 h-16 text-green-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Login Successful!</h2>
            <p className="text-gray-600">{message}</p>
          </>
        )}

        {status === 'error' && (
          <>
            <XCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Login Failed</h2>
            <p className="text-gray-600 mb-4">{message}</p>
            <button
              onClick={() => navigate('/login')}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
            >
              Back to Login
            </button>
          </>
        )}
      </div>
    </div>
  );
}