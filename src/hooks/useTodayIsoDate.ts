import { useSyncExternalStore } from 'react';
import { getTodayIsoDate } from '@/utils/time';

function subscribe() {
  return () => {};
}

function getServerSnapshot() {
  return '';
}

export function useTodayIsoDate(): string {
  return useSyncExternalStore(subscribe, getTodayIsoDate, getServerSnapshot);
}
