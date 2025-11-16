# Estructura de Carpetas - Proyecto Chronos

## Arquitectura General

El proyecto Chronos sigue una arquitectura modular basada en **Feature Modules** para Angular, organizando el código por funcionalidades de negocio.

```
chronos/
├── src/
│   ├── app/
│   │   ├── core/                    # Módulo principal singleton
│   │   ├── shared/                  # Módulos compartidos
│   │   ├── features/                # Módulos de funcionalidades
│   │   ├── layout/                  # Componentes de diseño
│   │   └── app.config.ts
│   ├── assets/                      # Recursos estáticos
│   ├── styles/                      # Estilos globales y temas
│   └── index.html
├── docs/                           # Documentación del proyecto
└── public/                         # Archivos públicos
```

---

## 📁 Estructura Detallada

### `/src/app/core/`
**Propósito:** Servicios y funcionalidades singleton que se cargan una sola vez.

```
core/
├── services/           # Servicios globales
│   ├── api.service.ts
│   ├── auth.service.ts
│   ├── notification.service.ts
│   └── storage.service.ts
├── interceptors/       # Interceptores HTTP
│   ├── auth.interceptor.ts
│   ├── error.interceptor.ts
│   └── loading.interceptor.ts
├── guards/            # Guards de navegación
│   ├── auth.guard.ts
│   ├── role.guard.ts
│   └── prevent-unsaved-changes.guard.ts
├── models/            # Modelos globales
│   ├── user.model.ts
│   ├── api-response.model.ts
│   └── error.model.ts
├── interfaces/        # Interfaces globales
│   ├── auth.interface.ts
│   └── api.interface.ts
├── constants/         # Constantes globales
│   ├── app.constants.ts
│   ├── roles.constants.ts
│   └── endpoints.constants.ts
└── utils/            # Utilidades globales
    ├── date.utils.ts
    ├── validation.utils.ts
    └── format.utils.ts
```

### `/src/app/shared/`
**Propósito:** Componentes, pipes, directivas y servicios reutilizables.

```
shared/
├── components/        # Componentes reutilizables
│   ├── loading-spinner/
│   ├── confirmation-dialog/
│   ├── data-table/
│   ├── date-picker/
│   └── status-badge/
├── pipes/            # Pipes personalizados
│   ├── duration.pipe.ts
│   ├── status.pipe.ts
│   └── time-format.pipe.ts
├── directives/       # Directivas personalizadas
│   ├── highlight.directive.ts
│   └── permission.directive.ts
├── validators/       # Validadores customizados
│   ├── time-range.validator.ts
│   └── business-rules.validator.ts
├── services/         # Servicios compartidos
│   ├── dialog.service.ts
│   └── export.service.ts
├── models/          # Modelos compartidos
├── interfaces/      # Interfaces compartidas
└── types/          # Tipos TypeScript compartidos
```

### `/src/app/features/`
**Propósito:** Módulos de funcionalidades organizados por dominio de negocio.

#### **Authentication (`/features/auth/`)**
```
auth/
├── components/
│   ├── login/
│   ├── register/
│   └── forgot-password/
├── services/
│   └── auth-api.service.ts
├── guards/
│   └── guest.guard.ts
└── models/
    ├── login.model.ts
    └── register.model.ts
```

#### **Dashboard (`/features/dashboard/`)**
```
dashboard/
├── components/
│   ├── dashboard-overview/
│   ├── quick-actions/
│   └── recent-activity/
├── pages/
│   └── dashboard.component.ts
├── services/
│   └── dashboard.service.ts
└── models/
    └── dashboard-data.model.ts
```

#### **Time Tracking (`/features/time-tracking/`)**
```
time-tracking/
├── components/
│   ├── clock-in-out/          # Fichar entrada/salida
│   ├── break-management/      # Gestión de pausas
│   ├── time-entry-form/       # Formulario de registros
│   └── history-viewer/        # Visualizar historial
├── pages/
│   ├── time-clock.component.ts
│   └── time-history.component.ts
├── services/
│   ├── time-tracking.service.ts
│   └── timer.service.ts
└── models/
    ├── time-entry.model.ts
    └── work-session.model.ts
```

#### **Employees (`/features/employees/`)**
```
employees/
├── components/
│   ├── employee-list/
│   ├── employee-form/
│   └── employee-detail/
├── pages/
│   ├── employees.component.ts
│   └── employee-profile.component.ts
├── services/
│   └── employees.service.ts
└── models/
    └── employee.model.ts
```

#### **Companies (`/features/companies/`)**
```
companies/
├── components/
│   ├── company-list/
│   ├── company-form/
│   └── company-settings/
├── pages/
│   └── companies.component.ts
├── services/
│   └── companies.service.ts
└── models/
    └── company.model.ts
```

#### **Reports (`/features/reports/`)**
```
reports/
├── components/
│   ├── report-generator/
│   ├── report-filters/
│   └── report-viewer/
├── pages/
│   └── reports.component.ts
├── services/
│   └── reports.service.ts
└── models/
    └── report.model.ts
```

