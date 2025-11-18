# Angular Services Guide

## Service Structure
```typescript
import { Injectable, signal, computed } from '@angular/core';
import { inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class UserStore {
  // 1. Dependencies (using inject())
  private http = inject(HttpClient);
  private router = inject(Router);
  
  // 2. Private state (signals)
  private users = signal<User[]>([]);
  private loading = signal(false);
  private error = signal<string | null>(null);
  
  // 3. Public selectors (readonly)
  readonly allUsers = this.users.asReadonly();
  readonly isLoading = this.loading.asReadonly();
  readonly error$ = this.error.asReadonly();
  
  // 4. Computed values
  readonly activeUsers = computed(() => 
    this.users().filter(u => u.isActive)
  );
  readonly userCount = computed(() => this.users().length);
  
  // 5. Public methods (actions)
  loadUsers(): void {
    this.loading.set(true);
    this.error.set(null);
    
    this.http.get<User[]>('/api/users').subscribe({
      next: users => {
        this.users.set(users);
        this.loading.set(false);
      },
      error: err => {
        this.error.set(err.message);
        this.loading.set(false);
      }
    });
  }
  
  addUser(user: User): void {
    this.users.update(current => [...current, user]);
  }
  
  deleteUser(id: string): void {
    this.users.update(current => current.filter(u => u.id !== id));
  }
}
```

## Service Principles

1. **Single Responsibility**: Each service should have one clear purpose
2. **Singleton by Default**: Use `providedIn: 'root'`
3. **Use inject()**: Instead of constructor injection
4. **Stateless or State Manager**: Either pure utility or explicit state management
5. **Expose readonly state**: Don't expose signals directly, use `.asReadonly()`

## Dependency Injection

### ✅ Correct Way (inject function)
```typescript
export class UserService {
  private http = inject(HttpClient);
  private config = inject(ConfigService);
  
  // Optional injection
  private logger = inject(LoggerService, { optional: true });
}
```

### ❌ Old Way (Don't use)
```typescript
export class UserService {
  constructor(
    private http: HttpClient,
    private config: ConfigService
  ) {}
}
```

## Service Types

### 1. Stateless Utility Service
```typescript
@Injectable({ providedIn: 'root' })
export class DateFormatter {
  formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }
  
  isWeekend(date: Date): boolean {
    const day = date.getDay();
    return day === 0 || day === 6;
  }
}
```

### 2. State Management Service
```typescript
@Injectable({ providedIn: 'root' })
export class CartStore {
  private items = signal<CartItem[]>([]);
  
  readonly items$ = this.items.asReadonly();
  readonly total = computed(() => 
    this.items().reduce((sum, item) => sum + item.price, 0)
  );
  
  addItem(item: CartItem): void {
    this.items.update(current => [...current, item]);
  }
}
```

### 3. API Service
```typescript
@Injectable({ providedIn: 'root' })
export class UserApiService {
  private http = inject(HttpClient);
  private baseUrl = '/api/users';
  
  getUsers(): Observable<User[]> {
    return this.http.get<User[]>(this.baseUrl);
  }
  
  getUser(id: string): Observable<User> {
    return this.http.get<User>(`${this.baseUrl}/${id}`);
  }
  
  createUser(user: Omit<User, 'id'>): Observable<User> {
    return this.http.post<User>(this.baseUrl, user);
  }
}
```

## Providing Services

### Application-wide (Singleton)
```typescript
@Injectable({ providedIn: 'root' })
export class AuthService {}
```

### Feature-specific
```typescript
@Injectable() // No providedIn
export class FeatureService {}

// Provide in route
export const routes: Route[] = [
  {
    path: 'feature',
    providers: [FeatureService],
    loadComponent: () => import('./feature.component')
  }
];
```

### Component-level
```typescript
@Component({
  providers: [LocalService] // New instance per component
})
export class MyComponent {}
```

## Best Practices

### ✅ Do
- Keep services focused on a single responsibility
- Use `inject()` for dependency injection
- Expose readonly state from state management services
- Use signals for reactive state
- Return Observables for async operations (HTTP calls)
- Use explicit return types

### ❌ Don't
- Mix state management with API calls in the same service
- Expose mutable signals directly
- Use constructor injection (use `inject()` instead)
- Create deep dependency trees
- Use services for business logic that belongs in components

## Facade Pattern

For complex features, use a facade service:
```typescript
// user.facade.ts
@Injectable({ providedIn: 'root' })
export class UserFacade {
  private store = inject(UserStore);
  private api = inject(UserApiService);
  private notifier = inject(NotificationService);
  
  // Expose store selectors
  readonly users$ = this.store.allUsers;
  readonly loading$ = this.store.isLoading;
  
  // Coordinate multiple services
  loadUsers(): void {
    this.api.getUsers().subscribe({
      next: users => {
        this.store.setUsers(users);
        this.notifier.success('Users loaded');
      },
      error: err => {
        this.notifier.error('Failed to load users');
      }
    });
  }
}
```

## Testing Services
```typescript
import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

describe('UserApiService', () => {
  let service: UserApiService;
  let httpMock: HttpTestingController;
  
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        UserApiService,
        provideHttpClientTesting()
      ]
    });
    
    service = TestBed.inject(UserApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });
  
  it('should fetch users', () => {
    const mockUsers = [{ id: '1', name: 'John' }];
    
    service.getUsers().subscribe(users => {
      expect(users).toEqual(mockUsers);
    });
    
    const req = httpMock.expectOne('/api/users');
    req.flush(mockUsers);
  });
});
```

## See Also
- [State Management](state-management.md)
- [Service Template](../examples/service-template.md)