import { Injectable, signal, inject } from '@angular/core';
import { 
  CompanySettings, 
  CompanySettingsFormData,
  DEFAULT_COMPANY_SETTINGS 
} from '../models/company-settings.model';
import { NotificationService } from '../../../core/services/notification.service';

@Injectable({
  providedIn: 'root'
})
export class CompanySettingsService {
  private notificationService = inject(NotificationService);
  
  private settingsSignal = signal<CompanySettings | null>(null);
  private loadingSignal = signal<boolean>(false);
  private errorSignal = signal<string | null>(null);

  readonly settings = this.settingsSignal.asReadonly();
  readonly isLoading = this.loadingSignal.asReadonly();
  readonly error = this.errorSignal.asReadonly();

  constructor() {
    this.loadSettings();
  }

  /**
   * Load company settings for the current company
   */
  loadSettings(companyId?: string): void {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    try {
      // In a real app, this would be an HTTP call
      // For now, load from localStorage or use defaults
      const stored = this.getStoredSettings(companyId);
      this.settingsSignal.set(stored);
    } catch (error) {
      const errorMessage = 'Failed to load company settings';
      this.errorSignal.set(errorMessage);
      this.notificationService.error(errorMessage);
    } finally {
      this.loadingSignal.set(false);
    }
  }

  /**
   * Update company settings
   */
  updateSettings(formData: CompanySettingsFormData): boolean {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    try {
      const currentSettings = this.settingsSignal();
      
      if (!currentSettings) {
        throw new Error('No settings loaded');
      }

      // Simulate API call - in real app this would be HTTP request
      // For now, we'll simulate a delay
      const updatedSettings: CompanySettings = {
        ...currentSettings,
        workingHours: formData.workingHours,
        vacationPolicy: formData.vacationPolicy,
        breakPolicy: formData.breakPolicy,
        timeTracking: formData.timeTracking,
        updatedAt: new Date()
      };

      // Save to localStorage (simulating backend persistence)
      this.saveToLocalStorage(updatedSettings);
      
      this.settingsSignal.set(updatedSettings);
      this.notificationService.success('Settings updated successfully');
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update settings';
      this.errorSignal.set(errorMessage);
      this.notificationService.error(errorMessage);
      return false;
    } finally {
      this.loadingSignal.set(false);
    }
  }

  /**
   * Reset settings to defaults
   */
  resetToDefaults(companyId: string): void {
    const defaultSettings: CompanySettings = {
      id: this.generateId(),
      companyId,
      ...DEFAULT_COMPANY_SETTINGS,
      updatedAt: new Date()
    };

    this.settingsSignal.set(defaultSettings);
    this.saveToLocalStorage(defaultSettings);
    this.notificationService.info('Settings reset to defaults');
  }

  private getStoredSettings(companyId?: string): CompanySettings {
    if (typeof window === 'undefined') {
      // SSR - return defaults
      return this.createDefaultSettings(companyId || 'default');
    }

    const key = `chronos-company-settings-${companyId || 'default'}`;
    const stored = localStorage.getItem(key);

    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        return {
          ...parsed,
          updatedAt: parsed.updatedAt ? new Date(parsed.updatedAt) : undefined
        };
      } catch (error) {
        console.error('Error parsing stored settings:', error);
      }
    }

    // No stored settings, create defaults
    const defaultSettings = this.createDefaultSettings(companyId || 'default');
    this.saveToLocalStorage(defaultSettings);
    return defaultSettings;
  }

  private saveToLocalStorage(settings: CompanySettings): void {
    if (typeof window === 'undefined') return;

    const key = `chronos-company-settings-${settings.companyId}`;
    const toStore = {
      ...settings,
      updatedAt: settings.updatedAt?.toISOString()
    };
    localStorage.setItem(key, JSON.stringify(toStore));
  }

  private createDefaultSettings(companyId: string): CompanySettings {
    return {
      id: this.generateId(),
      companyId,
      ...DEFAULT_COMPANY_SETTINGS
    };
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  }
}
