import { Component, inject, input, output, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VacationManagementService } from '../../services/vacation-management.service';
import { VacationRequest } from '../../models/vacation-request.model';
import { ApprovalActions } from '../../../../shared/components/approval-actions.component';
import { DateUtils } from '../../../../shared/utils/date.utils';

@Component({
  selector: 'app-vacation-approval',
  standalone: true,
  imports: [CommonModule, ApprovalActions],
  templateUrl: './vacation-approval.component.html',
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class VacationApproval {
  private managementService = inject(VacationManagementService);

  // Inputs
  request = input.required<VacationRequest>();
  
  // Outputs
  approved = output<{ requestId: string; comments?: string }>();
  rejected = output<{ requestId: string; comments?: string }>();

  // Computed values
  protected conflicts = computed(() => 
    this.managementService.getConflicts(this.request().id)
  );

  protected availabilityCheck = computed(() => 
    this.managementService.validateTeamAvailability(this.request().id)
  );

  protected handleApprove(event: { requestId: string; comments?: string }): void {
    this.approved.emit(event);
  }

  protected handleReject(event: { requestId: string; comments?: string }): void {
    this.rejected.emit(event);
  }

  protected formatDate(date: Date): string {
    return DateUtils.formatDate(date, 'medium');
  }

  protected getRelativeTime(date: Date): string {
    return DateUtils.getRelativeTime(date);
  }

  protected getTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      vacation: 'Vacation',
      personal_day: 'Personal Day',
      sick_leave: 'Sick Leave',
      compensatory_time: 'Compensatory Time',
      other: 'Other'
    };
    return labels[type] || type;
  }
}
