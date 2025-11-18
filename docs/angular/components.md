# Angular Components Guide

## Component Structure

Every component must follow this structure:
```typescript
import { Component, ChangeDetectionStrategy, signal, computed, input, output } from '@angular/core';
import { inject } from '@angular/core';

@Component({
  selector: 'app-user-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.highlighted]': 'highlighted()',
    '(click)': 'handleClick()'
  },
  template: `
    @if (user(); as u) {
      <div class="card">
        <h3>{{ u.name }}</h3>
        <p>{{ u.email }}</p>
      </div>
    }
  `,
  styles: `
    .card { padding: 1rem; border-radius: 8px; }
    .highlighted { background: yellow; }
  `
})
export class UserCard {
  // 1. Inputs
  user = input.required<User>();
  highlighted = input(false);
  
  // 2. Outputs
  cardClicked = output<User>();
  
  // 3. Services (using inject())
  private analytics = inject(AnalyticsService);
  
  // 4. State (signals)
  private clickCount = signal(0);
  
  // 5. Computed values
  hasBeenClicked = computed(() => this.clickCount() > 0);
  
  // 6. Methods
  handleClick(): void {
    this.clickCount.update(c => c + 1);
    this.cardClicked.emit(this.user());
    this.analytics.track('card-click');
  }
}
```

## Component Checklist

When creating a component, ensure:
- [ ] `changeDetection: ChangeDetectionStrategy.OnPush`
- [ ] No `standalone: true` (default in v20+)
- [ ] Uses `input()` and `output()` functions
- [ ] Uses signals for state
- [ ] Uses `computed()` for derived values
- [ ] Template uses `@if/@for/@switch`
- [ ] Uses `inject()` for dependencies
- [ ] Accessible: semantic HTML, ARIA labels, keyboard navigation
- [ ] File name in kebab-case (e.g., `user-profile.component.ts`)
- [ ] Class name without "Component" suffix (e.g., `export class UserProfile`)

## Input & Output

### ✅ Correct Way (v20+)
```typescript
export class UserCard {
  // Required input
  userId = input.required<string>();
  
  // Optional input with default
  theme = input<'light' | 'dark'>('light');
  
  // Transform input
  count = input(0, { transform: numberAttribute });
  
  // Output
  userDeleted = output<string>();
  
  deleteUser(): void {
    this.userDeleted.emit(this.userId());
  }
}
```

### ❌ Old Way (Don't use)
```typescript
export class UserCard {
  @Input() userId!: string;
  @Input() theme: 'light' | 'dark' = 'light';
  @Output() userDeleted = new EventEmitter<string>();
}
```

## Host Bindings

### ✅ Correct Way
```typescript
@Component({
  host: {
    '[class.active]': 'isActive()',
    '[attr.role]': '"button"',
    '(click)': 'handleClick()',
    '(keydown.enter)': 'handleClick()'
  }
})
```

### ❌ Old Way (Don't use)
```typescript
@HostBinding('class.active') isActive = false;
@HostListener('click') onClick() {}
```

## Template vs External Files

### Inline (for small components < 10 lines)
```typescript
@Component({
  template: `<div>{{ user().name }}</div>`,
  styles: `.card { padding: 1rem; }`
})
```

### External (for larger components)
```typescript
@Component({
  templateUrl: './user-card.component.html',
  styleUrl: './user-card.component.scss'
})
```

## Single Responsibility Principle

Keep components focused on **one thing**:

### ✅ Good - Focused Component
```typescript
// user-card.component.ts - Only displays user info
export class UserCard {
  user = input.required<User>();
}

// user-list.component.ts - Only manages list
export class UserList {
  users = input.required<User[]>();
  userSelected = output<User>();
}
```

### ❌ Bad - Doing too much
```typescript
// user-manager.component.ts - Handles display, API calls, routing, etc.
export class UserManager {
  // Too many responsibilities!
}
```

## Performance Tips

1. **Always use OnPush**: `changeDetection: ChangeDetectionStrategy.OnPush`
2. **Use trackBy in @for**: `@for (item of items(); track item.id)`
3. **Lazy load features**: Split into feature modules with lazy loading
4. **Use NgOptimizedImage**: For static images
5. **Avoid function calls in templates**: Use computed signals instead
```typescript
// ❌ Bad - Function called on every change detection
<div>{{ getFullName() }}</div>

// ✅ Good - Computed once, cached
fullName = computed(() => `${this.firstName()} ${this.lastName()}`);
<div>{{ fullName() }}</div>
```

## See Also
- [Templates Guide](templates.md)
- [State Management](state-management.md)
- [Component Template](../examples/component-template.md)