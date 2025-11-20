import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { Router, NavigationEnd, provideRouter } from '@angular/router';
import { Component } from '@angular/core';
import { PageTitleService } from './page-title.service';
import { Subject } from 'rxjs';

// Test components for routing
@Component({ template: 'Dashboard', imports: [] })
class DashboardComponent {}

@Component({ template: 'Time Tracking', imports: [] })
class TimeTrackingComponent {}

@Component({ template: 'History', imports: [] })
class HistoryComponent {}

describe('PageTitleService', () => {
  let service: PageTitleService;
  let router: Router;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([
          { 
            path: 'dashboard', 
            component: DashboardComponent,
            data: { title: 'Dashboard', subtitle: 'Overview of your team' }
          },
          { 
            path: 'time-tracking', 
            component: TimeTrackingComponent,
            data: { title: 'Time Tracking', subtitle: 'Log your work hours' }
          },
          { 
            path: 'history', 
            component: HistoryComponent,
            data: { title: 'History' }
          },
          { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
        ])
      ]
    });
    
    service = TestBed.inject(PageTitleService);
    router = TestBed.inject(Router);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should have default page title', () => {
    expect(service.pageTitle()).toBeTruthy();
    expect(service.pageTitle().title).toBeTruthy();
  });

  it('should update page title when navigating to route with title data', async () => {
    await router.navigate(['/dashboard']);
    
    expect(service.pageTitle().title).toBe('Dashboard');
    expect(service.pageTitle().subtitle).toBe('Overview of your team');
  });

  it('should update page title when navigating to route with only title', async () => {
    await router.navigate(['/history']);
    
    expect(service.pageTitle().title).toBe('History');
    expect(service.pageTitle().subtitle).toBeUndefined();
  });

  it('should update page title on multiple navigations', async () => {
    await router.navigate(['/dashboard']);
    expect(service.pageTitle().title).toBe('Dashboard');
    
    await router.navigate(['/time-tracking']);
    expect(service.pageTitle().title).toBe('Time Tracking');
    expect(service.pageTitle().subtitle).toBe('Log your work hours');
    
    await router.navigate(['/history']);
    expect(service.pageTitle().title).toBe('History');
  });

  it('should allow manual setting of page title', () => {
    service.setPageTitle('Custom Title', 'Custom Subtitle');
    
    expect(service.pageTitle().title).toBe('Custom Title');
    expect(service.pageTitle().subtitle).toBe('Custom Subtitle');
  });

  it('should allow manual setting of page title without subtitle', () => {
    service.setPageTitle('Custom Title');
    
    expect(service.pageTitle().title).toBe('Custom Title');
    expect(service.pageTitle().subtitle).toBeUndefined();
  });

  it('should expose readonly pageTitle signal', () => {
    const pageTitle = service.pageTitle;
    expect(pageTitle).toBeTruthy();
    expect(typeof pageTitle).toBe('function'); // Signals are functions
  });
});
