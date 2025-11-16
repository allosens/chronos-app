You are an expert in TypeScript, Angular, and scalable web application development. You write functional, maintainable, performant, and accessible code following Angular and TypeScript best practices.

> 📋 **Important**: This project follows the [Angular Style Guide](docs/style-guide.md). Please review it for comprehensive coding conventions, naming patterns, and best practices specific to this project.

## Quick Reference

### TypeScript Best Practices
- Use **strict type checking** (`"strict": true` in `tsconfig.json`).
- Prefer **type inference** when the type is obvious.
- Avoid the `any` type; use **`unknown`** when the type is uncertain, requiring a safe type assertion/check before use.
- Use **interfaces** for defining object shapes over type aliases for objects.
- Use **`const enum`** for small, compile-time constant sets.
- Always add **explicit return types** for functions/methods unless the type is trivially obvious.
- Use **readonly** modifier for properties that shouldn't change after initialization.

---

## Quick Angular Best Practices
- Always use **standalone components** over NgModules.
- Must NOT set `standalone: true` inside Angular decorators. It's the **default in Angular v20+**.
- Use **signals** for state management, prioritizing `signal()`, `computed()`, and `effect()`.
- Implement **lazy loading** for all feature routes.
- **Do NOT use the `@HostBinding` and `@HostListener` decorators**. Put host bindings/listeners inside the **`host`** object of the `@Component` or `@Directive` decorator instead.
- Use **`NgOptimizedImage`** for all static images for performance.
  - `NgOptimizedImage` does not work for inline base64 images.
- Use the **functional router guards** (`canActivate`, `canLoad`, etc.) instead of class-based guards.
- **Do NOT manipulate the DOM directly** using `ElementRef` unless absolutely necessary (e.g., integrating third-party libs); prefer Angular's renderer.
- **Keep directives focused** on modifying DOM behavior.

---

## Accessibility Requirements ♿
- It MUST pass all **AXE checks**.
- It MUST follow all **WCAG AA minimums**, including focus management, proper semantic HTML, color contrast, and ARIA attributes.
- Ensure all interactive elements are reachable and operable via the **keyboard**.
- Use meaningful text labels or hidden text for screen readers (e.g., using `aria-label`).

---

### Components
- Keep components **small and focused on a single responsibility** (S.R.P.).
- Use **`input()` and `output()`** functions instead of decorators (`@Input`, `@Output`).
- Use **`computed()`** for derived state.
- Set **`changeDetection: ChangeDetectionStrategy.OnPush`** in `@Component` decorator for maximum performance and predictability.
- Prefer **inline templates/styles** for small components (under ~10 lines).
- Prefer **Reactive forms** instead of Template-driven ones for complex forms.
- **Do NOT use `ngClass`**, use **`class` bindings** instead (e.g., `[class.active]="isActive"`).
- **Do NOT use `ngStyle`**, use **`style` bindings** instead (e.g., `[style.width.px]="size"`).
- When using external templates/styles, use **paths relative to the component TS file** (`./...`).
- Components **must be tested** using Angular Testing Library (or similar) to ensure functionality and accessibility.

---

## State Management
- Use **signals** for local component state.
- Use **`computed()`** for derived state.
- Keep state transformations **pure and predictable** (no side effects).
- **Do NOT use `mutate` on signals** (it's deprecated); use **`update` or `set`** instead for modifications.
- For global, application-wide state, use a dedicated **state management pattern** based on Signals or RxJS/NgRx, ensuring a single source of truth.

---

## Templates
- Keep templates **simple and avoid complex logic**; move complexity to the component class or a pipe.
- Use **native control flow** (`@if`, `@for`, `@switch`) instead of `*ngIf`, `*ngFor`, `*ngSwitch`.
- Use the **`async` pipe** to handle Observables and prevent memory leaks.
- Do not assume globals (like `new Date()`) are available within templates.
- **Do not write arrow functions in templates** (they are not supported).
- **Do not write Regular expressions in templates** (they are not supported).
- Favor **pipes** (`|`) for formatting data in templates.

---

## Services
- Design services around a **single responsibility**.
- Use the **`providedIn: 'root'`** option for singleton services.
- Use the **`inject()`** function instead of constructor injection wherever possible (especially inside pipes, components, and other services).
- Services should be **stateless** unless they are specifically designed to manage a piece of application state (e.g., a signal store service).
- **Avoid deep dependency trees** in constructors; use the façade pattern where appropriate.

## Resources
- Save documentation files in **docs** folder
- 📋 **[Complete Style Guide](docs/style-guide.md)** - Comprehensive coding conventions
- 📁 **[Folder Structure Guide](docs/folder-structure.md)** - Project organization patterns
- 📋 **[Requirements](docs/requirements.md)** - Functional specifications

---

## File Naming Conventions

> 📋 **See [Style Guide](docs/style-guide.md#naming-conventions)** for comprehensive naming conventions.

### Quick Reference
- **Files**: Use `kebab-case` (e.g., `user-profile.ts`)
- **Classes**: Remove `Component` suffix (e.g., `export class UserProfile`)
- **Structure**: Organize by feature, not by file type

---