# Anti-Patterns - What NOT to Do

## ❌ Using Deprecated APIs

### Old Decorators
```typescript
// ❌ DON'T
export class UserCard {
  @Input() user!: User;
  @Output() deleted = new EventEmitter<void>();
  @HostBinding('class.active') isActive = true;
  @HostListener('click') onClick() {}
}

// ✅ DO
export class UserCard {
  user = input.required<User>();
  deleted = output<void>();
  
  // In @Component decorator
  host: {
    '[class.active]': 'isActive()',
    '(click)': 'handleClick()'
  }
}
```

### Old Control Flow
```typescript
// ❌ DON'T
<div *ngIf="user">{{ user.name }}</div>
<div *ngFor="let item of items">{{ item }}</div>
<div [ngSwitch]="type">
  <div *ngSwitchCase="'a'">Type A</div>
</div>

// ✅ DO
@if (user) {
  <div>{{ user.name }}</div>
}
@for (item of items; track item.id) {
  <div>{{ item }}</div>
}
@switch (type) {
  @case ('a') { <div>Type A</div> }
}
```

### signal.mutate()
```typescript
// ❌ DON'T (deprecated)
this.count.mutate(val => val++);

// ✅ DO
this.count.update(val => val + 1);
this.count.set(5);
```

---

## ❌ Type Safety Issues
```typescript
// ❌ DON'T use 'any'
function process(data: any) {
  return data.value;
}

// ✅ DO use proper types
function process(data: { value: string }): string {
  return data.value;
}

// ✅ Or use 'unknown' for uncertain types
function process(data: unknown): string {
  if (typeof data === 'object' && data !== null && 'value' in data) {
    return String((data as { value: unknown }).value);
  }
  throw new Error('Invalid data');
}
```
```typescript
// ❌ DON'T omit return types
function calculate(a: number, b: number) {
  return a + b;
}

// ✅ DO specify return types
function calculate(a: number, b: number): number {
  return a + b;
}
```

---

## ❌ Template Issues

### Arrow Functions in Templates
```typescript
// ❌ DON'T use arrow functions
<button (click)="items.filter(i => i.active).length">

// ✅ DO use component methods or computed
activeCount = computed(() => this.items().filter(i => i.active).length);
<button>{{ activeCount() }}</button>
```

### Globals in Templates
```typescript
// ❌ DON'T assume globals
<p>{{ new Date() }}</p>
<p>{{ Math.random() }}</p>

// ✅ DO use component properties
currentDate = signal(new Date());
randomValue = signal(Math.random());

<p>{{ currentDate() }}</p>
```

### ngClass / ngStyle
```typescript
// ❌ DON'T use ngClass/ngStyle
<div [ngClass]="{ 'active': isActive, 'disabled': isDisabled }">
<div [ngStyle]="{ 'width': width + 'px', 'height': height + 'px' }">

// ✅ DO use class/style bindings
<div 
  [class.active]="isActive()" 
  [class.disabled]="isDisabled()">
<div 
  [style.width.px]="width()" 
  [style.height.px]="height()">
```

---

## ❌ State Management Issues

### Direct DOM Manipulation
```typescript
// ❌ DON'T manipulate DOM directly
export class MyComponent {
  private el = inject(ElementRef);
  
  highlight(): void {
    this.el.nativeElement.style.background = 'yellow';
  }
}

// ✅ DO use Angular's binding system
export class MyComponent {
  isHighlighted = signal(false);
  
  // In template: [class.highlighted]="isHighlighted()"
  // In styles: .highlighted { background: yellow; }
}
```

### Not Using OnPush
```typescript
// ❌ DON'T omit OnPush (uses Default strategy)
@Component({
  selector: 'app-user-card'
})

// ✅ DO use OnPush
@Component({
  selector: 'app-user-card',
  changeDetection: ChangeDetectionStrategy.OnPush
})
```

