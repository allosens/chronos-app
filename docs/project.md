## CONTEXTO TÉCNICO
- Frontend: Angular 20 + TailwindCSS + Signal Store
- Arquitectura: Multi-tenancy lógico con company_id

## ESTRUCTURA DE ROLES

### 🧑‍💼 Super Admin (Admin Global)
Capacidades:
- Crear y editar compañías
- Ver métricas generales del sistema
- Asignar admin-company
- Panel de mantenimiento SaaS (licencias, límites, logs)
- Monitorear estadísticas globales (empresas activas, usuarios totales)

### 👩‍🏭 Admin Company (Admin de Empresa)
Capacidades:
- Dashboard de actividad en tiempo real (quién está trabajando, ausencias)
- Aprobar/rechazar correcciones de fichajes
- Gestionar empleados (crear, suspender, invitar)
- Gestionar vacaciones y permisos
- Exportar reportes de horas (por empleado o periodo)

### 👤 Usuario (Empleado)
Capacidades:
- Fichar entrada/salida/pausa con estado visual claro
- Consultar historial (diario/semanal/mensual)
- Solicitar corrección de marcas (olvidos o errores)
- Ver estado de solicitudes y vacaciones

## REQUISITOS DE DISEÑO

### Design System
Crea un design system completo con:

1. **Paleta de Colores**
   - Colores primarios para acciones principales (fichar entrada/salida)
   - Colores de estado (trabajando, pausado, ausente, pendiente, aprobado, rechazado)
   - Colores por rol (visual diferenciador para cada nivel)
   - Colores neutrales para backgrounds y textos

2. **Tipografía**
   - Jerarquía clara para títulos, subtítulos y body
   - Tamaños responsivos usando clases de Tailwind
   - Pesos para diferentes niveles de importancia

3. **Componentes Base**
   - Botones (primarios, secundarios, destructivos, ghost)
   - Cards para información
   - Badges para estados
   - Modals para confirmaciones
   - Forms (inputs, selects, date pickers)
   - Tables responsivas
   - Chips para tags y categorías
   - Avatares con indicadores de estado

4. **Espaciado y Grid**
   - Sistema de espaciado consistente
   - Layout responsivo mobile-first
   - Breakpoints para tablet y desktop

### Pantallas Requeridas

#### SUPER ADMIN
1. Dashboard global con métricas
2. Listado y gestión de compañías
3. Panel de monitoreo del sistema
4. Logs y actividad global

#### ADMIN COMPANY
1. Dashboard de la empresa (estado actual del equipo)
2. Gestión de empleados (tabla + acciones)
3. Aprobación de solicitudes (cola de revisión)
4. Gestión de vacaciones y permisos
5. Reportes y exportación de datos
6. Vista de calendario del equipo

#### USUARIO
1. Pantalla de fichaje principal (grande, clara, con estado actual)
2. Historial personal (filtros por fecha)
3. Formulario de solicitud de corrección
4. Estado de mis solicitudes
5. Mis vacaciones y permisos

### Características UX Importantes

- **Estados visuales claros**: Que un empleado vea inmediatamente si está "trabajando", "en pausa" o "fuera"
- **Feedback inmediato**: Confirmaciones visuales al fichar
- **Mobile-first**: Los empleados ficharán principalmente desde móvil
- **Accesibilidad**: Contraste WCAG AA, navegación por teclado
- **Loading states**: Skeletons para carga de datos
- **Empty states**: Mensajes amigables cuando no hay datos
- **Error states**: Manejo claro de errores

### Interacciones Clave

1. **Fichaje**: Botón grande, con animación de confirmación, muestra hora exacta
2. **Solicitudes**: Flujo de aprobación claro con comentarios
3. **Reportes**: Filtros intuitivos y preview antes de exportar
4. **Notificaciones**: Sistema de alertas no intrusivo

### Navegación

- **Super Admin**: Sidebar con secciones globales
- **Admin Company**: Sidebar con secciones de gestión de empresa
- **Usuario**: Bottom navigation bar (mobile) o sidebar simple (desktop)

### Diseño Responsivo

- Mobile: 320px - 640px (pantalla de fichaje optimizada)
- Tablet: 641px - 1024px (vistas combinadas)
- Desktop: 1025px+ (dashboards completos, tablas expandidas)

## ENTREGABLES ESPERADOS

1. Sistema de colores completo con valores Tailwind
2. Componentes UI documentados
3. Layouts para cada rol
4. Mockups de pantallas principales
5. Guía de estilos para estados y feedback
6. Patrones de navegación por rol
7. Sistema de iconografía

Prioriza la claridad, simplicidad y usabilidad. El usuario debe poder fichar en menos de 2 segundos desde que abre la app.