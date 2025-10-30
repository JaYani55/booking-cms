import { useState, useEffect } from 'react';
import { Event } from '@/types/event';
import type { UserProfileRecord } from '@/types/auth';

type MentorProfile = {
  id: string;
  name: string;
  profilePic?: string;
};

type MentorAction = {
  id: string;
  name: string;
  action: 'accept' | 'decline' | null;
};

export const useMentorProfileLoader = (
  event: Event | null,
  getUserProfile: (userId: string) => Promise<UserProfileRecord | null>
) => {
  const [isLoading, setIsLoading] = useState(true);
  const [requestingMentors, setRequestingMentors] = useState<MentorAction[]>([]);
  const [acceptedMentorProfiles, setAcceptedMentorProfiles] = useState<MentorProfile[]>([]);
  const [declinedMentorProfiles, setDeclinedMentorProfiles] = useState<MentorProfile[]>([]);

  useEffect(() => {
    if (!event) {
      setIsLoading(false);
      setRequestingMentors([]);
      setAcceptedMentorProfiles([]);
      setDeclinedMentorProfiles([]);
      return;
    }

    const loadMentorProfiles = async () => {
      setIsLoading(true);
      try {
        if (event.requestingMentors?.length) {
          const requestingProfiles = await Promise.all(
            event.requestingMentors.map(async (mentorId) => {
              const profile = await getUserProfile(mentorId);
              return {
                id: mentorId,
                name: profile?.Username || 'Unknown User',
                action: null as MentorAction['action']
              };
            })
          );
          setRequestingMentors(requestingProfiles);
        } else {
          setRequestingMentors([]);
        }

        if (event.acceptedMentors?.length) {
          const acceptedProfiles = await Promise.all(
            event.acceptedMentors.map(async (mentorId) => {
              const profile = await getUserProfile(mentorId);
              return {
                id: mentorId,
                name: profile?.Username || 'Unknown User',
                profilePic: profile?.profile_picture_url ?? undefined
              };
            })
          );
          setAcceptedMentorProfiles(acceptedProfiles);
        } else {
          setAcceptedMentorProfiles([]);
        }

        if (event.declinedMentors?.length) {
          const declinedProfiles = await Promise.all(
            event.declinedMentors.map(async (mentorId) => {
              const profile = await getUserProfile(mentorId);
              return {
                id: mentorId,
                name: profile?.Username || 'Unknown User',
                profilePic: profile?.profile_picture_url ?? undefined
              };
            })
          );
          setDeclinedMentorProfiles(declinedProfiles);
        } else {
          setDeclinedMentorProfiles([]);
        }
      } catch (error) {
        console.error('Error loading mentor profiles:', error);
        setRequestingMentors([]);
        setAcceptedMentorProfiles([]);
        setDeclinedMentorProfiles([]);
      } finally {
        setIsLoading(false);
      }
    };

    void loadMentorProfiles();
  }, [event, getUserProfile]);

  const updateRequestingMentors = (mentors: MentorAction[]) => {
    setRequestingMentors(mentors);
  };

  return {
    isLoading,
    requestingMentors,
    updateRequestingMentors,
    acceptedMentorProfiles,
    declinedMentorProfiles
  };
};