# Sistema de Permisos - Guía de Uso

Este documento explica cómo usar el sistema de permisos implementado en la aplicación.

## 🏗️ Arquitectura

El sistema de permisos está compuesto por:

1. **AuthContext** - Maneja el estado global de permisos
2. **MenuConfig** - Filtra menús según permisos
3. **PermissionRoute** - Protege rutas completas
4. **PermissionGate** - Controla elementos individuales
5. **API de Permisos** - Gestión de permisos y roles

## 🔧 Configuración

### 1. Estructura de Permisos

Los permisos siguen el formato: `modulo:accion`

```typescript
// Ejemplos de permisos
"patients:view"      // Ver pacientes
"patients:create"    // Crear pacientes
"patients:edit"      // Editar pacientes
"patients:delete"    // Eliminar pacientes
"appointments:view"  // Ver citas
"admin:access"       // Acceso administrativo
```

### 2. Estructura de Usuario

```typescript
interface Usuario {
  // ... otros campos
  permissions?: string[]; // Permisos directos del usuario
  rol: {
    permissions?: string[]; // Permisos del rol
  };
}
```

## 🚀 Uso en Componentes

### 1. Hook useAuth

```tsx
import { useAuth } from "@/context/AuthContext";

const MyComponent = () => {
  const { hasPermission, permissions } = useAuth();

  // Verificar un permiso
  if (hasPermission('patients:create')) {
    // Mostrar botón crear
  }

  // Verificar múltiples permisos (OR)
  if (hasPermission(['patients:edit', 'patients:update'])) {
    // Mostrar botón editar
  }

  return <div>...</div>;
};
```

### 2. Hook usePermissions (Recomendado)

```tsx
import { usePermissions } from "@/hooks/usePermissions";

const MyComponent = () => {
  const { 
    hasPermission, 
    canAny, 
    canAll, 
    isAdmin, 
    isDoctor 
  } = usePermissions();

  // Verificar permisos específicos
  const canCreate = hasPermission('patients:create');
  const canEdit = hasPermission(['patients:edit', 'patients:update']);
  
  // Verificar roles
  if (isAdmin) {
    // Mostrar funciones administrativas
  }

  return <div>...</div>;
};
```

### 3. Componente PermissionGate

```tsx
import PermissionGate from "@/components/PermissionGate";

const MyComponent = () => {
  return (
    <div>
      {/* Mostrar solo si tiene permiso */}
      <PermissionGate permissions="patients:create">
        <Button>Nuevo Paciente</Button>
      </PermissionGate>

      {/* Con fallback */}
      <PermissionGate 
        permissions="patients:edit" 
        fallback={<span>Sin permisos</span>}
      >
        <Button>Editar</Button>
      </PermissionGate>

      {/* Requerir todos los permisos */}
      <PermissionGate 
        permissions={['patients:edit', 'patients:update']} 
        requireAll={true}
      >
        <Button>Editar Completo</Button>
      </PermissionGate>
    </div>
  );
};
```

## 🛡️ Protección de Rutas

### 1. PermissionRoute

```tsx
import PermissionRoute from "@/components/PermissionRoute";

// En el router
<Route 
  path="/patients" 
  element={
    <Layout>
      <PermissionRoute permissions="patients:view">
        <Patients />
      </PermissionRoute>
    </Layout>
  } 
/>

// Con mensaje de acceso denegado
<PermissionRoute 
  permissions="admin:access" 
  showAccessDenied={true}
>
  <AdminPanel />
</PermissionRoute>
```

### 2. PrivateRoute (Básico)

```tsx
import PrivateRoute from "@/components/PrivateRoute";

<Route 
  path="/patients" 
  element={
    <PrivateRoute permissions="patients:view">
      <Patients />
    </PrivateRoute>
  } 
/>
```

## 📋 Filtrado de Menús

El sistema automáticamente filtra los menús según permisos:

```typescript
// En MenuConfig
{
  id: "patients",
  name: "Pacientes",
  permissions: ["patients:view"], // Solo usuarios con este permiso verán el menú
  // ...
}
```

