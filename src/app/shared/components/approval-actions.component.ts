import { Component, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl } from '@angular/forms';

@Component({
  selector: 'app-approval-actions',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="flex flex-col gap-3">
      @if (!showCommentInput()) {
        <div class="flex gap-2">
          <button
            type="button"
            (click)="handleApprove()"
            [disabled]="disabled()"
            class="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-2 px-4 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
            [attr.aria-label]="'Approve ' + itemLabel()"
          >
            <span class="flex items-center justify-center gap-2">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
              </svg>
              Approve
            </span>
          </button>
          <button
            type="button"
            (click)="handleReject()"
            [disabled]="disabled()"
            class="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-2 px-4 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            [attr.aria-label]="'Reject ' + itemLabel()"
          >
            <span class="flex items-center justify-center gap-2">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
              Reject
            </span>
          </button>
        </div>
      }

      @if (showCommentInput()) {
        <div class="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <label 
            [for]="'comment-' + requestId()"
            class="block text-sm font-medium text-gray-700 mb-2"
          >
            {{ currentAction() === 'approve' ? 'Approval' : 'Rejection' }} Comments
            @if (requireComments()) {
              <span class="text-red-500">*</span>
            }
          </label>
          <textarea
            [id]="'comment-' + requestId()"
            [formControl]="commentControl"
            rows="3"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
            [placeholder]="'Add comments about this ' + currentAction() + '...'"
            maxlength="500"
            [attr.aria-required]="requireComments()"
            [attr.aria-label]="currentAction() + ' comments for ' + itemLabel()"
          ></textarea>
          <div class="mt-1 text-xs text-gray-500 text-right">
            {{ commentControl.value?.length || 0 }}/500
          </div>

          <div class="flex gap-2 mt-3">
            <button
              type="button"
              (click)="confirmAction()"
              [disabled]="requireComments() && !commentControl.value?.trim()"
              class="flex-1 font-semibold py-2 px-4 rounded-lg text-white transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2"
              [class.bg-emerald-600]="currentAction() === 'approve'"
              [class.hover:bg-emerald-700]="currentAction() === 'approve'"
              [class.focus:ring-emerald-500]="currentAction() === 'approve'"
              [class.bg-red-600]="currentAction() === 'reject'"
              [class.hover:bg-red-700]="currentAction() === 'reject'"
              [class.focus:ring-red-500]="currentAction() === 'reject'"
              [class.bg-gray-300]="requireComments() && !commentControl.value?.trim()"
              [class.cursor-not-allowed]="requireComments() && !commentControl.value?.trim()"
              [attr.aria-label]="'Confirm ' + currentAction() + ' for ' + itemLabel()"
            >
              Confirm {{ currentAction() === 'approve' ? 'Approval' : 'Rejection' }}
            </button>
            <button
              type="button"
              (click)="cancelAction()"
              class="px-4 py-2 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
              aria-label="Cancel action"
            >
              Cancel
            </button>
          </div>
        </div>
      }
    </div>
  `,
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
