import { Component, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl } from '@angular/forms';

@Component({
  selector: 'app-approval-actions',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './approval-actions.component.html',
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class ApprovalActions {
  // Inputs
  requestId = input.required<string>();
  itemLabel = input<string>('request');
  disabled = input<boolean>(false);
  requireComments = input<boolean>(false);

  // Outputs
  approve = output<{ requestId: string; comments?: string }>();
  reject = output<{ requestId: string; comments?: string }>();

  // Component state
  protected showCommentInput = signal(false);
  protected currentAction = signal<'approve' | 'reject' | null>(null);
  protected commentControl = new FormControl('');

  protected handleApprove(): void {
    this.currentAction.set('approve');
    this.showCommentInput.set(true);
    this.commentControl.reset();
  }

  protected handleReject(): void {
    this.currentAction.set('reject');
    this.showCommentInput.set(true);
    this.commentControl.reset();
  }

  protected confirmAction(): void {
    const action = this.currentAction();
    if (!action) return;

    if (this.requireComments() && !this.commentControl.value?.trim()) {
      return;
    }

    const comments = this.commentControl.value?.trim();

    if (action === 'approve') {
      this.approve.emit({ requestId: this.requestId(), comments });
    } else {
      this.reject.emit({ requestId: this.requestId(), comments });
    }

    this.resetState();
  }

  protected cancelAction(): void {
    this.resetState();
  }

  private resetState(): void {
    this.showCommentInput.set(false);
    this.currentAction.set(null);
    this.commentControl.reset();
  }
}
