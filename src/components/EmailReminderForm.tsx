
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Mail, Clock, Calendar } from 'lucide-react';
import { useEmailReminder } from '@/hooks/useEmailReminder';

interface EmailReminderFormProps {
  learningObjectiveId: string;
  defaultEmail?: string;
}

export function EmailReminderForm({ learningObjectiveId, defaultEmail }: EmailReminderFormProps) {
  const [email, setEmail] = useState(defaultEmail || '');
  const [hoursDelay, setHoursDelay] = useState('24');
  const { loading, scheduleReminder } = useEmailReminder();

  const handleSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    try {
      await scheduleReminder(email, learningObjectiveId, parseInt(hoursDelay));
      setEmail('');
    } catch (error) {
      console.error('Failed to schedule reminder:', error);
    }
  };

  const delayOptions = [
    { value: '1', label: '1 hour' },
    { value: '6', label: '6 hours' },
    { value: '12', label: '12 hours' },
    { value: '24', label: '1 day' },
    { value: '48', label: '2 days' },
    { value: '72', label: '3 days' },
    { value: '168', label: '1 week' },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Schedule Study Reminder
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSchedule} className="space-y-4">
          <div>
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter email for reminder"
              required
            />
          </div>
          
          <div>
            <Label htmlFor="delay">Send Reminder In</Label>
            <Select value={hoursDelay} onValueChange={setHoursDelay}>
              <SelectTrigger>
                <SelectValue placeholder="Select delay" />
              </SelectTrigger>
              <SelectContent>
                {delayOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      {option.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button type="submit" disabled={loading || !email.trim()} className="w-full">
            <Calendar className="h-4 w-4 mr-2" />
            {loading ? 'Scheduling...' : 'Schedule Reminder'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
