📄 backend_progress_plan_2025-10-21.md
# 🦷 Proyecto Clínico – Backend (estado al 2025-10-21)

## 🧭 Contexto general

Proyecto multitenant para administración de clínicas odontológicas y médicas:
- **Stack:** Node.js + TypeScript + TypeORM + Express + PostgreSQL (Docker)
- **Servicios actuales:** autenticación, usuarios, roles, permisos, citas, pacientes, historias clínicas, odontogramas, clínicas y consultorios.
- **Infraestructura:** Docker Compose con contenedores `odonto_backend`, `postgres_odontologia`, `odonto_frontend`.
- **Base de datos:** `clinica_db` con usuario `clinica_user`, puerto mapeado 5433 → 5432.

---

## ✅ Logros recientes (implementado y confirmado)

### 1. Migraciones
- 🔹 **Ejecutadas exitosamente desde host**:
  - `20251021120000-AddUniquePacienteFechaHoraToCitas`
  - `20251021121000-SeedSchedulingViewScopes`
- 🔹 Estado confirmado: `COMMIT` exitoso, 0 errores.
- 🔹 **Constraint aplicada:** `UNIQUE (id_paciente, fecha_hora)` en tabla `citas`.
- 🔹 **Permisos semilla creados:** categoría `scheduling`, incluye:


clinicas:view, consultorios:view, usuarios:view_doctores,
citas:view, citas:create, citas:edit, citas:cancel,
pacientes:view, pacientes:create

- 🔹 **Roles actualizados:**
- Recepcionista
- Odontólogo / Odontologo (sin y con tilde)
- Doctor
- Admin
- 🔹 **Asignaciones automáticas a roles** ejecutadas correctamente con `ON CONFLICT DO NOTHING`.

---

### 2. Validación lógica de citas
- Servicio de creación de citas (`cita.service.ts`) actualizado para:
- Validar que un mismo paciente **no pueda agendar dos citas en el mismo horario**, aun con distinto médico o consultorio.
- Responder **409 Conflict** antes de intentar guardar, evitando excepción SQL.
- Constraint adicional en BD garantiza unicidad a nivel estructural.

---

### 3. Permisos y vistas de scheduling
- Integración de nuevos scopes en la capa de autorización (`authorize()` middleware).
- Roles `Recepcionista` y `Odontólogo` ahora disponen de permisos para:
- Ver clínicas (`clinicas:view`)
- Ver consultorios (`consultorios:view`)
- Crear y visualizar citas (`citas:create`, `citas:view`)
- Acceder a listado de doctores (`usuarios:view_doctores`) ← pendiente de endpoint.

---

### 4. Entorno de desarrollo estabilizado
- Compilación confirmada con `CommonJS` (`tsconfig.json` ajustado).
- Migraciones corriendo con:
```bash
npx typeorm migration:run -d ./dist/config/data-source.js


.env.local activo y reconocido en CLI.

Error histórico __dirname is not defined y exports is not defined resueltos.

⚙️ Pendiente de implementación (próximas tareas backend)
1. Endpoint /api/usuarios/doctores

Objetivo: permitir que Recepcionistas y Odontólogos puedan listar los doctores disponibles para agendar citas.

Plan:

Crear método findDoctores en usuario.service.ts.

Agregar controlador listarDoctores en usuario.controller.ts.

Montar ruta GET /api/usuarios/doctores en usuario.routes.ts con permiso usuarios:view_doctores.

Responder array { id, nombres, apellidos, email }.

2. Validación de permisos de dropdowns

Problema detectado:

Recepcionistas no pueden ver clínicas ni médicos en los combos.

Odontólogos tampoco pueden listar médicos asociados.

Plan:

Revisión de authorize() para permitir acceso correcto según nuevos scopes.

Ajustar seeds si roles no tienen permisos asociados en producción.

Agregar endpoints:

GET /api/clinicas con permiso clinicas:view

GET /api/consultorios?clinica_id=:id con permiso consultorios:view

3. Auditoría rápida de roles

Objetivo: verificar consistencia entre roles, roles_permisos y permisos.

Plan:

SELECT r.nombre_rol, COUNT(rp.id_permiso)
FROM roles r
LEFT JOIN roles_permisos rp ON rp.id_rol = r.id_rol
GROUP BY r.nombre_rol
ORDER BY 1;


Servirá para validar que la seed haya surtido efecto en entorno real.

🧩 Pendiente general (siguiente fase)
🔜 Integración con frontend (no iniciada)

Adaptar módulo de citas:

Usar apiGet / apiPost (Axios con interceptores) en lugar de fetch.

Manejar estados 401, 403, 409 con notificaciones visuales.

Conectar dropdowns:

Cargar doctores, clínicas y consultorios dinámicamente usando los nuevos endpoints.

Revisar flujo de creación de historia clínica:

Validación 1:1 entre cita e historia.

Consolidación del odontograma (modo empty / from_last).

🧠 Conclusión

El backend está nuevamente estable y sincronizado con la base de datos.
Los cambios críticos (constraints, permisos y seed) se aplicaron correctamente.
El siguiente paso natural es crear y probar los endpoints de soporte de agendamiento para completar el flujo de citas, y recién después continuar con la integración del frontend.

📅 Próximo objetivo (Sprint siguiente)

Implementar endpoint /api/usuarios/doctores.

Validar permisos clinicas:view y consultorios:view.

Revisar seed de roles y confirmar asignación correcta.

Reintegrar y testear frontend con los endpoints actualizados.