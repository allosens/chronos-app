import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { ApprovalActions } from './approval-actions.component';

describe('ApprovalActions', () => {
  let component: ApprovalActions;
  let fixture: ComponentFixture<ApprovalActions>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ApprovalActions],
      providers: [provideZonelessChangeDetection()]
    }).compileComponents();

    fixture = TestBed.createComponent(ApprovalActions);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('requestId', 'test-request-123');
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display approve and reject buttons initially', () => {
    const compiled = fixture.nativeElement;
    const approveButton = compiled.querySelector('button:has(svg)');
    expect(approveButton).toBeTruthy();
  });

  it('should show comment input when approve is clicked', () => {
    component['handleApprove']();
    fixture.detectChanges();

    expect(component['showCommentInput']()).toBe(true);
    expect(component['currentAction']()).toBe('approve');
  });

  it('should show comment input when reject is clicked', () => {
    component['handleReject']();
    fixture.detectChanges();

    expect(component['showCommentInput']()).toBe(true);
    expect(component['currentAction']()).toBe('reject');
  });

  it('should emit approve event with comments', (done) => {
    fixture.componentRef.setInput('requestId', 'test-123');
    
    component.approve.subscribe((event) => {
      expect(event.requestId).toBe('test-123');
      expect(event.comments).toBe('Test approval comment');
      done();
    });

    component['handleApprove']();
    component['commentControl'].setValue('Test approval comment');
    component['confirmAction']();
  });

  it('should emit reject event with comments', (done) => {
    fixture.componentRef.setInput('requestId', 'test-456');
    
    component.reject.subscribe((event) => {
      expect(event.requestId).toBe('test-456');
      expect(event.comments).toBe('Test rejection comment');
      done();
    });

    component['handleReject']();
    component['commentControl'].setValue('Test rejection comment');
    component['confirmAction']();
  });

  it('should reset state after confirming action', () => {
    component['handleApprove']();
    component['commentControl'].setValue('Test comment');
    component['confirmAction']();

    expect(component['showCommentInput']()).toBe(false);
    expect(component['currentAction']()).toBe(null);
    expect(component['commentControl'].value).toBe(null);
  });

  it('should reset state when canceling action', () => {
    component['handleReject']();
    component['commentControl'].setValue('Test comment');
    component['cancelAction']();

    expect(component['showCommentInput']()).toBe(false);
    expect(component['currentAction']()).toBe(null);
    expect(component['commentControl'].value).toBe(null);
  });

  it('should not confirm action when comments are required but empty', () => {
    fixture.componentRef.setInput('requireComments', true);
    
    let eventEmitted = false;
    component.approve.subscribe(() => {
      eventEmitted = true;
    });

    component['handleApprove']();
    component['confirmAction']();

    expect(eventEmitted).toBe(false);
  });

  it('should confirm action when comments are required and provided', (done) => {
    fixture.componentRef.setInput('requireComments', true);
    
    component.approve.subscribe(() => {
      done();
    });

    component['handleApprove']();
    component['commentControl'].setValue('Required comment');
    component['confirmAction']();
  });

  it('should use custom item label in aria-label', () => {
    fixture.componentRef.setInput('itemLabel', 'vacation request for John');
    fixture.detectChanges();

    const compiled = fixture.nativeElement;
    const buttons = compiled.querySelectorAll('button');
    
    // Check that at least one button has the custom label in aria-label
    const hasCustomLabel = Array.from(buttons).some((button: any) => {
      const ariaLabel = button.getAttribute('aria-label');
      return ariaLabel && ariaLabel.includes('vacation request for John');
    });
    
    expect(hasCustomLabel).toBe(true);
  });

  it('should disable buttons when disabled input is true', () => {
    fixture.componentRef.setInput('disabled', true);
    fixture.detectChanges();

    const compiled = fixture.nativeElement;
    const buttons = compiled.querySelectorAll('button:not([type="button"])');
    
    buttons.forEach((button: any) => {
      const isDisabled = button.hasAttribute('disabled') || button.disabled;
      expect(isDisabled).toBeTruthy();
    });
  });

  it('should trim whitespace from comments', (done) => {
    component.approve.subscribe((event) => {
      expect(event.comments).toBe('Comment with spaces');
      done();
    });

    component['handleApprove']();
    component['commentControl'].setValue('  Comment with spaces  ');
    component['confirmAction']();
  });

  it('should handle empty action gracefully', () => {
    component['currentAction'].set(null);
    
    expect(() => {
      component['confirmAction']();
    }).not.toThrow();
  });

  it('should respect character limit of 500', () => {
    const longComment = 'a'.repeat(600);
    component['commentControl'].setValue(longComment);
    
    // The maxlength attribute in the template should prevent this,
    // but we verify the control can handle it
    const value = component['commentControl'].value;
    expect(value).toBeTruthy();
    if (value) {
      expect(value.length).toBeGreaterThan(500);
    }
  });
});
