// src/pages/LoginSimple.tsx - Versión simplificada para debugging
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '@/services/auth';

const LoginSimple = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validación simple: solo admin/admin1234
    if (username === 'admin' && password === 'admin1234') {
      const mockUser = {
        id: 1,
        nombreCompleto: 'Administrador',
        nombreUsuario: 'admin',
        correo: 'admin@clinica.com',
        estado: 'ACTIVO',
        nombreGrupo: 'Administrador',
        clienteId: 1
      };
      
      // Guardar datos en localStorage
      localStorage.setItem('auth_token', 'admin_token_' + Date.now());
      localStorage.setItem('auth_user', JSON.stringify(mockUser));
      
      console.log('Login exitoso para admin');
      navigate('/');
    } else {
      setError('Usuario o contraseña incorrectos. ');
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      backgroundColor: '#f5f5f5',
      fontFamily: 'Arial, sans-serif'
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '2rem',
        borderRadius: '8px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        width: '100%',
        maxWidth: '400px'
      }}>
        <h1 style={{ textAlign: 'center', marginBottom: '2rem', color: '#333' }}>
          🔐 Login - Clínica Dental
        </h1>
        
        {error && (
          <div style={{
            backgroundColor: '#fee',
            color: '#c33',
            padding: '0.5rem',
            borderRadius: '4px',
            marginBottom: '1rem',
            fontSize: '0.9rem'
          }}>
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
              Usuario:
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '1rem'
              }}
              placeholder="Ingresa tu usuario"
            />
          </div>
          
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
              Contraseña:
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '1rem'
              }}
              placeholder="Ingresa tu contraseña"
            />
          </div>
          
          <button
            type="submit"
            style={{
              width: '100%',
              padding: '0.75rem',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontSize: '1rem',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            Iniciar Sesión
          </button>
        </form>
        
        <div style={{ 
          marginTop: '1rem', 
          textAlign: 'center', 
          fontSize: '0.9rem', 
          color: '#666' 
        }}>
        </div>
      </div>
    </div>
  );
};

export default LoginSimple;
