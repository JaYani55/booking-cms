import React, { useEffect, useState, useMemo } from "react";
import { useTheme } from "../contexts/ThemeContext";
import { useProfileData } from "@/hooks/useProfileData";
import { usePermissions } from '@/hooks/usePermissions';
import { useSeatableMentors } from "@/hooks/useSeatableMentors";
import { useMentorTraits } from "@/hooks/useMentorTraits";
import { ProfilePhoto } from "@/components/profile/ProfilePhoto";
import { ProfileSkeleton } from "@/components/profile/ProfileSkeleton";
import { AccessDenied } from "@/components/profile/AccessDenied";
import { SeaTableDataUnavailable } from "@/components/profile/SeaTableDataUnavailable";
import { RegistrationInProcess } from "@/components/profile/RegistrationInProcess";
import { EditableUsername } from '@/components/profile/EditableUsername';
import { ColumnMetadata } from "@/types/seaTableTypes";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tags, User, Database } from 'lucide-react';

type UseProfileDataReturn = ReturnType<typeof useProfileData>;
type ProfileUser = UseProfileDataReturn['user'];
type ProfileSeaTable = UseProfileDataReturn['seatableMentorData'];

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0;

const getStringField = (row: ProfileSeaTable, key: string): string | null => {
  if (!row) return null;
  const value = row[key];
  return isNonEmptyString(value) ? value : null;
};

const getDisplayUsername = (profile: ProfileUser, language: 'en' | 'de'): string => {
  if (isNonEmptyString(profile?.Username)) {
    return profile.Username;
  }
  return language === 'de' ? 'Noch kein Anzeigename gegeben' : 'No Username given';
};

const getInitials = (profile: ProfileUser, seatableData: ProfileSeaTable): string => {
  const firstName = getStringField(seatableData, 'Vorname');
  const lastName = getStringField(seatableData, 'Nachname');

  if (firstName && lastName) {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  }

  if (firstName) {
    return firstName.charAt(0).toUpperCase();
  }

  if (isNonEmptyString(profile?.Username)) {
    return profile.Username.charAt(0).toUpperCase();
  }

  return 'U';
};

const formatFieldValue = (value: unknown): string => {
  if (value === null || value === undefined || value === '') {
    return '';
  }

  if (Array.isArray(value)) {
    return value.filter(Boolean).map(String).join(', ');
  }

  if (value instanceof Date) {
    return value.toLocaleDateString();
  }

  if (typeof value === 'object') {
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }

  return String(value);
};

