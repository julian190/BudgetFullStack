'use client';

import { useState, useEffect } from 'react';
import { useApi } from '@/lib/api';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DatePicker } from '@/components/ui/date-picker';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/components/ui/use-toast';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';

interface BudgetSetting {
  USerid: number;
  cycleStartDayNumber: string;
  cycleStartDayName: string;
}

interface SharedUser {
  id: number;
  email: string;
  canEdit: boolean;
}


export default function SettingsPage() {
  const api = useApi();
  const [settings, setSettings] = useState<BudgetSetting | null>(null);
  const [sharedUsers, setSharedUsers] = useState<SharedUser[]>([]);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [canEdit, setCanEdit] = useState(true);

  useEffect(() => {
    loadSettings();
    loadSharedUsers();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await api.get<BudgetSetting>('/api/settings');
      setSettings(response);
    } catch (error) {
      toast({
        title: 'Error',
        description: `Failed to load settings ${error}`,
        variant: 'destructive',
      });
    }
  };

  const loadSharedUsers = async () => {
    try {
      const response = await api.get<SharedUser[]>('/api/settings/shared-users');
      setSharedUsers(response);
    } catch (error) {
      toast({
        title: 'Error',
        description: `Failed to load shared users ${error}`,
        variant: 'destructive',
      });
    }
  };

  const saveSettings = async () => {
    if (!settings) return;
    const { userId, ...rest } = settings;
    const resultArray = Object.entries(rest).map(([key, value]) => ({
      name: key,
      value,
      UserID: userId
    }));

    try {
      await api.put('/api/settings', resultArray);
      toast({
        title: 'Success',
        description: 'Settings saved successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: `Failed to save settings ${error}`,
        variant: 'destructive',
      });
    }
  };

  const shareWithUser = async () => {
    if (!newUserEmail.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a valid email',
        variant: 'destructive',
      });
      return;
    }

    try {
      await api.post('/api/settings/share', {
        email: newUserEmail,
        canEdit: canEdit,
      });
      setNewUserEmail('');
      loadSharedUsers();
      toast({
        title: 'Success',
        description: 'Budget shared successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: `Failed to share budget ${error}`,
        variant: 'destructive',
      });
    }
  };

  const removeSharedUser = async (userId: number) => {
    try {
      await api.delete(`/api/settings/share/${userId}`);
      loadSharedUsers();
      toast({
        title: 'Success',
        description: 'User removed successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: `Failed to remove user ${error}`,
        variant: 'destructive',
      });
    }
  };

  if (!settings) {
    return <div>Loading...</div>;
  }
  return (
    <div className="container mx-auto p-4 space-y-4">
      <h1 className="text-2xl font-bold mb-4">Settings</h1>

      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold">Budget Cycle Settings</h2>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Which Day of the Month the Budget starts</Label>
            <Select value={settings?.cycleStartDayName} onValueChange={(value) => setSettings({...settings, cycleStartDayName: value})}>
              <SelectTrigger className="w-[180px]">
                <SelectValue >
                  {settings?.cycleStartDayName === '0' ? 'Sunday' :
                   settings?.cycleStartDayName === '1' ? 'Monday' :
                   settings?.cycleStartDayName === '2' ? 'Tuesday' :
                   settings?.cycleStartDayName === '3' ? 'Wednesday' :
                   settings?.cycleStartDayName === '4' ? 'Thursday' :
                   settings?.cycleStartDayName === '5' ? 'Friday' :
                   settings?.cycleStartDayName === '6' ? 'Saturday': 'Select Day'}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">Sunday</SelectItem>
                <SelectItem value="1">Monday</SelectItem>
                <SelectItem value="2">Tuesday</SelectItem>
                <SelectItem value="3">Wednesday</SelectItem>
                <SelectItem value="4">Thursday</SelectItem>
                <SelectItem value="5">Friday</SelectItem>
                <SelectItem value="6">Saturday</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Which Day number you are getting your salary</Label>
            <Input
              type="number"
              value={settings.cycleStartDayNumber}
              min={1} max={31}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  cycleStartDayNumber: parseInt(e.target.value) > 31 ? '31' : e.target.value,
                })
              }
            />
          </div>
          <Button onClick={saveSettings}>Save Settings</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold">Share Budget</h2>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <Label>User Email</Label>
              <Input
                type="email"
                value={newUserEmail}
                onChange={(e) => setNewUserEmail(e.target.value)}
                placeholder="Enter user email"
              />
            </div>
            <div className="flex items-center gap-2">
              <Label>Can Edit</Label>
              <Switch
                checked={canEdit}
                onCheckedChange={setCanEdit}
              />
            </div>
            <Button onClick={shareWithUser}>Share</Button>
          </div>

          <div className="mt-4">
            <h3 className="text-lg font-semibold mb-2">Shared With</h3>
            <div className="space-y-2">
              {sharedUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-2 bg-secondary rounded"
                >
                  <div>
                    <span>{user.email}</span>
                    <span className="ml-2 text-sm text-muted-foreground">
                      ({user.canEdit ? 'Can Edit' : 'View Only'})
                    </span>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => removeSharedUser(user.id)}
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
