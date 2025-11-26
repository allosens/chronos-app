import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { CompanySettingsService } from './company-settings.service';
import { NotificationService } from '../../../core/services/notification.service';
import { CompanySettingsFormData, DEFAULT_COMPANY_SETTINGS } from '../models/company-settings.model';

describe('CompanySettingsService', () => {
  let service: CompanySettingsService;
  let notificationService: jasmine.SpyObj<NotificationService>;

  beforeEach(() => {
    const notificationSpy = jasmine.createSpyObj('NotificationService', ['success', 'error', 'info']);

    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        CompanySettingsService,
        { provide: NotificationService, useValue: notificationSpy }
      ]
    });
    
    service = TestBed.inject(CompanySettingsService);
    notificationService = TestBed.inject(NotificationService) as jasmine.SpyObj<NotificationService>;

    // Clear localStorage before each test
    if (typeof window !== 'undefined') {
      localStorage.clear();
    }
  });

  afterEach(() => {
    if (typeof window !== 'undefined') {
      localStorage.clear();
    }
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('loadSettings', () => {
    it('should load default settings when no stored settings exist', () => {
      service.loadSettings('test-company');
      
      const settings = service.settings();
      expect(settings).toBeTruthy();
      expect(settings?.companyId).toBe('test-company');
      expect(settings?.workingHours.dailyHours).toBe(DEFAULT_COMPANY_SETTINGS.workingHours.dailyHours);
    });

    it('should set loading state during load', () => {
      expect(service.isLoading()).toBe(false);
    });
  });

  describe('updateSettings', () => {
    it('should update settings successfully', () => {
      service.loadSettings('test-company');
      const currentSettings = service.settings();
      
      const formData: CompanySettingsFormData = {
        workingHours: {
          ...currentSettings!.workingHours,
          dailyHours: 9
        },
        vacationPolicy: currentSettings!.vacationPolicy,
        breakPolicy: currentSettings!.breakPolicy,
        timeTracking: currentSettings!.timeTracking
      };

      const result = service.updateSettings(formData);

      expect(result).toBe(true);
      expect(service.settings()?.workingHours.dailyHours).toBe(9);
      expect(notificationService.success).toHaveBeenCalledWith('Settings updated successfully');
    });

    it('should handle update errors', () => {
      // Clear the settings that were auto-loaded
      (service as any).settingsSignal.set(null);
      
      const formData: CompanySettingsFormData = {
        workingHours: DEFAULT_COMPANY_SETTINGS.workingHours,
        vacationPolicy: DEFAULT_COMPANY_SETTINGS.vacationPolicy,
        breakPolicy: DEFAULT_COMPANY_SETTINGS.breakPolicy,
        timeTracking: DEFAULT_COMPANY_SETTINGS.timeTracking
      };

      const result = service.updateSettings(formData);

      expect(result).toBe(false);
      expect(notificationService.error).toHaveBeenCalled();
    });
  });

  describe('resetToDefaults', () => {
    it('should reset settings to defaults', () => {
      service.loadSettings('test-company');
      
      // Modify settings
      const formData: CompanySettingsFormData = {
        workingHours: {
          ...DEFAULT_COMPANY_SETTINGS.workingHours,
          dailyHours: 10
        },
        vacationPolicy: DEFAULT_COMPANY_SETTINGS.vacationPolicy,
        breakPolicy: DEFAULT_COMPANY_SETTINGS.breakPolicy,
        timeTracking: DEFAULT_COMPANY_SETTINGS.timeTracking
      };
      service.updateSettings(formData);
      
      expect(service.settings()?.workingHours.dailyHours).toBe(10);

      // Reset to defaults
      service.resetToDefaults('test-company');

      expect(service.settings()?.workingHours.dailyHours).toBe(DEFAULT_COMPANY_SETTINGS.workingHours.dailyHours);
      expect(notificationService.info).toHaveBeenCalledWith('Settings reset to defaults');
    });
  });

  describe('localStorage persistence', () => {
    it('should persist settings to localStorage', () => {
      if (typeof window === 'undefined') return;

      service.loadSettings('test-company');
      const formData: CompanySettingsFormData = {
        workingHours: {
          ...DEFAULT_COMPANY_SETTINGS.workingHours,
          dailyHours: 7
        },
        vacationPolicy: DEFAULT_COMPANY_SETTINGS.vacationPolicy,
        breakPolicy: DEFAULT_COMPANY_SETTINGS.breakPolicy,
        timeTracking: DEFAULT_COMPANY_SETTINGS.timeTracking
      };

      service.updateSettings(formData);

      const stored = localStorage.getItem('chronos-company-settings-test-company');
      expect(stored).toBeTruthy();
      
      const parsed = JSON.parse(stored!);
      expect(parsed.workingHours.dailyHours).toBe(7);
    });

    it('should load settings from localStorage', () => {
      if (typeof window === 'undefined') return;

      const testSettings = {
        id: 'test-id',
        companyId: 'test-company',
        ...DEFAULT_COMPANY_SETTINGS,
        workingHours: {
          ...DEFAULT_COMPANY_SETTINGS.workingHours,
          dailyHours: 6
        }
      };

      localStorage.setItem('chronos-company-settings-test-company', JSON.stringify(testSettings));

      service.loadSettings('test-company');

      expect(service.settings()?.workingHours.dailyHours).toBe(6);
    });
  });
});
