
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Layout } from "@/components/Layout";
import { useAuth } from "@/hooks/useAuth";
import { useUserProfile } from "@/hooks/useRealData";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export default function Settings() {
  const { user, signOut } = useAuth();
  const { data: userProfile, isLoading } = useUserProfile();
  const [isUpdating, setIsUpdating] = useState(false);
  const { toast } = useToast();

  const handleUpdateProfile = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) return;

    setIsUpdating(true);
    const formData = new FormData(e.currentTarget);
    const fullName = formData.get('fullName') as string;

    try {
      // Update auth metadata
      const { error: authError } = await supabase.auth.updateUser({
        data: { full_name: fullName }
      });

      if (authError) throw authError;

      // Update profile table
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ full_name: fullName })
        .eq('id', user.id);

      if (profileError) throw profileError;

      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully.",
      });
    } catch (error) {
      toast({
        title: "Update Failed",
        description: error instanceof Error ? error.message : "Failed to update profile",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!confirm("Are you sure you want to delete your account? This action cannot be undone.")) {
      return;
    }

    try {
      // Note: Account deletion should be handled by a backend function for security
      // For now, we'll just sign out the user
      await signOut();
      toast({
        title: "Account Deletion",
        description: "Please contact support to complete account deletion.",
        variant: "destructive",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to process account deletion request",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="p-6 max-w-2xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-6 max-w-2xl mx-auto space-y-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-muted-foreground">Manage your account and preferences</p>
        </div>
        
        {/* Account Settings */}
        <Card className="rounded-xl shadow-md">
          <CardHeader>
            <CardTitle>Account</CardTitle>
            <CardDescription>
              Manage your account information and security
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input 
                  id="email" 
                  type="email" 
                  value={user?.email || ""}
                  disabled
                  className="rounded-xl bg-muted"
                />
                <p className="text-sm text-muted-foreground">
                  Email cannot be changed. Contact support if needed.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input 
                  id="fullName"
                  name="fullName"
                  type="text" 
                  defaultValue={userProfile?.full_name || ""}
                  placeholder="Enter your full name"
                  className="rounded-xl"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="timezone">Time Zone</Label>
                <Input 
                  id="timezone" 
                  defaultValue={Intl.DateTimeFormat().resolvedOptions().timeZone}
                  disabled
                  className="rounded-xl bg-muted"
                />
                <p className="text-sm text-muted-foreground">
                  Automatically detected from your browser
                </p>
              </div>

              <Button 
                type="submit" 
                disabled={isUpdating}
                className="w-full rounded-xl"
              >
                {isUpdating ? "Updating..." : "Update Profile"}
              </Button>
            </form>
            
            <Separator />
            
            <div className="space-y-3">
              <Button 
                variant="outline" 
                className="w-full rounded-xl"
                onClick={() => toast({
                  title: "Change Password",
                  description: "Password change functionality will be implemented soon.",
                })}
              >
                Change Password
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full rounded-xl"
                onClick={() => signOut()}
              >
                Sign Out
              </Button>
              
              <div className="pt-4">
                <h4 className="font-medium text-sm mb-2 text-destructive">Danger Zone</h4>
                <Button 
                  variant="destructive" 
                  className="w-full rounded-xl"
                  onClick={handleDeleteAccount}
                >
                  Delete Account
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card className="rounded-xl shadow-md">
          <CardHeader>
            <CardTitle>Notifications</CardTitle>
            <CardDescription>
              Configure how and when you want to be notified
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="daily-reminder">Daily Reminder</Label>
                <p className="text-sm text-muted-foreground">Get reminded to complete your daily reviews</p>
              </div>
              <Switch id="daily-reminder" defaultChecked />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="missed-sessions">Missed Session Nudge</Label>
                <p className="text-sm text-muted-foreground">Get notified when you miss a scheduled review</p>
              </div>
              <Switch id="missed-sessions" defaultChecked />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="weekly-recap">Weekly Progress Recap</Label>
                <p className="text-sm text-muted-foreground">Receive a summary of your weekly learning progress</p>
              </div>
              <Switch id="weekly-recap" />
            </div>
          </CardContent>
        </Card>

        {/* Theme Settings */}
        <Card className="rounded-xl shadow-md">
          <CardHeader>
            <CardTitle>Appearance</CardTitle>
            <CardDescription>
              Customize the look and feel of RecallForge
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="dark-mode">Dark Mode</Label>
                <p className="text-sm text-muted-foreground">Switch between light and dark themes</p>
              </div>
              <Switch 
                id="dark-mode" 
                onCheckedChange={(checked) => {
                  document.documentElement.classList.toggle('dark', checked);
                }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Account Stats */}
        <Card className="rounded-xl shadow-md">
          <CardHeader>
            <CardTitle>Account Statistics</CardTitle>
            <CardDescription>
              Your learning progress overview
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Current Streak</span>
              <span className="text-lg font-bold text-primary">
                {userProfile?.streak_count || 0} days
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Total Mastery Points</span>
              <span className="text-lg font-bold text-primary">
                {userProfile?.total_mastery_points || 0}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Member Since</span>
              <span className="text-sm text-muted-foreground">
                {userProfile?.created_at ? 
                  new Date(userProfile.created_at).toLocaleDateString() : 
                  'N/A'
                }
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