### Mutable State
```typescript
// ❌ DON'T mutate signal arrays/objects
items = signal<Item[]>([]);
addItem(item: Item): void {
  this.items().push(item); // Mutates array!
}

// ✅ DO create new references
addItem(item: Item): void {
  this.items.update(current => [...current, item]);
}
```

---

## ❌ Accessibility Issues

### Non-Semantic HTML
```typescript
// ❌ DON'T use divs for interactive elements
<div (click)="delete()">Delete</div>
<span (click)="navigate()">Go to page</span>

// ✅ DO use semantic HTML
<button type="button" (click)="delete()">Delete</button>
<a [href]="pageUrl()" (click)="navigate($event)">Go to page</a>
```

### Missing ARIA Attributes
```typescript
// ❌ DON'T forget labels for screen readers
<button (click)="delete()">🗑️</button>

// ✅ DO add aria-label
<button 
  type="button"
  [attr.aria-label]="'Delete ' + item().name"
  (click)="delete()">
  <span aria-hidden="true">🗑️</span>
</button>
```

### Poor Keyboard Support
```typescript
// ❌ DON'T make elements non-keyboard-accessible
<div (click)="action()">Click me</div>

// ✅ DO ensure keyboard accessibility
<button 
  type="button"
  (click)="action()"
  (keydown.enter)="action()">
  Click me
</button>
```

---

## ❌ Service Issues

### Constructor Injection
```typescript
// ❌ DON'T use constructor injection
export class UserService {
  constructor(
    private http: HttpClient,
    private config: ConfigService
  ) {}
}

// ✅ DO use inject() function
export class UserService {
  private http = inject(HttpClient);
  private config = inject(ConfigService);
}
```

### Mixing Concerns
```typescript
// ❌ DON'T mix API calls with state management
@Injectable({ providedIn: 'root' })
export class UserService {
  private http = inject(HttpClient);
  users = signal<User[]>([]);
  
  loadUsers(): void {
    this.http.get<User[]>('/api/users').subscribe(users => {
      this.users.set(users);
      // Also doing validation, caching, notifications...
    });
  }
}

// ✅ DO separate concerns
@Injectable({ providedIn: 'root' })
export class UserApiService {
  private http = inject(HttpClient);
  getUsers(): Observable<User[]> {
    return this.http.get<User[]>('/api/users');
  }
}

@Injectable({ providedIn: 'root' })
export class UserStore {
  users = signal<User[]>([]);
  setUsers(users: User[]): void {
    this.users.set(users);
  }
}
```

---

## ❌ File Organization
```typescript
// ❌ DON'T organize by type
src/app/
├── components/
│   ├── user-list.component.ts
│   ├── user-card.component.ts
│   └── product-list.component.ts
├── services/
│   ├── user.service.ts
│   └── product.service.ts

// ✅ DO organize by feature
src/app/
├── features/
│   ├── users/
│   │   ├── user-list.component.ts
│   │   ├── user-card.component.ts
│   │   └── user.service.ts
│   └── products/
│       ├── product-list.component.ts
│       └── product.service.ts
```

---

## ❌ Testing Issues
```typescript
// ❌ DON'T test implementation details
it('should set isLoading to true', () => {
  component.loadUsers();
  expect(component['isLoading']).toBe(true);
});

// ✅ DO test user-facing behavior
it('should show loading spinner when loading users', async () => {
  component.loadUsers();
  const spinner = await screen.findByRole('status');
  expect(spinner).toBeInTheDocument();
});
```

---

## Summary

**Always remember:**
1. Use new Angular APIs (signals, inject, input/output)
2. Maintain type safety (no `any`, explicit return types)
3. Keep templates simple (no arrow functions, use computed)
4. Ensure accessibility (semantic HTML, ARIA, keyboard)
5. Use OnPush change detection
6. Separate concerns (API ≠ State ≠ UI)
7. Organize by feature, not by type

**When in doubt, check the specific guide for the correct pattern!**