#### **Requests (`/features/requests/`)**
```
requests/
├── components/
│   ├── time-correction/       # Solicitudes de corrección
│   ├── vacation-request/      # Solicitudes de vacaciones
│   ├── request-list/          # Lista de solicitudes
│   └── request-approval/      # Aprobación de solicitudes
├── pages/
│   ├── my-requests.component.ts
│   └── pending-approvals.component.ts
├── services/
│   └── requests.service.ts
└── models/
    ├── time-correction.model.ts
    └── vacation-request.model.ts
```

#### **Profile (`/features/profile/`)**
```
profile/
├── components/
│   ├── profile-info/
│   ├── change-password/
│   └── preferences/
├── pages/
│   └── profile.component.ts
├── services/
│   └── profile.service.ts
└── models/
    └── user-profile.model.ts
```

### `/src/app/layout/`
**Propósito:** Componentes de diseño y navegación.

```
layout/
├── header/
│   ├── header.component.ts
│   ├── header.component.html
│   └── header.component.scss
├── sidebar/
│   ├── sidebar.component.ts
│   ├── sidebar.component.html
│   └── sidebar.component.scss
├── footer/
│   ├── footer.component.ts
│   ├── footer.component.html
│   └── footer.component.scss
└── navigation/
    ├── nav-menu.component.ts
    ├── nav-menu.component.html
    └── nav-menu.component.scss
```

### `/src/assets/`
**Propósito:** Recursos estáticos del proyecto.

```
assets/
├── images/            # Imágenes del proyecto
│   ├── logos/
│   ├── backgrounds/
│   └── placeholders/
├── icons/             # Iconos SVG y fuentes de iconos
│   ├── svg/
│   └── fonts/
├── fonts/             # Fuentes tipográficas
└── data/             # Archivos JSON de datos estáticos
    ├── countries.json
    └── timezones.json
```

### `/src/styles/`
**Propósito:** Organización de estilos CSS/SCSS.

```
styles/
├── abstracts/         # Variables, mixins, funciones
│   ├── _variables.scss
│   ├── _mixins.scss
│   └── _functions.scss
├── layout/           # Estilos de layout
│   ├── _header.scss
│   ├── _sidebar.scss
│   └── _grid.scss
├── components/       # Estilos de componentes globales
│   ├── _buttons.scss
│   ├── _forms.scss
│   └── _tables.scss
├── themes/          # Temas y paletas de colores
│   ├── _light-theme.scss
│   ├── _dark-theme.scss
│   └── _theme-variables.scss
├── vendors/         # Estilos de terceros
│   └── _bootstrap-overrides.scss
└── main.scss       # Archivo principal de estilos
```

---

## 🎯 Principios de Organización

### 1. **Separación por Dominio**
- Cada feature representa un dominio de negocio específico
- Los módulos están autocontenidos con sus propios componentes, servicios y modelos

### 2. **Estructura Consistente**
- Cada feature sigue la misma estructura: `components/`, `services/`, `models/`, `pages/`
- Los nombres siguen convenciones kebab-case para carpetas y PascalCase para archivos

### 3. **Dependencias Claras**
- **Core**: No depende de otros módulos
- **Shared**: Solo depende de Core
- **Features**: Pueden depender de Core y Shared, pero no entre ellos
- **Layout**: Depende de Core y Shared

### 4. **Reutilización**
- Componentes reutilizables en `shared/components/`
- Servicios singleton en `core/services/`
- Utilidades comunes en `core/utils/` y `shared/`

---

## 🚀 Módulos Angular Sugeridos

```typescript
// app.config.ts - Configuración principal
// core.module.ts - Módulo singleton
// shared.module.ts - Módulo compartido
// feature.module.ts - Por cada funcionalidad
```

---

## 📋 Convenciones de Nomenclatura

### Archivos y Carpetas
- **Carpetas**: `kebab-case` (ejemplo: `time-tracking/`)
- **Componentes**: `feature.component.ts` (ejemplo: `clock-in-out.component.ts`)
- **Servicios**: `feature.service.ts` (ejemplo: `time-tracking.service.ts`)
- **Modelos**: `feature.model.ts` (ejemplo: `time-entry.model.ts`)
- **Interfaces**: `feature.interface.ts` (ejemplo: `auth.interface.ts`)

### Clases y Métodos
- **Clases**: `PascalCase` (ejemplo: `TimeTrackingService`)
- **Métodos**: `camelCase` (ejemplo: `clockIn()`, `requestVacation()`)
- **Propiedades**: `camelCase` (ejemplo: `isWorking`, `totalHours`)

---

Esta estructura está diseñada para:
- ✅ **Escalabilidad**: Fácil agregar nuevas funcionalidades
- ✅ **Mantenimiento**: Código organizado y fácil de encontrar
- ✅ **Reutilización**: Componentes y servicios compartidos
- ✅ **Testing**: Estructura clara para pruebas unitarias
- ✅ **Colaboración**: Múltiples desarrolladores pueden trabajar en paralelo