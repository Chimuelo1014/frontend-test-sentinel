import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { jwtDecode } from 'jwt-decode';

export default function OAuth2Callback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('processing');
  const [message, setMessage] = useState('Processing OAuth2 login...');

  useEffect(() => {
    handleOAuth2Callback();
  }, []);

  const handleOAuth2Callback = async () => {
    try {
      console.log('🔄 OAuth2 Callback - URL:', window.location.href);
      console.log('🔄 Search params:', Object.fromEntries(searchParams.entries()));

      const token = searchParams.get('token');
      const success = searchParams.get('success');
      const error = searchParams.get('error');
      
      // ❌ Error en OAuth2
      if (error) {
        console.error('❌ OAuth2 error:', error);
        setStatus('error');
        setMessage(`Authentication failed: ${error}`);
        setTimeout(() => navigate('/login'), 3000);
        return;
      }

      // ❌ No hay token
      if (!token) {
        console.error('❌ No token received');
        console.log('Full URL:', window.location.href);
        setStatus('error');
        setMessage('No authentication token received from server');
        setTimeout(() => navigate('/login'), 3000);
        return;
      }

      console.log('✅ Token received:', token.substring(0, 20) + '...');

      // ✅ Decodificar token
      const decoded = jwtDecode(token);
      console.log('✅ Token decoded:', decoded);
      
      // ✅ Verificar userId
      if (!decoded.userId) {
        console.error('❌ userId missing in token!');
        console.log('Token claims:', decoded);
        setStatus('error');
        setMessage('Invalid token: userId missing');
        setTimeout(() => navigate('/login'), 3000);
        return;
      }

      // ✅ Guardar token y refreshToken si existe
      localStorage.setItem('token', token);
      
      const refreshToken = searchParams.get('refreshToken');
      if (refreshToken) {
        localStorage.setItem('refreshToken', refreshToken);
      }

      console.log('✅ Token saved to localStorage');

      setStatus('success');
      setMessage('Login successful! Redirecting to dashboard...');
      
      // ✅ Esperar 1 segundo y redirigir SIN recargar la página
      setTimeout(() => {
        navigate('/dashboard', { replace: true });
      }, 1000);
      
    } catch (err) {
      console.error('❌ OAuth2 callback error:', err);
      setStatus('error');
      setMessage(`Error: ${err.message}`);
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
            <p className="text-xs text-gray-400 mt-4">
              Check browser console for details
            </p>
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