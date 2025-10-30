import { useMemo } from 'react';
import { Event, EventStatus } from '@/types/event';
import { User, UserRole } from '@/types/auth';
import { usePermissions } from './usePermissions';

export type ViewMode = 'all' | 'myEvents' | 'coachEvents' | 'past';
export type StatusFilterType = EventStatus | 'needsMentors' | null;

interface UseEventFiltersProps {
  events: Event[] | null;
  viewMode: ViewMode;
  statusFilter: StatusFilterType;
  user: User | null;
  search?: string;
  sortBy?: keyof Event;
  sortDirection?: "asc" | "desc";
}

export const useEventFilters = ({
  events,
  viewMode,
  statusFilter,
  user,
  search = '',
  sortBy = 'date',
  sortDirection = 'desc'
}: UseEventFiltersProps) => {
  const { canMentorViewEvent } = usePermissions();

  return useMemo(() => {
    const parseEventDate = (event: Event) => new Date(`${event.date}T${event.time ?? '00:00'}`);

    const compareValues = (aValue: unknown, bValue: unknown): number => {
      if (aValue instanceof Date && bValue instanceof Date) {
        return aValue.getTime() - bValue.getTime();
      }

      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return aValue - bValue;
      }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return aValue.localeCompare(bValue, undefined, { sensitivity: 'base' });
      }

      return String(aValue ?? '').localeCompare(String(bValue ?? ''), undefined, { sensitivity: 'base' });
    };

    if (!events) return { filteredEvents: [], upcomingEvents: [], pastEvents: [] };
    
    // First filter the events
    let filteredEvents = events.filter(event => {
      // Base filters
      const matchesSearch = !search || 
        event.company.toLowerCase().includes(search.toLowerCase()) ||
        event.description?.toLowerCase().includes(search.toLowerCase());

      // Status filtering
      let matchesStatus = true;
      if (statusFilter) {
        if (statusFilter === 'needsMentors') {
          matchesStatus = 
            ['new', 'firstRequests', 'successPartly'].includes(event.status) &&
            (event.acceptedMentors?.length || 0) < event.amount_requiredmentors;
        } else {
          matchesStatus = event.status === statusFilter;
        }
      }

      // View mode specific filtering
      if (viewMode === 'myEvents' && user?.role === UserRole.MENTOR) {
        return (
          matchesSearch && 
          matchesStatus &&
          (event.acceptedMentors?.includes(user.id) || 
           event.requestingMentors?.includes(user.id) ||
           event.declinedMentors?.includes(user.id))
        );
      }

      if (viewMode === 'coachEvents') {
        return matchesSearch && matchesStatus && event.staff_members?.includes(user.id);
      }

      if (viewMode === 'past') {
        const eventDate = new Date(event.date);
        return matchesSearch && matchesStatus && eventDate < new Date();
      }

      // Default view (all)
      if (viewMode === 'all' && user?.role === UserRole.MENTOR) {
        if (!canMentorViewEvent({ initial_selected_mentors: event.initial_selected_mentors || [], })) return false;
      }
      return matchesSearch && matchesStatus;
    });
    
    // Sort the filtered results
    filteredEvents = [...filteredEvents].sort((a, b) => {
      let aValue: unknown = a[sortBy];
      let bValue: unknown = b[sortBy];

      if (sortBy === 'primaryStaffName') {
        aValue = a.primaryStaffName ?? '';
        bValue = b.primaryStaffName ?? '';
      } else if (sortBy === 'date') {
        aValue = parseEventDate(a);
        bValue = parseEventDate(b);
      }

      const comparison = compareValues(aValue, bValue);
      return sortDirection === 'asc' ? comparison : -comparison;
    });

    // Split into upcoming and past events
    const now = new Date();
    let upcomingEvents = filteredEvents.filter(event => parseEventDate(event) >= now);
    let pastEvents = filteredEvents.filter(event => parseEventDate(event) < now);

    const sortByDate = (list: Event[]) =>
      [...list].sort((eventA, eventB) => {
        const dateA = parseEventDate(eventA);
        const dateB = parseEventDate(eventB);
        const comparison = dateA.getTime() - dateB.getTime();
        return sortDirection === 'asc' ? comparison : -comparison;
      });

    upcomingEvents = sortByDate(upcomingEvents);
    pastEvents = sortByDate(pastEvents);

    return {
      filteredEvents,
      upcomingEvents,
      pastEvents
    };
  }, [
    events,
    viewMode,
    statusFilter,
    user?.id,
    user?.role,
    search,
    sortBy,
    sortDirection,
    canMentorViewEvent
  ]);
};