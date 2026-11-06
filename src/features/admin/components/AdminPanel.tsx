'use client';

import { useEffect, useState } from 'react';
import type { Appointment, Barber, Location, Service } from '@/types/domain';
import { useTodayIsoDate } from '@/hooks/useTodayIsoDate';
import { LOCATIONS } from '@/features/booking/constants';
import AdminHeader from './AdminHeader';
import AgendaTab from './AgendaTab';
import MetricsTab from './MetricsTab';
import BarbersTab from './BarbersTab';
import ServicesTab from './ServicesTab';
import type { AdminTab } from '../types';

export default function AdminPanel() {
  const today = useTodayIsoDate();
  const [locations, setLocations] = useState<Location[]>(() => [...LOCATIONS]);
  const [selectedLocationId, setSelectedLocationId] = useState(LOCATIONS[0].id);
  const [pickedDate, setPickedDate] = useState('');
  const activeDate = pickedDate || today;

  const [activeTab, setActiveTab] = useState<AdminTab>('agenda');
  const [selectedBarberId, setSelectedBarberId] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch data cleanly on mount and whenever branch, date or refreshKey changes
  useEffect(() => {
    let isMounted = true;
    if (!activeDate) return;

    async function loadData() {
      try {
        const [aptRes, barberRes, serviceRes, locRes] = await Promise.all([
          fetch(`/api/appointments?locationId=${selectedLocationId}&date=${activeDate}`),
          fetch(`/api/barbers?locationId=${selectedLocationId}`),
          fetch('/api/services'),
          fetch('/api/locations'),
        ]);

        if (!isMounted) return;

        if (aptRes.ok) {
          const data = await aptRes.json();
          setAppointments(data.appointments || []);
        }
        if (barberRes.ok) {
          const data = await barberRes.json();
          setBarbers(data.barbers || []);
        }
        if (serviceRes.ok) {
          const data = await serviceRes.json();
          setServices(data.services || []);
        }
        if (locRes.ok) {
          const locData = await locRes.json();
          if (locData.locations?.length > 0) {
            setLocations(locData.locations);
          }
        }
      } catch (err) {
        console.error('Error fetching admin data:', err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, [selectedLocationId, activeDate, refreshKey]);

  function handleRefresh() {
    setRefreshKey((k) => k + 1);
  }

  const currentLocation = locations.find((l) => l.id === selectedLocationId) || locations[0] || LOCATIONS[0];

  return (
    <div className="space-y-8 animate-fade-up">
      {/* Admin Top Controls & Tabs */}
      <AdminHeader
        selectedLocationId={selectedLocationId}
        onSelectLocationId={(id) => {
          setSelectedLocationId(id);
          setSelectedBarberId(''); // Reset barber filter when branch changes
        }}
        locations={locations}
        selectedDate={activeDate}
        onSelectDate={setPickedDate}
        todayIsoDate={today}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        totalAppointments={appointments.length}
      />

      {/* Main Content Area */}
      {loading ? (
        <div className="card p-12 text-center border-line">
          <div className="size-8 mx-auto mb-3 animate-spin rounded-full border-2 border-night border-t-gold" />
          <p className="text-sm text-muted">Cargando datos de la sede...</p>
        </div>
      ) : (
        <div>
          {activeTab === 'agenda' && (
            <AgendaTab
              appointments={appointments}
              barbers={barbers}
              services={services}
              selectedBarberId={selectedBarberId}
              onSelectBarberId={setSelectedBarberId}
              onRefresh={handleRefresh}
            />
          )}

          {activeTab === 'metrics' && (
            <MetricsTab
              appointments={appointments}
              barbers={barbers}
              services={services}
              locationName={currentLocation.name}
            />
          )}

          {activeTab === 'barbers' && (
            <BarbersTab
              barbers={barbers}
              locationId={selectedLocationId}
              locations={locations}
              onRefresh={handleRefresh}
            />
          )}

          {activeTab === 'services' && (
            <ServicesTab
              services={services}
              onRefresh={handleRefresh}
            />
          )}
        </div>
      )}
    </div>
  );
}
