export type AdminTab = 'agenda' | 'metrics' | 'barbers' | 'services';

export interface RescheduleModalState {
  isOpen: boolean;
  appointmentId: string;
  customerName: string;
  barberName: string;
  serviceName: string;
  currentDate: string;
  currentStartTime: string;
  currentEndTime: string;
}
