# Angular Style Guide

This style guide follows the official [Angular Style Guide](https://angular.dev/style-guide) and provides comprehensive coding conventions for the Chronos project.

## Table of Contents

- [Introduction](#introduction)
- [Naming Conventions](#naming-conventions)
- [Project Structure](#project-structure)
- [Dependency Injection](#dependency-injection)
- [Components and Directives](#components-and-directives)
- [Templates](#templates)
- [Services](#services)
- [Testing](#testing)
- [Performance](#performance)

---

## Introduction

### Core Principles

1. **Consistency**: Follow consistent patterns throughout the codebase
2. **Readability**: Write code that is easy to read and understand
3. **Maintainability**: Structure code for long-term maintenance
4. **Performance**: Write efficient, optimized code
5. **Accessibility**: Ensure all components meet WCAG AA standards

### When in Doubt, Prefer Consistency

Whenever you encounter a situation where these rules contradict existing code, prioritize maintaining consistency within a file. Mixing different style conventions creates more confusion than diverging from recommendations.

---

## Naming Conventions

### File Names

**✅ Do**: Use kebab-case for file names
```
✅ Good:
- user-profile.ts
- time-tracking.ts
- main-layout.ts

❌ Avoid:
- UserProfile.ts
- timeTracking.ts
- mainLayout.ts
```

**✅ Do**: Separate words in file names with hyphens
- Component: `user-profile.ts` (class: `UserProfile`)
- Service: `auth.service.ts` (class: `AuthService`)
- Model: `time-entry.model.ts` (class: `TimeEntry`)

**✅ Do**: Match file names to TypeScript identifiers
```typescript
// File: user-profile.ts
export class UserProfile { }

// File: auth.service.ts  
export class AuthService { }
```

**✅ Do**: Use descriptive file names, avoid generic names
```
✅ Good:
- time-validation.utils.ts
- user-permissions.service.ts
- dashboard-metrics.model.ts

❌ Avoid:
- utils.ts
- helpers.ts
- common.ts
```

### Class Names

**✅ Do**: Use PascalCase for class names
```typescript
export class UserProfile { }
export class TimeTrackingService { }
export class AuthGuard { }
```

**✅ Do**: Use suffixes that describe the class type
```typescript
// Components: No suffix needed (simplified)
export class UserProfile { }
export class Dashboard { }

// Services: .service suffix
export class AuthService { }
export class ApiService { }

// Guards: .guard suffix  
export class AuthGuard { }
export class RoleGuard { }

// Models: .model suffix
export class UserModel { }
export class TimeEntryModel { }
```

### Test Files

**✅ Do**: Use `.spec.ts` suffix for unit tests
```
✅ Good:
- user-profile.spec.ts
- auth.service.spec.ts
- time-tracking.spec.ts
```

---

## Project Structure

### Application Code Organization

**✅ Do**: Put all application code in `src/` directory
```
src/
├── app/
├── assets/
├── styles/
├── main.ts
└── index.html
```

**✅ Do**: Bootstrap application in `main.ts`
```typescript
// src/main.ts
import { bootstrapApplication } from '@angular/platform-browser';
import { App } from './app/app';

bootstrapApplication(App);
```

**✅ Do**: Group closely related files in the same directory
```
src/app/features/time-tracking/
├── time-tracking.ts
├── time-tracking.spec.ts
├── components/
│   ├── clock-in-out/
│   └── break-management/
└── services/
    └── time-tracking.service.ts
```

**✅ Do**: Organize by feature areas, not by file types
```
✅ Good - Feature-based:
src/app/
├── features/
│   ├── time-tracking/
│   ├── employees/
│   └── reports/
├── shared/
│   ├── components/
│   ├── pipes/
│   └── services/
└── core/

❌ Avoid - Type-based:
src/app/
├── components/
├── services/
├── models/
└── pipes/
```

**✅ Do**: One concept per file
- Prefer one component, service, or model per file
- Small, focused files are easier to understand and maintain
- Exception: Small, tightly related classes can share a file

---

## Dependency Injection

**✅ Do**: Prefer `inject()` function over constructor injection
```typescript
// ✅ Preferred
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export class UserProfile {
  private authService = inject(AuthService);
  private router = inject(Router);
  
  // More readable and better type inference
  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}

// ❌ Avoid (when possible)
export class UserProfile {
  constructor(
    private authService: AuthService,
    private router: Router
  ) { }
}
```

**✅ Do**: Use `providedIn: 'root'` for singleton services
```typescript
@Injectable({
  providedIn: 'root'
})
export class AuthService {
  // Available application-wide
}
```

---

## Components and Directives

### Component Structure

**✅ Do**: Group Angular-specific properties before methods
```typescript
@Component({
  selector: 'app-user-profile',
  template: `...`,
})
export class UserProfile {
  // Inputs first
  readonly userId = input.required<string>();
  readonly editable = input(false);
  
  // Outputs
  readonly userSaved = output<User>();
  
  // Queries
  readonly paymentMethods = viewChildren(PaymentMethod);
  
  // Injected dependencies
  private userService = inject(UserService);
  
  // Other properties
  protected isLoading = signal(false);
  
  // Computed values
  protected fullName = computed(() => 
    `${this.user().firstName} ${this.user().lastName}`
  );
  
  // Methods
  saveUser() { /* ... */ }
}
```

**✅ Do**: Use `protected` for template-only members
```typescript
export class UserProfile {
  readonly userId = input.required<string>();
  
  // Only used in template - mark as protected
  protected fullName = computed(() => 
    `${this.firstName()} ${this.lastName()}`
  );
  
  // Public API method
  public saveUser() { }
}
```

**✅ Do**: Use `readonly` for properties that shouldn't change
```typescript
export class UserProfile {
  readonly userId = input.required<string>();
  readonly userSaved = output<User>();
  readonly userName = model<string>();
  readonly paymentMethods = viewChildren(PaymentMethod);
}
```

### Template Best Practices

**✅ Do**: Prefer `class` and `style` bindings over `ngClass` and `ngStyle`
```html
<!-- ✅ Preferred -->
<div [class.admin]="isAdmin" [class.dense]="density === 'high'">
<div [class]="{admin: isAdmin, dense: density === 'high'}">
<div [style.width.px]="width" [style.color]="color">

<!-- ❌ Avoid -->
<div [ngClass]="{admin: isAdmin, dense: density === 'high'}">
<div [ngStyle]="{width: width + 'px', color: color}">
```

**✅ Do**: Use native control flow over structural directives
```html
<!-- ✅ Preferred -->
@if (user) {
  <div>{{ user.name }}</div>
}

@for (item of items; track item.id) {
  <div>{{ item.name }}</div>
}

@switch (status) {
  @case ('loading') { <app-spinner /> }
  @case ('error') { <app-error /> }
  @default { <app-content /> }
}

<!-- ❌ Avoid -->
<div *ngIf="user">{{ user.name }}</div>
<div *ngFor="let item of items; trackBy: trackByFn">{{ item.name }}</div>
<div [ngSwitch]="status">
  <app-spinner *ngSwitchCase="'loading'"></app-spinner>
  <app-error *ngSwitchCase="'error'"></app-error>
  <app-content *ngSwitchDefault></app-content>
</div>
```

**✅ Do**: Name event handlers for what they do, not the event
```html
<!-- ✅ Preferred -->
<button (click)="saveUserData()">Save</button>
<button (click)="deleteUser()">Delete</button>

<!-- ❌ Avoid -->
<button (click)="handleClick()">Save</button>
<button (click)="onClick()">Delete</button>
```

**✅ Do**: Avoid overly complex logic in templates
```html
<!-- ✅ Preferred -->
<div [class.visible]="isContentVisible()">
  {{ formattedUserName() }}
</div>

<!-- ❌ Avoid -->
<div [class.visible]="user && user.isActive && !user.isDeleted && permissions.includes('VIEW_USER')">
  {{ user.firstName + ' ' + user.lastName + (user.title ? ' (' + user.title + ')' : '') }}
</div>
```

### Lifecycle Hooks

**✅ Do**: Keep lifecycle methods simple
```typescript
// ✅ Preferred
ngOnInit() {
  this.startLogging();
  this.loadUserData();
  this.setupEventListeners();
}

private startLogging() {
  this.logger.setMode('info');
  this.logger.monitorErrors();
}

// ❌ Avoid
ngOnInit() {
  this.logger.setMode('info');
  this.logger.monitorErrors();
  // ... 50 more lines of setup code
}
```

**✅ Do**: Implement lifecycle hook interfaces
```typescript
import { Component, OnInit, OnDestroy } from '@angular/core';

@Component({...})
export class UserProfile implements OnInit, OnDestroy {
  ngOnInit() { }
  ngOnDestroy() { }
}
```

---

## Services

**✅ Do**: Design services around single responsibility
```typescript
// ✅ Good - Focused on user operations
@Injectable({
  providedIn: 'root'
})
export class UserService {
  getUser(id: string): Observable<User> { }
  updateUser(user: User): Observable<User> { }
  deleteUser(id: string): Observable<void> { }
}

// ❌ Avoid - Too many responsibilities
export class ApplicationService {
  getUser(id: string): Observable<User> { }
  sendEmail(email: Email): Observable<void> { }
  logMessage(message: string): void { }
  validateForm(form: FormGroup): boolean { }
}
```

**✅ Do**: Keep services stateless unless managing specific state
```typescript
// ✅ Good - Stateless service
@Injectable({
  providedIn: 'root'
})
export class CalculationService {
  calculateTotal(items: Item[]): number {
    return items.reduce((sum, item) => sum + item.price, 0);
  }
}

// ✅ Good - State management service
@Injectable({
  providedIn: 'root'
})
export class UserStateService {
  private userSignal = signal<User | null>(null);
  readonly user = this.userSignal.asReadonly();
  
  setUser(user: User) {
    this.userSignal.set(user);
  }
}
```

---

## Testing

**✅ Do**: Write focused, isolated unit tests
```typescript
describe('UserProfile', () => {
  let component: UserProfile;
  let userService: jasmine.SpyObj<UserService>;

  beforeEach(() => {
    const spy = jasmine.createSpyObj('UserService', ['getUser']);
    
    TestBed.configureTestingModule({
      providers: [
        { provide: UserService, useValue: spy }
      ]
    });
    
    userService = TestBed.inject(UserService) as jasmine.SpyObj<UserService>;
    component = TestBed.createComponent(UserProfile).componentInstance;
  });

  it('should load user data on init', () => {
    const mockUser = { id: '1', name: 'John' };
    userService.getUser.and.returnValue(of(mockUser));
    
    component.ngOnInit();
    
    expect(userService.getUser).toHaveBeenCalledWith('1');
    expect(component.user()).toEqual(mockUser);
  });
});
```

**✅ Do**: Use descriptive test names
```typescript
// ✅ Good
it('should show error message when login fails')
it('should disable save button when form is invalid')
it('should emit user saved event when save succeeds')

// ❌ Avoid
it('should work')
it('should test login')
it('should handle error')
```

---

## Performance

**✅ Do**: Use `OnPush` change detection strategy
```typescript
@Component({
  selector: 'app-user-profile',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `...`
})
export class UserProfile { }
```

**✅ Do**: Use `trackBy` functions for lists
```typescript
// Component
trackByUserId(index: number, user: User): string {
  return user.id;
}

// Template
@for (user of users; track trackByUserId($index, user)) {
  <app-user-card [user]="user" />
}
```

**✅ Do**: Use `async` pipe for observables
```html
<!-- ✅ Preferred -->
@if (user$ | async; as user) {
  <div>{{ user.name }}</div>
}

<!-- ❌ Avoid -->
<div *ngIf="user">{{ user.name }}</div>
```

---

## Accessibility

**✅ Do**: Use semantic HTML elements
```html
<!-- ✅ Good -->
<header>
  <nav>
    <ul>
      <li><a href="/dashboard">Dashboard</a></li>
      <li><a href="/employees">Employees</a></li>
    </ul>
  </nav>
</header>

<main>
  <section>
    <h1>User Profile</h1>
    <form>
      <label for="name">Name</label>
      <input id="name" type="text" />
    </form>
  </section>
</main>
```

**✅ Do**: Provide appropriate ARIA labels
```html
<button 
  (click)="deleteUser()" 
  aria-label="Delete user John Smith">
  🗑️
</button>

<input 
  type="search" 
  aria-label="Search employees"
  placeholder="Search...">
```

**✅ Do**: Ensure keyboard navigation
```typescript
@Component({
  selector: 'app-modal',
  host: {
    '(keydown.escape)': 'closeModal()',
    'role': 'dialog',
    'aria-modal': 'true'
  }
})
export class Modal { }
```

---

## Conclusion

Following these style guidelines ensures:
- **Consistency** across the entire codebase
- **Readability** for current and future developers  
- **Maintainability** as the project grows
- **Performance** optimization
- **Accessibility** for all users

For the most up-to-date guidelines, always refer to the [official Angular Style Guide](https://angular.dev/style-guide).