## 🔌 API de Permisos

### 1. Obtener Permisos

```typescript
import { getPermisos, getCurrentUserPermisos } from "@/lib/api/permisos";

// Todos los permisos disponibles
const permisos = await getPermisos();

// Permisos del usuario actual
const userPermisos = await getCurrentUserPermisos();
```

### 2. Verificar Permisos

```typescript
import { checkPermission } from "@/lib/api/permisos";

const canCreate = await checkPermission('patients:create');
```

## 🧪 Ejemplos Prácticos

### 1. Lista de Pacientes con Acciones Condicionales

```tsx
const PatientsList = () => {
  const { hasPermission } = useAuth();

  return (
    <div>
      {/* Botón crear */}
      {hasPermission('patients:create') && (
        <Button onClick={openCreateModal}>Nuevo Paciente</Button>
      )}

      {/* Lista de pacientes */}
      {patients.map(patient => (
        <div key={patient.id}>
          <span>{patient.name}</span>
          
          {/* Acciones */}
          <div>
            {hasPermission('patients:view') && (
              <Button onClick={() => viewPatient(patient.id)}>Ver</Button>
            )}
            
            {hasPermission(['patients:edit', 'patients:update']) && (
              <Button onClick={() => editPatient(patient.id)}>Editar</Button>
            )}
            
            {hasPermission('patients:delete') && (
              <Button variant="destructive" onClick={() => deletePatient(patient.id)}>
                Eliminar
              </Button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
```

### 2. Formulario con Campos Condicionales

```tsx
const PatientForm = () => {
  const { hasPermission } = usePermissions();

  return (
    <form>
      <Input name="name" placeholder="Nombre" />
      <Input name="email" placeholder="Email" />
      
      {/* Solo administradores pueden asignar clínica */}
      {hasPermission('admin:access') && (
        <Select name="clinic">
          <option value="">Seleccionar Clínica</option>
          {/* opciones */}
        </Select>
      )}
      
      {/* Solo doctores pueden ver historial médico */}
      {hasPermission('medical-records:view') && (
        <MedicalHistory patientId={patientId} />
      )}
    </form>
  );
};
```

### 3. Dashboard con Widgets Condicionales

```tsx
const Dashboard = () => {
  const { canAny, isAdmin } = usePermissions();

  return (
    <div className="grid grid-cols-3 gap-4">
      {/* Widget básico - todos los usuarios */}
      <StatsWidget title="Pacientes" count={totalPatients} />
      
      {/* Widget de citas - usuarios con permisos de citas */}
      {canAny(['appointments:view', 'calendar:view']) && (
        <AppointmentsWidget />
      )}
      
      {/* Widget administrativo - solo admins */}
      {isAdmin && (
        <AdminWidget />
      )}
    </div>
  );
};
```

## 🔍 Debugging

### 1. Verificar Permisos en DevTools

```javascript
// En la consola del navegador
console.log('Permisos:', JSON.parse(localStorage.getItem('authUser')).usuario.permissions);
```

### 2. Log de Permisos

```tsx
const DebugPermissions = () => {
  const { permissions, hasPermission } = useAuth();
  
  console.log('Permisos actuales:', permissions);
  console.log('Puede crear pacientes:', hasPermission('patients:create'));
  
  return null;
};
```

## ⚠️ Consideraciones Importantes

1. **Sincronización**: Los permisos se obtienen del login y se almacenan en localStorage
2. **Seguridad**: La verificación de permisos en el frontend es solo para UX, el backend debe validar siempre
3. **Performance**: Los permisos se calculan una vez y se reutilizan
4. **Fallbacks**: Siempre proporciona alternativas cuando se ocultan elementos por permisos

## 🚀 Próximos Pasos

1. Implementar gestión de roles en el frontend
2. Agregar permisos granulares por módulo
3. Crear sistema de auditoría de permisos
4. Implementar permisos temporales
