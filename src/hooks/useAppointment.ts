import { useState } from 'react';
import type { Appointment } from '@/types/domain';

export interface AppointmentResult {
  valid: boolean;
  reason?: string;
  appointment?: Appointment;
}

export interface BookingDetails {
  locationId?: string;
  serviceId?: string;
  customerName?: string;
  date?: string;
}

export function useAppointment() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validate = async (
    barberId: string,
    startTime: string,
    endTime: string,
    details?: BookingDetails
  ): Promise<AppointmentResult | null> => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          barberId,
          startTime,
          endTime,
          date: details?.date,
          locationId: details?.locationId,
          serviceId: details?.serviceId,
          customerName: details?.customerName,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        setError(err.error || 'Server error');
        return null;
      }
      return await res.json();
    } catch {
      setError('Network error');
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { validate, loading, error };
}
