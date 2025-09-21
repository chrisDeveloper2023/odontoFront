# Sistema de Autenticación - Clínica Dental

## Descripción

Se ha implementado un sistema completo de autenticación con Bearer token para la aplicación de Clínica Dental. El sistema incluye:

- Página de login con formulario de usuario y contraseña
- Protección de rutas con redirección automática
- Manejo automático de Bearer token en todas las peticiones API
- Interfaz de usuario con información del usuario logueado
- Logout automático cuando el token expira

## Archivos Creados/Modificados

### Nuevos Archivos:
- `src/services/auth.ts` - Servicio de autenticación
- `src/pages/Login.tsx` - Página de login
- `src/components/ProtectedRoute.tsx` - Componente para proteger rutas
- `src/hooks/useAuth.ts` - Hook personalizado para autenticación

### Archivos Modificados:
- `src/api/client.ts` - Interceptores para Bearer token
- `src/App.tsx` - Rutas protegidas
- `src/components/Layout.tsx` - Menú de usuario y logout

## Funcionalidades

### 1. Página de Login (`/login`)
- Formulario con campos de usuario y contraseña
- Validación de campos requeridos
- Manejo de errores de autenticación
- Redirección automática después del login exitoso
- Diseño responsive y moderno

### 2. Protección de Rutas
- Todas las rutas principales están protegidas
- Redirección automática al login si no está autenticado
- Preservación de la ruta de destino para redirección post-login

### 3. Manejo de Token Bearer
- Token almacenado en localStorage
- Inclusión automática en headers de todas las peticiones API
- Logout automático cuando el token expira (401)
- Redirección al login en caso de token expirado

### 4. Interfaz de Usuario
- Información del usuario en el header
- Avatar con iniciales del nombre
- Menú dropdown con opciones de perfil y logout
- Botón de logout funcional

## 🔐 Credenciales de Acceso

**Usuario:** `admin`  
**Contraseña:** `admin1234`

## Uso del Sistema

### Para Acceder:
1. Ve a `http://localhost:8082/` (o el puerto que esté usando)
2. Serás redirigido automáticamente a `/login`
3. Ingresa las credenciales: `admin` / `admin1234`
4. Serás redirigido al dashboard principal

### Para Desarrolladores:

```typescript
// Usar el servicio de autenticación
import { authService } from '@/services/auth';

// Verificar si está autenticado
const isAuth = authService.isAuthenticated();

// Obtener usuario actual
const user = authService.getUser();

// Obtener token
const token = authService.getToken();

// Logout
authService.logout();
```

### Implementación Actual:

El sistema actualmente usa validación local (no requiere backend):

```typescript
// Validación simple implementada
if (username === 'admin' && password === 'admin1234') {
  // Login exitoso
  const mockUser = {
    id: 1,
    nombreCompleto: 'Administrador',
    nombreUsuario: 'admin',
    correo: 'admin@clinica.com',
    estado: 'ACTIVO',
    nombreGrupo: 'Administrador',
    clienteId: 1
  };
  // Guardar en localStorage
}
```

## Configuración

### Variables de Entorno:
Asegúrate de tener configurada la variable `VITE_API_URL` en tu archivo `.env`:

```
VITE_API_URL=http://localhost:3000/api
```

### Estructura de Rutas:
- `/login` - Página de login (no protegida)
- Todas las demás rutas están protegidas y requieren autenticación

## Seguridad

- Token almacenado en localStorage (considera usar httpOnly cookies para mayor seguridad en producción)
- Logout automático en caso de token expirado
- Validación de autenticación en cada carga de página
- Headers de autorización incluidos automáticamente en todas las peticiones

## Próximos Pasos Recomendados

1. **Implementar refresh token** para renovación automática de tokens
2. **Agregar validación de roles** para control de acceso granular
3. **Implementar remember me** para sesiones persistentes
4. **Agregar captcha** para prevenir ataques de fuerza bruta
5. **Implementar 2FA** para mayor seguridad
6. **Usar httpOnly cookies** en lugar de localStorage para el token