const Profile = () => {
  const { language } = useTheme();
  const permissions = usePermissions();
  const { 
    isLoading,
    hasAccess,
    accessChecked,
    user,
    seatableMentorData,
    isRegistrationInProcess,
    updateUsername
  } = useProfileData(language);
  
  // ✅ Add local state for the current icon
  const initialAnimalIcon = isNonEmptyString(user?.selected_animal_icon) ? user?.selected_animal_icon : undefined;
  const [currentAnimalIcon, setCurrentAnimalIcon] = useState<string | undefined>(initialAnimalIcon);
  
  // ✅ Update local state when user data changes
  useEffect(() => {
    setCurrentAnimalIcon(isNonEmptyString(user?.selected_animal_icon) ? user.selected_animal_icon : undefined);
  }, [user?.selected_animal_icon]);

  // Move the hook call to the top level and memoize the options
  const seatableMentorsOptions = useMemo(() => ({}), []); // Empty options
  const { getTableMetadata } = useSeatableMentors(seatableMentorsOptions);
  const [columnMetadata, setColumnMetadata] = useState<ColumnMetadata | undefined>();

  // Fetch mentor traits from Supabase
  const { traits, isLoading: traitsLoading } = useMentorTraits(user?.id);

  // Use centralized permission instead of role check
  const isAdmin = permissions.canViewAdminData;

  // Add debugging and prevent infinite loops
  useEffect(() => {
    console.log('[Profile] useEffect triggered', { 
      hasGetTableMetadata: !!getTableMetadata,
      isLoading,
      hasAccess,
      accessChecked 
    });
    
    // Only fetch if we have access and aren't loading
    if (!isLoading && hasAccess && accessChecked && getTableMetadata) {
      const fetchMetadata = async () => {
        try {
          console.log('[Profile] Fetching metadata...');
          const metadata = await getTableMetadata('Neue_MentorInnen');
          console.log('[Profile] Metadata fetched:', metadata);
          setColumnMetadata(metadata);
        } catch (error) {
          console.error('Error fetching column metadata:', error);
        }
      };
      
      fetchMetadata();
    }
  }, [getTableMetadata, isLoading, hasAccess, accessChecked]); // Add all dependencies

  console.log('[Profile] Render state:', {
    isLoading,
    hasAccess,
    accessChecked,
    user: user?.id,
    seatableMentorData: !!seatableMentorData,
    isRegistrationInProcess
  });

  if (isLoading) {
    console.log('[Profile] Showing skeleton');
    return <ProfileSkeleton />;
  }

  if (accessChecked && !hasAccess) {
    console.log('[Profile] Showing access denied');
    return <AccessDenied language={language} />;
  }
  
  if (isRegistrationInProcess) {
    console.log('[Profile] Showing registration in process');
    return <RegistrationInProcess 
      language={language}
    />;
  }

  if (!seatableMentorData) {
    console.log('[Profile] Showing data unavailable');
    return (
      <SeaTableDataUnavailable 
        language={language} 
        userId={user?.id} 
      />
    );
  }

  const displayUsername = getDisplayUsername(user, language);

  // Get initials for the profile photo
  const initials = getInitials(user, seatableMentorData);
  const displayName = isNonEmptyString(user?.Username) ? user.Username : displayUsername;
  const profileRole = isNonEmptyString(user?.role) ? user.role : undefined;
  const seatableEmail = getStringField(seatableMentorData, 'E-Mail-Adresse');
  const seatableFirstName = getStringField(seatableMentorData, 'Vorname');
  const seatableLastName = getStringField(seatableMentorData, 'Nachname');
  const seatableFullName = [seatableFirstName, seatableLastName].filter(Boolean).join(' ');

  // Helper function to format field values (for traits and other data)
  // Skip fields that are handled separately in personal info
  const skipFields = [
    '_id', '_ctime', '_mtime', '_creator', '_last_modifier', '_locked', '_locked_by', '_archived',
    'Vorname', 'Nachname', 'E-Mail-Adresse', // Skip these as they're shown in personal info
    'Mentor_ID' // Skip ID field
  ];

  // Get all other SeaTable fields for "Further Information"
  const furtherInfoFields = Object.keys(seatableMentorData).filter(key => {
    const value = seatableMentorData[key];
    // Filter out certain system fields and empty values for display
    if (skipFields.includes(key)) return false;
    if (value === null || value === undefined || value === '') return false;
    return true;
  });

  console.log('[Profile] Showing unified profile data');
  return (
    <div className="space-y-6 fade-in max-w-none">
      {/* Profile Photo + Animal Icon Hint */}
      <div className="flex flex-col items-center">
        <div className="relative flex items-center justify-center">
          <ProfilePhoto
            profilePictureUrl={user?.pfp_url}
            displayName={displayName}
            initials={initials}
            role={profileRole}
            isOwnProfile={true}
            language={language}
            selectedAnimalIcon={currentAnimalIcon}
            userId={user?.id}
            onImageUploaded={async (url: string) => {
              console.log('Profile picture uploaded:', url);
              // TODO: Save the profile picture URL to Supabase user profile
            }}
          />
          {/* Red hint if no animal icon and user can change icons */}
          {!currentAnimalIcon && permissions.canChangeAnimalIcons && (
            <span className="absolute left-full ml-3 top-1/2 -translate-y-1/2 bg-red-100 text-red-700 border border-red-300 rounded px-2 py-1 text-xs font-semibold shadow-md whitespace-nowrap">
              Set an avatar for the user!
            </span>
          )}
        </div>
      </div>

      {/* Unified Profile Data */}
      <Card className="w-full">
        <CardContent className="p-4 sm:p-6">
          {/* Personal Information */}
          <div className="mb-6">
            <h3 className="text-lg sm:text-xl font-semibold mb-4 text-center">
              {language === 'de' ? 'Persönliche Informationen' : 'Personal Information'}
            </h3>
            
            <div className="space-y-3">
              {/* Username from Supabase */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 py-2 border-b border-gray-100">
                <div className="font-medium text-muted-foreground text-sm sm:text-base flex items-center gap-2">
                  <User className="h-4 w-4" />
                  {language === 'de' ? 'Anzeigename:' : 'Display Name:'}
                  {isAdmin && (
                    <Badge variant="outline" className="text-xs text-blue-600 border-blue-300 bg-blue-50">
                      Supabase
                    </Badge>
                  )}
                </div>
                <div className="sm:col-span-2">
                  <EditableUsername
                    username={displayUsername}
                    onUpdate={updateUsername}
                    isUpdating={isLoading}
                    language={language}
                  />
                </div>
              </div>
              
              {/* Name fields from SeaTable */}
              {(seatableFirstName || seatableLastName) && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 py-2 border-b border-gray-100">
                  <div className="font-medium text-muted-foreground text-sm sm:text-base flex items-center gap-2">
                    {language === 'de' ? 'Name:' : 'Name:'}
                    {isAdmin && (
                      <Badge variant="outline" className="text-xs text-green-600 border-green-300 bg-green-50">
                        SeaTable
                      </Badge>
                    )}
                  </div>
                  <div className="sm:col-span-2 text-sm sm:text-base">
                    {seatableFullName || (
                      <span className="text-muted-foreground italic">
                        {language === 'de' ? 'leer' : 'empty'}
                      </span>
                    )}
                  </div>
                </div>
              )}
              
              {/* Email field from SeaTable */}
              {seatableEmail && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 py-2 border-b border-gray-100">
                  <div className="font-medium text-muted-foreground text-sm sm:text-base flex items-center gap-2">
                    {language === 'de' ? 'E-Mail:' : 'Email:'}
                    {isAdmin && (
                      <Badge variant="outline" className="text-xs text-green-600 border-green-300 bg-green-50">
                        SeaTable
                      </Badge>
                    )}
                  </div>
                  <div className="sm:col-span-2 text-sm sm:text-base">
                    {seatableEmail}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Further Information */}
          <div>
            <h3 className="text-lg sm:text-xl font-semibold mb-4 text-center">
              {language === 'de' ? 'Weitere Informationen' : 'Further Information'}
            </h3>
            
            <div className="space-y-3">
              {/* Traits Section from Supabase */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 py-2 border-b border-gray-100">
                <div className="font-medium text-muted-foreground text-sm sm:text-base flex items-center gap-2">
                  <Tags className="h-4 w-4" />
                  {language === 'de' ? 'Eigenschaften:' : 'Traits:'}
                  {isAdmin && (
                    <Badge variant="outline" className="text-xs text-blue-600 border-blue-300 bg-blue-50">
                      Supabase
                    </Badge>
                  )}
                </div>
                <div className="sm:col-span-2">
                  {traitsLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full"></div>
                      <span className="text-sm text-muted-foreground">
                        {language === 'de' ? 'Lade...' : 'Loading...'}
                      </span>
                    </div>
                  ) : traits.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {traits.map((trait) => (
                        <Badge 
                          key={trait.id} 
                          variant="secondary"
                          className="text-xs"
                          title={trait.description || undefined}
                        >
                          {trait.group_name}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <span className="text-muted-foreground italic text-sm sm:text-base">
                      {language === 'de' ? 'Keine Eigenschaften zugewiesen' : 'No traits assigned'}
                    </span>
                  )}
                </div>
              </div>

              {/* All other fields from SeaTable */}
              {furtherInfoFields.map(key => {
                const value = seatableMentorData[key];
                
                return (
                  <div key={key} className="grid grid-cols-1 sm:grid-cols-3 gap-2 py-2 border-b border-gray-100 last:border-b-0">
                    <div className="font-medium text-muted-foreground text-sm sm:text-base flex items-center gap-2">
                      <Database className="h-4 w-4" />
                      {key}:
                      {isAdmin && (
                        <Badge variant="outline" className="text-xs text-green-600 border-green-300 bg-green-50">
                          SeaTable
                        </Badge>
                      )}
                    </div>
                    <div className="sm:col-span-2 text-sm sm:text-base">
                      {formatFieldValue(value) || (
                        <span className="text-muted-foreground italic">
                          {language === 'de' ? 'leer' : 'empty'}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Profile;