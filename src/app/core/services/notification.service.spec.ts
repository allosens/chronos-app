import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { NotificationService, Notification } from './notification.service';

describe('NotificationService', () => {
  let service: NotificationService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        NotificationService
      ]
    });
    service = TestBed.inject(NotificationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('success', () => {
    it('should add a success notification', () => {
      service.success('Test success message');
      
      const notifications = service.notifications();
      expect(notifications.length).toBe(1);
      expect(notifications[0].type).toBe('success');
      expect(notifications[0].message).toBe('Test success message');
    });

    it('should auto-remove notification after duration', (done) => {
      service.success('Test message', 100);
      expect(service.notifications().length).toBe(1);

      setTimeout(() => {
        expect(service.notifications().length).toBe(0);
        done();
      }, 150);
    });
  });

  describe('error', () => {
    it('should add an error notification', () => {
      service.error('Test error message');
      
      const notifications = service.notifications();
      expect(notifications.length).toBe(1);
      expect(notifications[0].type).toBe('error');
      expect(notifications[0].message).toBe('Test error message');
    });
  });

  describe('info', () => {
    it('should add an info notification', () => {
      service.info('Test info message');
      
      const notifications = service.notifications();
      expect(notifications.length).toBe(1);
      expect(notifications[0].type).toBe('info');
      expect(notifications[0].message).toBe('Test info message');
    });
  });

  describe('warning', () => {
    it('should add a warning notification', () => {
      service.warning('Test warning message');
      
      const notifications = service.notifications();
      expect(notifications.length).toBe(1);
      expect(notifications[0].type).toBe('warning');
      expect(notifications[0].message).toBe('Test warning message');
    });
  });

  describe('remove', () => {
    it('should remove a specific notification', () => {
      service.success('Message 1');
      service.error('Message 2');
      
      const notifications = service.notifications();
      expect(notifications.length).toBe(2);
      
      service.remove(notifications[0].id);
      
      expect(service.notifications().length).toBe(1);
      expect(service.notifications()[0].message).toBe('Message 2');
    });
  });

  describe('clearAll', () => {
    it('should clear all notifications', () => {
      service.success('Message 1');
      service.error('Message 2');
      service.info('Message 3');
      
      expect(service.notifications().length).toBe(3);
      
      service.clearAll();
      
      expect(service.notifications().length).toBe(0);
    });
  });

  describe('multiple notifications', () => {
    it('should handle multiple notifications', () => {
      service.success('Success 1');
      service.success('Success 2');
      service.error('Error 1');
      
      const notifications = service.notifications();
      expect(notifications.length).toBe(3);
      
      const successCount = notifications.filter(n => n.type === 'success').length;
      const errorCount = notifications.filter(n => n.type === 'error').length;
      
      expect(successCount).toBe(2);
      expect(errorCount).toBe(1);
    });
  });
});
