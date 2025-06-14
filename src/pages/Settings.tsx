
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Layout } from "@/components/Layout";

export default function Settings() {
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
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                type="email" 
                defaultValue="user@example.com"
                className="rounded-xl"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="timezone">Time Zone</Label>
              <Input 
                id="timezone" 
                defaultValue="UTC-5 (Eastern Time)"
                disabled
                className="rounded-xl bg-muted"
              />
            </div>
            
            <Separator />
            
            <div className="space-y-3">
              <Button variant="outline" className="w-full rounded-xl">
                Change Password
              </Button>
              
              <div className="pt-4">
                <h4 className="font-medium text-sm mb-2 text-destructive">Danger Zone</h4>
                <Button variant="destructive" className="w-full rounded-xl">
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
                <p className="text-sm text-ash">Get reminded to complete your daily reviews</p>
              </div>
              <Switch id="daily-reminder" defaultChecked />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="missed-sessions">Missed Session Nudge</Label>
                <p className="text-sm text-ash">Get notified when you miss a scheduled review</p>
              </div>
              <Switch id="missed-sessions" defaultChecked />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="weekly-recap">Weekly Progress Recap</Label>
                <p className="text-sm text-ash">Receive a summary of your weekly learning progress</p>
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
                <p className="text-sm text-ash">Switch between light and dark themes</p>
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
      </div>
    </Layout>
  );
}
