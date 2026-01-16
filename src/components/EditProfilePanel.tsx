import { useEffect, useState } from "react";
import { User, Moon, Sun, Mail, Calendar, Save, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTheme } from "@/hooks/useTheme";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";

interface EditProfilePanelProps {
  userId: string;
  userCreatedAt?: string;
}

export const EditProfilePanel = ({ userId, userCreatedAt }: EditProfilePanelProps) => {
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");

  useEffect(() => {
    loadProfile();
  }, [userId]);

  const loadProfile = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("full_name, email")
        .eq("id", userId)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setFullName(data.full_name || "");
        setEmail(data.email || "");
      }
    } catch (error) {
      console.error("Error loading profile:", error);
      toast({
        title: "Error",
        description: "Failed to load profile",
        variant: "destructive",
      });
    } finally {
      setPageLoading(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from("profiles")
        .update({ full_name: fullName })
        .eq("id", userId);

      if (error) throw error;

      toast({
        title: "Profile updated",
        description: "Your changes have been saved successfully.",
      });
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "U";
  };

  if (pageLoading) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex justify-center">
          <Skeleton className="h-24 w-24 rounded-full" />
        </div>
        <Skeleton className="h-12 w-full rounded-xl" />
        <Skeleton className="h-12 w-full rounded-xl" />
        <Skeleton className="h-12 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-center mb-6">
        <div className="relative">
          <Avatar className="h-24 w-24 ring-4 ring-background shadow-lg">
            <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-white text-3xl font-semibold">
              {getInitials(fullName)}
            </AvatarFallback>
          </Avatar>
          <Button
            size="icon"
            variant="secondary"
            className="absolute bottom-0 right-0 h-8 w-8 rounded-full shadow-md"
            disabled
          >
            <Camera className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <form onSubmit={handleUpdateProfile} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="fullName" className="text-sm font-medium text-muted-foreground">
            Full Name
          </Label>
          <Input
            id="fullName"
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Enter your full name"
            className="h-12 rounded-xl border-border/50 bg-background/50 focus:bg-background transition-colors"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm font-medium text-muted-foreground">
            Email Address
          </Label>
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="email"
              type="email"
              value={email}
              disabled
              className="h-12 pl-11 rounded-xl bg-muted/50 border-0 text-muted-foreground"
            />
          </div>
          <p className="text-xs text-muted-foreground">Email cannot be changed</p>
        </div>

        {userCreatedAt && (
          <div className="space-y-2">
            <Label className="text-sm font-medium text-muted-foreground">Member Since</Label>
            <div className="flex items-center gap-3 h-12 px-4 bg-muted/50 rounded-xl text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>
                {new Date(userCreatedAt).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            </div>
          </div>
        )}

        <div className="space-y-2">
          <Label className="text-sm font-medium text-muted-foreground">Theme Preference</Label>
          <Button
            type="button"
            variant="outline"
            className="w-full h-12 rounded-xl justify-start gap-3"
            onClick={toggleTheme}
          >
            {theme === "dark" ? (
              <>
                <Moon className="h-4 w-4" />
                Dark Mode
              </>
            ) : (
              <>
                <Sun className="h-4 w-4" />
                Light Mode
              </>
            )}
            <span className="ml-auto text-muted-foreground text-sm">Click to toggle</span>
          </Button>
        </div>

        <div className="pt-4">
          <Button
            type="submit"
            disabled={loading}
            className="w-full h-12 rounded-xl text-base font-medium"
          >
            {loading ? (
              "Saving..."
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};
