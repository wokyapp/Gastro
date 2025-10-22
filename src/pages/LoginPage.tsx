import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { UtensilsIcon, AtSignIcon, KeyIcon, ArrowRightIcon } from 'lucide-react';
const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showRecovery, setShowRecovery] = useState(false);
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [recoveryLoading, setRecoveryLoading] = useState(false);
  const {
    login
  } = useAuth();
  const {
    showToast
  } = useToast();
  const navigate = useNavigate();
  const handleLogin = async e => {
    e.preventDefault();
    if (!username || !password) {
      showToast('error', 'Por favor ingrese usuario y contraseña');
      return;
    }
    setIsLoading(true);
    try {
      const result = await login(username, password);
      // Redirect based on user role
      const email = username.toLowerCase();
      if (email === 'admin@gastrobar.com') {
        navigate('/metricas');
      } else if (email === 'cajero@gastrobar.com') {
        navigate('/caja');
      } else if (email === 'mesero@gastrobar.com') {
        navigate('/ordenes');
      } else if (email === 'cocinero@gastrobar.com' || email === 'bartender@gastrobar.com') {
        navigate('/cocina');
      } else {
        // Default redirect based on role for any other email
        const userRole = result?.user?.role;
        if (userRole === 'admin') {
          navigate('/metricas');
        } else if (userRole === 'cashier' || userRole === 'cajero') {
          navigate('/caja');
        } else if (userRole === 'waiter' || userRole === 'mesero') {
          navigate('/ordenes');
        } else if (userRole === 'cook' || userRole === 'cocinero') {
          navigate('/cocina');
        } else {
          // Fallback to dashboard if role is unknown
          navigate('/dashboard');
        }
      }
    } catch (error) {
      showToast('error', 'Credenciales inválidas');
    } finally {
      setIsLoading(false);
    }
  };
  const handleRecovery = async e => {
    e.preventDefault();
    if (!recoveryEmail) {
      showToast('error', 'Por favor ingrese su correo electrónico');
      return;
    }
    setRecoveryLoading(true);
    try {
      // Simulación de envío de correo de recuperación
      await new Promise(resolve => setTimeout(resolve, 1500));
      showToast('success', 'Se ha enviado un enlace de recuperación a su correo');
      setShowRecovery(false);
    } catch (error) {
      showToast('error', 'No se pudo enviar el correo de recuperación');
    } finally {
      setRecoveryLoading(false);
    }
  };
  return <div className="min-h-screen bg-gray-50 flex flex-col justify-center">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <div className="mx-auto h-14 w-14 flex items-center justify-center rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 shadow-lg">
            <UtensilsIcon className="h-8 w-8 text-white" />
          </div>
          <h2 className="mt-3 text-2xl font-bold text-gray-900">
            Woky | Gastro
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Sistema de gestión de gastronomía
          </p>
        </div>
        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-xl sm:px-10">
            {!showRecovery ? <>
                <form className="space-y-5" onSubmit={handleLogin}>
                  <div>
                    <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                      Usuario
                    </label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <AtSignIcon className="h-4 w-4 text-gray-400" />
                      </div>
                      <input type="text" id="username" className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm" placeholder="Nombre de usuario" value={username} onChange={e => setUsername(e.target.value)} />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                      Contraseña
                    </label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <KeyIcon className="h-4 w-4 text-gray-400" />
                      </div>
                      <input type="password" id="password" className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm" placeholder="Contraseña" value={password} onChange={e => setPassword(e.target.value)} />
                    </div>
                  </div>
                  <div>
                    <button type="submit" disabled={isLoading} className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-70">
                      {isLoading ? <span className="flex items-center">
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Iniciando sesión...
                        </span> : <span className="flex items-center">
                          Iniciar sesión{' '}
                          <ArrowRightIcon className="ml-1.5 h-4 w-4" />
                        </span>}
                    </button>
                  </div>
                </form>
                <div className="mt-6">
                  <button type="button" className="w-full text-center text-xs text-blue-600 hover:text-blue-800" onClick={() => setShowRecovery(true)}>
                    ¿Olvidó su contraseña o nombre de usuario?
                  </button>
                </div>
              </> : <>
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Recuperar acceso
                </h3>
                <form className="space-y-5" onSubmit={handleRecovery}>
                  <div>
                    <label htmlFor="recovery-email" className="block text-sm font-medium text-gray-700">
                      Correo electrónico
                    </label>
                    <div className="mt-1">
                      <input type="email" id="recovery-email" className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm" placeholder="correo@ejemplo.com" value={recoveryEmail} onChange={e => setRecoveryEmail(e.target.value)} />
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                      Ingrese el correo asociado a su cuenta para recibir
                      instrucciones de recuperación
                    </p>
                  </div>
                  <div className="flex items-center justify-between space-x-3">
                    <button type="button" className="flex-1 py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500" onClick={() => setShowRecovery(false)} disabled={recoveryLoading}>
                      Cancelar
                    </button>
                    <button type="submit" disabled={recoveryLoading} className="flex-1 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-70">
                      {recoveryLoading ? 'Enviando...' : 'Enviar enlace'}
                    </button>
                  </div>
                </form>
              </>}
          </div>
        </div>
      </div>
    </div>;
};
export default LoginPage;