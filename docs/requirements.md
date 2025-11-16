# Chronos App - Especificaciones de Requisitos

## Tabla de Contenidos
- [Roles de Usuario](#roles-de-usuario)
- [Funcionalidades por Rol](#funcionalidades-por-rol)
  - [👤 Usuario (Empleado)](#-usuario-empleado)
  - [�‍💼 Admin Company](#-admin-company)
  - [🧑‍💼 Super Admin](#-super-admin)
  - [🔐 Funcionalidades Transversales](#-funcionalidades-transversales)

---

## Roles de Usuario

| Rol | Descripción |
|-----|-------------|
| **👤 Usuario (Empleado)** | Empleado que registra su jornada laboral |
| **👩‍💼 Admin Company** | Administrador de una empresa específica |
| **🧑‍💼 Super Admin** | Administrador del sistema completo |

---

## Funcionalidades por Rol

## 👤 Usuario (Empleado)

### �🕒 Fichar entrada y salida

**Feature:** Registrar jornada laboral

#### Scenario: Usuario ficha su entrada
- **Given:** que el usuario ha iniciado sesión
- **When:** pulsa el botón "Fichar entrada"
- **Then:** 
  - se registra la hora actual como inicio de jornada
  - el estado del usuario pasa a "Trabajando"

#### Scenario: Usuario ficha su salida
- **Given:** que el usuario está en estado "Trabajando"
- **When:** pulsa el botón "Fichar salida"
- **Then:**
  - se registra la hora actual como fin de jornada
  - el estado del usuario pasa a "Fuera de servicio"

---

### 💤 Pausa laboral

**Feature:** Registrar pausa laboral

#### Scenario: Usuario inicia pausa
- **Given:** que el usuario está "Trabajando"
- **When:** pulsa el botón "Iniciar pausa"
- **Then:**
  - se registra la hora actual como inicio de pausa
  - el estado del usuario pasa a "En pausa"

#### Scenario: Usuario finaliza pausa
- **Given:** que el usuario está "En pausa"
- **When:** pulsa el botón "Finalizar pausa"
- **Then:**
  - se registra la hora actual como fin de pausa
  - el estado del usuario vuelve a "Trabajando"

---

### 📅 Ver historial de fichajes

**Feature:** Consultar historial

#### Scenario: Usuario consulta su historial
- **Given:** que el usuario ha iniciado sesión
- **When:** accede a la vista "Historial"
- **Then:** se muestran sus fichajes con fecha, hora de entrada y salida

---

### 📝 Solicitar corrección de fichaje

**Feature:** Solicitar corrección de fichaje

#### Scenario: Usuario envía una solicitud de corrección
- **Given:** que el usuario detecta un error en su registro
- **When:** envía una solicitud con motivo y nuevo valor
- **Then:** la solicitud queda registrada con estado "Pendiente de aprobación"

---

### 🌴 Solicitar vacaciones o días libres

**Feature:** Solicitar vacaciones

#### Scenario: Usuario solicita vacaciones
- **Given:** que el usuario ha iniciado sesión
- **When:** envía una solicitud con fechas de inicio y fin
- **Then:** el sistema crea una solicitud con estado "Pendiente"

---

## 👩‍💼 Admin Company

### 👥 Gestionar empleados

**Feature:** Gestión de empleados

#### Scenario: Admin crea un nuevo empleado
- **Given:** que el admin está autenticado
- **When:** completa el formulario de alta con los datos del usuario
- **Then:** el empleado queda registrado en su compañía

#### Scenario: Admin elimina un empleado
- **Given:** que el admin ve la lista de empleados
- **When:** elimina a un empleado
- **Then:** el sistema marca al empleado como "Inactivo"

---

### ✅ Aprobar o rechazar correcciones

**Feature:** Aprobar o rechazar correcciones

#### Scenario: Admin aprueba una corrección
- **Given:** que existe una solicitud pendiente
- **When:** el admin la aprueba
- **Then:**
  - el fichaje se actualiza con los nuevos valores
  - la solicitud cambia a estado "Aprobada"

#### Scenario: Admin rechaza una corrección
- **Given:** que existe una solicitud pendiente
- **When:** el admin la rechaza
- **Then:** la solicitud cambia a estado "Rechazada"

---

### 🗓️ Aprobar o rechazar vacaciones

**Feature:** Gestionar vacaciones

#### Scenario: Admin aprueba vacaciones
- **Given:** que hay una solicitud pendiente de vacaciones
- **When:** el admin la aprueba
- **Then:** el estado pasa a "Aprobada"

#### Scenario: Admin rechaza vacaciones
- **Given:** que hay una solicitud pendiente de vacaciones
- **When:** el admin la rechaza
- **Then:** el estado pasa a "Rechazada"

---

### 📊 Generar reportes de horas

**Feature:** Generar reportes

#### Scenario: Admin genera un reporte semanal
- **Given:** que el admin selecciona un rango de fechas
- **When:** solicita generar el reporte
- **Then:** el sistema devuelve un resumen con las horas trabajadas por empleado

---

## 🧑‍💼 Super Admin

### 🏢 Gestionar compañías

**Feature:** Gestión de compañías

#### Scenario: Super admin crea una nueva compañía
- **Given:** que el super admin está autenticado
- **When:** completa los datos de una nueva compañía
- **Then:** la compañía queda registrada en el sistema

#### Scenario: Super admin asigna un admin a una compañía
- **Given:** que existe una compañía y un usuario registrado
- **When:** el super admin lo asigna como admin
- **Then:** el usuario obtiene rol de "Admin Company" en esa empresa

---

### 📈 Ver métricas globales

**Feature:** Dashboard global

#### Scenario: Super admin consulta estadísticas
- **Given:** que hay compañías activas con usuarios registrados
- **When:** el super admin accede al dashboard
- **Then:** se muestran métricas globales de uso (número de compañías, usuarios activos, fichajes)

---

## 🔐 Funcionalidades Transversales

### 🔑 Autenticación

**Feature:** Autenticación

#### Scenario: Usuario inicia sesión correctamente
- **Given:** que el usuario introduce credenciales válidas
- **When:** envía el formulario de login
- **Then:** el sistema le concede acceso a su panel correspondiente

#### Scenario: Usuario intenta acceder sin autenticarse
- **Given:** que el usuario no ha iniciado sesión
- **When:** accede a una ruta protegida
- **Then:** el sistema lo redirige al login

---

## Estados del Sistema

### Estados de Usuario
| Estado | Descripción |
|--------|-------------|
| `Fuera de servicio` | Usuario no ha iniciado jornada |
| `Trabajando` | Usuario en jornada laboral activa |
| `En pausa` | Usuario en pausa dentro de la jornada |

### Estados de Solicitudes
| Estado | Descripción |
|--------|-------------|
| `Pendiente` | Solicitud creada, esperando revisión |
| `Aprobada` | Solicitud aceptada por admin |
| `Rechazada` | Solicitud denegada por admin |
| `Pendiente de aprobación` | Solicitud de corrección en revisión |

---

## Notas Técnicas

- **Autenticación requerida:** Todas las funcionalidades requieren usuario autenticado
- **Roles jerárquicos:** Super Admin > Admin Company > Usuario
- **Auditoría:** Todos los cambios deben quedar registrados con timestamp
- **Validaciones:** Verificar estados válidos antes de permitir transiciones
