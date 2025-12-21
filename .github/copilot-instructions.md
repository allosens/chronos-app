# Copilot Instructions for Chronos App

You are working on **Chronos**, a modern time tracking application built with **Angular 20** and **Tailwind CSS**. This is a production application that emphasizes clean code, type safety, accessibility, and performance.

## Project Overview

Chronos is a minimalist time tracking app with:
- Real-time timer with work/break management
- Daily progress tracking and statistics
- Responsive design (mobile, tablet, desktop)
- Server-side rendering (SSR) support
- Local persistence using localStorage

## Technology Stack

- **Framework**: Angular 20 (standalone components)
- **Language**: TypeScript 5.9+ (strict mode)
- **Styling**: Tailwind CSS 3.4+
- **State Management**: Angular Signals
- **Testing**: Jasmine + Karma
- **Build Tool**: Angular CLI 20+
- **Package Manager**: npm

## Critical Guidelines

### TypeScript Best Practices

- **Always use strict type checking** - avoid `any`, use `unknown` when type is uncertain
- Use **type inference** when obvious, but add **explicit return types** for functions/methods
- Prefer **interfaces** for object shapes over type aliases
- Use **readonly** modifier for immutable properties
- Use **const enum** for compile-time constant sets

### Angular Best Practices

**Components:**
- Always use **standalone components** (default in Angular 20+)
- **DO NOT** set `standalone: true` in decorators (it's the default)
- Use **`input()` and `output()`** functions instead of `@Input`/`@Output` decorators
- Set **`changeDetection: ChangeDetectionStrategy.OnPush`** for performance
- Keep components **small and focused** (single responsibility)
- Use **`computed()`** for derived state
- Prefer **inline templates/styles** for small components (under ~10 lines)

**State Management:**
- Use **signals** for state: `signal()`, `computed()`, `effect()`
- **DO NOT use `mutate()`** (deprecated) - use `update()` or `set()` instead
- Keep state transformations **pure and predictable**

**Templates:**
- Use **native control flow**: `@if`, `@for`, `@switch` (NOT `*ngIf`, `*ngFor`, `*ngSwitch`)
- Use **`async` pipe** for Observables to prevent memory leaks
- **DO NOT use `ngClass`** - use `[class.active]="isActive"` instead
- **DO NOT use `ngStyle`** - use `[style.width.px]="size"` instead
- **DO NOT write arrow functions in templates** (not supported)
- **DO NOT write RegEx in templates** (not supported)
- Do not assume globals like `new Date()` are available in templates

**Directives & Host Bindings:**
- **DO NOT use `@HostBinding` and `@HostListener`** decorators
- Put host bindings/listeners in the **`host` object** of `@Component`/`@Directive` decorator

**Services:**
- Use **`inject()`** function instead of constructor injection
- Design services with **single responsibility**
- Use **`providedIn: 'root'`** for singleton services
- Services should be **stateless** unless managing specific application state

**Routing:**
- Implement **lazy loading** for all feature routes
- Use **functional router guards** (`canActivate`, etc.) instead of class-based

**Images:**
- Use **`NgOptimizedImage`** for all static images (performance)
- Note: `NgOptimizedImage` doesn't work for inline base64 images

**DOM Manipulation:**
- **DO NOT manipulate DOM directly** with `ElementRef` unless absolutely necessary
- Prefer Angular's renderer for DOM operations

### Accessibility Requirements ♿

**MUST pass all AXE checks and follow WCAG AA standards:**
- Ensure proper **semantic HTML**
- Maintain **keyboard accessibility** for all interactive elements
- Provide **sufficient color contrast**
- Use **ARIA attributes** appropriately
- Include meaningful **text labels** or hidden text for screen readers (`aria-label`)
- Manage **focus** properly in dynamic content

### Code Quality Standards

**File Naming:**
- Use **kebab-case** for all file names: `user-profile.ts`, `time-tracking.service.ts`
- Remove `Component` suffix from component class names: `export class UserProfile` (not `UserProfileComponent`)

**Organization:**
- Organize by **feature**, not by file type
- Follow the structure in `docs/folder-structure.md`

**Testing:**
- Components **must be tested** using Angular Testing Library or similar
- Ensure tests cover functionality and accessibility

**Prettier Configuration:**
- `printWidth: 100`
- `singleQuote: true`
- Angular parser for HTML files

### Project Structure

```
src/app/
├── core/                     # Singleton services, guards, interceptors
├── shared/                   # Reusable components, pipes, directives
├── features/                 # Feature modules (lazy loaded)
│   ├── time-tracking/
│   │   ├── components/
│   │   ├── models/
│   │   ├── services/
│   │   └── pages/
│   ├── auth/
│   └── vacation-request/
├── layout/                   # App shell components
└── app.routes.ts            # Route configuration
```

### Key Utilities

**DateUtils** (`src/app/shared/utils/date.utils.ts`):
- Centralized time formatting utilities
- Use for consistent date/time handling throughout the app

### Development Workflow

**Install dependencies:**
```bash
npm install
```

**Development server:**
```bash
npm start
# or
ng serve
```

**Build:**
```bash
npm run build
```

**Tests:**
```bash
npm test
```

**SSR Server:**
```bash
npm run serve:ssr:chronos-app
```

### Known Issues

- **localStorage errors during SSR build** are expected during prerendering - they don't cause build failures
- The app is SSR-compatible, so be mindful of server vs. client context

### Additional Resources

- **[Style Guide](docs/style-guide.md)** - Comprehensive coding conventions and naming patterns
- **[Folder Structure](docs/folder-structure.md)** - Project organization guide
- **[Requirements](docs/requirements.md)** - Functional specifications
- **[Angular Components Guide](docs/angular/components.md)** - Component patterns
- **[Angular Services Guide](docs/angular/services.md)** - Service patterns
- **[Angular Anti-patterns](docs/angular/anti-patterns.md)** - What to avoid

## When Making Changes

1. **Maintain consistency** with existing code patterns
2. **Follow the style guide** in `docs/style-guide.md`
3. **Use TypeScript strict mode** - no `any` types
4. **Ensure accessibility** - WCAG AA compliance
5. **Test your changes** - write/update tests as needed
6. **Use signals** for state management
7. **Keep components small** and focused
8. **Document complex logic** when necessary
9. **Prefer functional patterns** over imperative
10. **Think about performance** - use OnPush, lazy loading, etc.

## Code Style Examples

**Good Component:**
```typescript
import { Component, ChangeDetectionStrategy, input, output, computed } from '@angular/core';

@Component({
  selector: 'app-user-profile',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.active]': 'isActive()',
    '(click)': 'handleClick()'
  },
  template: `
    @if (user(); as user) {
      <div class="profile">
        <h1>{{ user.name }}</h1>
        <p>{{ user.email }}</p>
      </div>
    }
  `
})
export class UserProfile {
  // Use input() and output() functions
  user = input.required<User>();
  onUpdate = output<User>();
  
  // Use computed() for derived state
  isActive = computed(() => this.user().status === 'active');
  
  handleClick() {
    this.onUpdate.emit(this.user());
  }
}
```

**Good Service:**
```typescript
import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  // Use inject() instead of constructor injection
  private http = inject(HttpClient);
  
  // Use signals for state
  private users = signal<User[]>([]);
  
  // Explicit return type
  getUsers(): Observable<User[]> {
    return this.http.get<User[]>('/api/users');
  }
}
```

Remember: **When in doubt, check the existing codebase for patterns and maintain consistency!**
