import { useState, useEffect } from 'react';
import { Event } from "@/types/event";
import { User, UserRole } from '@/types/auth';

export const useEventAcceptance = (user: User | null, events: Event[] | null) => {
  const [newAcceptedEventIds, setNewAcceptedEventIds] = useState<string[]>([]);

  
  useEffect(() => {
    if (!user || user.role !== UserRole.MENTOR || !events) {
      setNewAcceptedEventIds([]);
      return;
    }

    const storageKey = `acceptedEvents_${user.id}`;
    const storedIds = localStorage.getItem(storageKey);
    let previouslyAcceptedEventIds: string[] = [];

    if (storedIds) {
      try {
        const parsed = JSON.parse(storedIds);
        if (Array.isArray(parsed)) {
          previouslyAcceptedEventIds = parsed.filter((id): id is string => typeof id === 'string');
        }
      } catch (error) {
        console.warn('[useEventAcceptance] Failed to parse stored event ids', error);
      }
    }
    
    // Get currently accepted events
    const currentAcceptedEventIds = events
      .filter(event => event.acceptedMentors?.includes(user.id))
      .map(event => event.id);
    
    // Find newly accepted events
    const newlyAcceptedIds = currentAcceptedEventIds
      .filter(id => !previouslyAcceptedEventIds.includes(id));
    
    // Update local storage with current state
    localStorage.setItem(storageKey, JSON.stringify(currentAcceptedEventIds));
    
    setNewAcceptedEventIds(newlyAcceptedIds);
  }, [events, user]);

  const clearNewAcceptedEvent = (eventId?: string) => {
    if (!eventId) return;
    setNewAcceptedEventIds(prev => prev.filter(id => id !== eventId));
  };

  return { newAcceptedEventIds, clearNewAcceptedEvent };
};