import { Injectable, inject, signal } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

export interface PageTitle {
  title: string;
  subtitle?: string;
}

/**
 * Service to manage dynamic page titles based on the current route.
 * Listens to router navigation events and updates the page title signal.
 */
@Injectable({
  providedIn: 'root'
})
export class PageTitleService {
  private readonly router = inject(Router);
  
  // Signal to hold the current page title information
  private readonly pageTitleSignal = signal<PageTitle>({
    title: 'Dashboard',
    subtitle: 'Real-time team activity'
  });
  
  // Public readonly accessor
  readonly pageTitle = this.pageTitleSignal.asReadonly();
  
  constructor() {
    this.initializeRouterListener();
  }
  
  /**
   * Initialize router listener to update page title on navigation
   */
  private initializeRouterListener(): void {
    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe(() => {
        this.updatePageTitleFromRoute();
      });
    
    // Set initial title
    this.updatePageTitleFromRoute();
  }
  
  /**
   * Update page title from current route data
   */
  private updatePageTitleFromRoute(): void {
    const route = this.getActivatedRoute();
    if (!route || !route.snapshot) {
      return;
    }
    
    const title = route.snapshot.data['title'] as string | undefined;
    const subtitle = route.snapshot.data['subtitle'] as string | undefined;
    
    if (title) {
      this.pageTitleSignal.set({
        title,
        subtitle
      });
    }
  }
  
  /**
   * Get the deepest activated route
   */
  private getActivatedRoute() {
    let route = this.router.routerState.root;
    while (route.firstChild) {
      route = route.firstChild;
    }
    return route;
  }
  
  /**
   * Manually set page title (for programmatic control)
   */
  setPageTitle(title: string, subtitle?: string): void {
    this.pageTitleSignal.set({ title, subtitle });
  }
}
