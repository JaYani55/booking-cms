import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuth } from "@/contexts/AuthContext";
import { DefaultViewSetting } from '@/components/profile/DefaultViewSetting';
import { ArrowLeft, Info, Monitor, Shield, Zap, LayoutDashboard, PanelLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ProfileSkeleton } from '@/components/profile/ProfileSkeleton';
import { Alert, AlertDescription } from "@/components/ui/alert";

// Helper functions for localStorage
const STORAGE_KEY_PREFIX = 'mentor_app_settings_';

const getUserStorageKey = (userId: string, setting: string) => {
  return `${STORAGE_KEY_PREFIX}${userId}_${setting}`;
};

const getStoredSetting = <T,>(userId: string, setting: string, defaultValue: T): T => {
  try {
    const key = getUserStorageKey(userId, setting);
    const stored = localStorage.getItem(key);
    if (!stored) {
      return defaultValue;
    }

    try {
      return JSON.parse(stored) as T;
    } catch (parseError) {
      console.warn(`Failed to parse setting ${setting}:`, parseError);
      return defaultValue;
    }
  } catch (error) {
    console.warn(`Failed to load setting ${setting}:`, error);
    return defaultValue;
  }
};

const storeSetting = <T,>(userId: string, setting: string, value: T): boolean => {
  try {
    const key = getUserStorageKey(userId, setting);
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error(`Failed to store setting ${setting}:`, error);
    return false;
  }
};

const Settings = () => {
  const { language, layoutMode, setLayoutMode } = useTheme();
  const { user } = useAuth();
  const [defaultView, setDefaultView] = React.useState<string>('events');
  const [isLoading, setIsLoading] = React.useState<boolean>(true);
  const [isUpdating, setIsUpdating] = React.useState<boolean>(false);

  React.useEffect(() => {
    const loadSettings = async () => {
      if (user) {
        try {
          // Get default view from localStorage
          const userDefaultView = getStoredSetting(user.id, 'default_view', 'events');
          setDefaultView(userDefaultView);
        } catch (error) {
          console.error("Failed to load user settings:", error);
        } finally {
          setIsLoading(false);
        }
      }
    };

    loadSettings();
  }, [user]);

  const handleUpdateDefaultView = async (view: string): Promise<boolean> => {
    if (!user) return false;
    
    setIsUpdating(true);
    try {
      // Store in localStorage
      const success = storeSetting(user.id, 'default_view', view);
      
      if (!success) {
        return false;
      }
      
      setDefaultView(view);
      return true;
    } catch (error) {
      console.error("Failed to update default view:", error);
      return false;
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Link to="/me">
          <Button variant="ghost" size="sm" className="gap-1">
            <ArrowLeft className="h-4 w-4" /> 
            {language === "en" ? "Back" : "Zurück"}
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">
          {language === "en" ? "Settings" : "Einstellungen"}
        </h1>
      </div>

      {/* Modern info card explaining client-side storage */}
      <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950/20">
        <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
        <AlertDescription className="text-blue-800 dark:text-blue-300">
          <div className="space-y-3">
            <p className="font-medium">
              {language === "en" 
                ? "📱 Device-Only Settings" 
                : "📱 Gerätespezifische Einstellungen"}
            </p>
            <p className="text-sm">
              {language === "en" 
                ? "These preferences are saved directly on your device for instant loading and maximum privacy. They won't sync across different devices or browsers." 
                : "Diese Einstellungen werden direkt auf Ihrem Gerät gespeichert für sofortiges Laden und maximalen Datenschutz. Sie werden nicht zwischen verschiedenen Geräten oder Browsern synchronisiert."}
            </p>
            <div className="flex flex-wrap gap-4 text-xs">
              <div className="flex items-center gap-1">
                <Zap className="h-3 w-3" />
                <span>{language === "en" ? "Instant" : "Sofort"}</span>
              </div>
              <div className="flex items-center gap-1">
                <Shield className="h-3 w-3" />
                <span>{language === "en" ? "Private" : "Privat"}</span>
              </div>
              <div className="flex items-center gap-1">
                <Monitor className="h-3 w-3" />
                <span>{language === "en" ? "Device-specific" : "Gerätespezifisch"}</span>
              </div>
            </div>
          </div>
        </AlertDescription>
      </Alert>

      {isLoading || isUpdating ? (
        <Card className="p-6">
          <ProfileSkeleton />
        </Card>
      ) : (
        <div className="space-y-6">
          <Card className="p-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <PanelLeft className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold">
                  {language === "en" ? "Navigation Layout" : "Navigationslayout"}
                </h2>
              </div>
              <p className="text-sm text-muted-foreground">
                {language === "en" 
                  ? "Choose between a top navigation bar or a side navigation bar." 
                  : "Wählen Sie zwischen einer oberen Navigationsleiste oder einer seitlichen Navigation."}
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div 
                  className={`cursor-pointer rounded-lg border-2 p-4 hover:bg-accent transition-all ${layoutMode === 'navbar' ? 'border-primary bg-accent/50' : 'border-transparent bg-card shadow-sm'}`}
                  onClick={() => setLayoutMode('navbar')}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 rounded-full bg-primary/10">
                      <LayoutDashboard className="h-4 w-4 text-primary" />
                    </div>
                    <span className="font-medium">
                      {language === "en" ? "Top Navigation" : "Obere Navigation"}
                    </span>
                  </div>
                  <div className="h-20 bg-muted/20 rounded border border-dashed border-muted-foreground/20 relative overflow-hidden">
                     <div className="absolute top-0 left-0 right-0 h-4 bg-primary/20 border-b border-primary/10"></div>
                  </div>
                </div>

                <div 
                  className={`cursor-pointer rounded-lg border-2 p-4 hover:bg-accent transition-all ${layoutMode === 'sidebar' ? 'border-primary bg-accent/50' : 'border-transparent bg-card shadow-sm'}`}
                  onClick={() => setLayoutMode('sidebar')}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 rounded-full bg-primary/10">
                      <PanelLeft className="h-4 w-4 text-primary" />
                    </div>
                    <span className="font-medium">
                      {language === "en" ? "Sidebar Navigation" : "Seitliche Navigation"}
                    </span>
                  </div>
                  <div className="h-20 bg-muted/20 rounded border border-dashed border-muted-foreground/20 relative overflow-hidden">
                     <div className="absolute top-0 left-0 bottom-0 w-8 bg-primary/20 border-r border-primary/10"></div>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <DefaultViewSetting 
              defaultView={defaultView}
              language={language}
              onUpdate={handleUpdateDefaultView}
            />
          </Card>
        </div>
      )}
    </div>
  );
};

export default Settings;