import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Clock, Calendar, Play, Pause, Settings, Plus, Trash2, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { trpcClient } from "@/utils/trpc";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

interface ScheduledSession {
  id: string;
  name: string;
  description?: string | null;
  focusDuration: number; // minutes
  breakDuration: number; // minutes
  cycles: number;
  startTime: string; // HH:MM format
  daysOfWeek: number[]; // 0-6, 0 = Sunday
  isActive: boolean;
  autoStart: boolean;
  userId: string;
  createdAt: number;
  updatedAt: number;
  lastRun?: number | null;
  nextRun?: number | null;
}

const DAYS_OF_WEEK = [
  { value: 0, label: "Sun" },
  { value: 1, label: "Mon" },
  { value: 2, label: "Tue" },
  { value: 3, label: "Wed" },
  { value: 4, label: "Thu" },
  { value: 5, label: "Fri" },
  { value: 6, label: "Sat" },
];

const PRESET_SCHEDULES = [
  {
    name: "Pomodoro Classic",
    focusDuration: 25,
    breakDuration: 5,
    cycles: 4,
    description: "25min focus, 5min break, 4 cycles",
  },
  {
    name: "Extended Focus",
    focusDuration: 45,
    breakDuration: 15,
    cycles: 3,
    description: "45min focus, 15min break, 3 cycles",
  },
  {
    name: "Quick Sprint",
    focusDuration: 15,
    breakDuration: 5,
    cycles: 6,
    description: "15min focus, 5min break, 6 cycles",
  },
  {
    name: "Deep Work",
    focusDuration: 90,
    breakDuration: 20,
    cycles: 2,
    description: "90min focus, 20min break, 2 cycles",
  },
];

export default function SchedulingPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Form state for creating new scheduled session
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    focusDuration: 25,
    breakDuration: 5,
    cycles: 4,
    startTime: "09:00",
    daysOfWeek: [] as number[],
    isActive: true,
    autoStart: false,
    description: "",
  });

  // Fetch scheduled sessions from backend
  const { data: scheduledSessions = [], isLoading } = useQuery({
    queryKey: ["scheduling.getUserSessions"],
    queryFn: () => trpcClient.scheduling.getUserSessions.query(),
  });

  // Mutations for CRUD operations
  const createMutation = useMutation({
    mutationFn: (data: typeof formData) => trpcClient.scheduling.createSession.mutate(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scheduling.getUserSessions"] });
      setShowCreateForm(false);
      setFormData({
        name: "",
        focusDuration: 25,
        breakDuration: 5,
        cycles: 4,
        startTime: "09:00",
        daysOfWeek: [],
        isActive: true,
        autoStart: false,
        description: "",
      });
      toast({
        title: "Session scheduled",
        description: "Your new session schedule has been created",
      });
    },
    onError: (error) => {
      toast({
        title: "Error creating session",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => trpcClient.scheduling.deleteSession.mutate({ id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scheduling.getUserSessions"] });
      toast({
        title: "Session deleted",
        description: "Scheduled session has been removed",
      });
    },
    onError: (error) => {
      toast({
        title: "Error deleting session",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      trpcClient.scheduling.toggleActive.mutate({ id, isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scheduling.getUserSessions"] });
    },
    onError: (error) => {
      toast({
        title: "Error updating session",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleCreateSession = () => {
    if (!formData.name.trim()) {
      toast({
        title: "Name required",
        description: "Please enter a name for your scheduled session",
        variant: "destructive",
      });
      return;
    }

    if (formData.daysOfWeek.length === 0) {
      toast({
        title: "Days required",
        description: "Please select at least one day of the week",
        variant: "destructive",
      });
      return;
    }

    createMutation.mutate(formData);
  };

  const handleDeleteSession = (id: string) => {
    deleteMutation.mutate(id);
  };

  const handleToggleSession = (id: string) => {
    const session = scheduledSessions.find((s) => s.id === id);
    if (session) {
      toggleMutation.mutate({ id, isActive: !session.isActive });
    }
  };

  const handleApplyPreset = (preset: (typeof PRESET_SCHEDULES)[0]) => {
    setFormData({
      ...formData,
      name: preset.name,
      focusDuration: preset.focusDuration,
      breakDuration: preset.breakDuration,
      cycles: preset.cycles,
      description: preset.description,
    });
  };

  const handleDayToggle = (day: number) => {
    const newDays = formData.daysOfWeek.includes(day)
      ? formData.daysOfWeek.filter((d) => d !== day)
      : [...formData.daysOfWeek, day].sort();

    setFormData({ ...formData, daysOfWeek: newDays });
  };

  const formatDaysOfWeek = (days: number[]) => {
    if (days.length === 7) return "Every day";
    if (days.length === 5 && days.every((d) => d >= 1 && d <= 5)) return "Weekdays";
    if (days.length === 2 && days.includes(0) && days.includes(6)) return "Weekends";
    return days.map((d) => DAYS_OF_WEEK[d].label).join(", ");
  };

  const getNextRunTime = (session: ScheduledSession) => {
    // Simple implementation - in real app this would calculate the next occurrence
    const today = new Date();
    const currentDay = today.getDay();

    if (session.daysOfWeek.includes(currentDay)) {
      const [hours, minutes] = session.startTime.split(":").map(Number);
      const sessionTime = new Date(today);
      sessionTime.setHours(hours, minutes, 0, 0);

      if (sessionTime > today) {
        return `Today at ${session.startTime}`;
      }
    }

    // Find next day
    for (let i = 1; i <= 7; i++) {
      const nextDay = (currentDay + i) % 7;
      if (session.daysOfWeek.includes(nextDay)) {
        const dayName = DAYS_OF_WEEK[nextDay].label;
        return `${dayName} at ${session.startTime}`;
      }
    }

    return "Not scheduled";
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Session Scheduling</h1>
          <p className="mt-2 text-muted-foreground">
            Set up automatic focus sessions to maintain consistent productivity habits
          </p>
        </div>
        <Button onClick={() => setShowCreateForm(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          New Schedule
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div className="text-2xl font-bold">{scheduledSessions.length}</div>
            </div>
            <p className="text-xs text-muted-foreground">Total Schedules</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Play className="h-4 w-4 text-green-600" />
              <div className="text-2xl font-bold">
                {scheduledSessions.filter((s) => s.isActive).length}
              </div>
            </div>
            <p className="text-xs text-muted-foreground">Active Schedules</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-blue-600" />
              <div className="text-2xl font-bold">
                {scheduledSessions.filter((s) => s.autoStart).length}
              </div>
            </div>
            <p className="text-xs text-muted-foreground">Auto-start Enabled</p>
          </CardContent>
        </Card>
      </div>

      {/* Create New Schedule Form */}
      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle>Create New Schedule</CardTitle>
            <CardDescription>
              Set up a recurring focus session schedule that fits your routine
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Preset Templates */}
            <div>
              <Label className="text-sm font-medium">Quick Start Templates</Label>
              <div className="mt-2 grid grid-cols-1 gap-3 md:grid-cols-2">
                {PRESET_SCHEDULES.map((preset) => (
                  <Card
                    key={preset.name}
                    className="cursor-pointer hover:bg-accent"
                    onClick={() => handleApplyPreset(preset)}
                  >
                    <CardContent className="pt-4">
                      <div className="font-medium">{preset.name}</div>
                      <div className="text-sm text-muted-foreground">{preset.description}</div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            <Separator />

            {/* Basic Settings */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="session-name">Session Name</Label>
                <Input
                  id="session-name"
                  placeholder="e.g., Morning Focus"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Input
                  id="description"
                  placeholder="Brief description of this session"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
            </div>

            {/* Session Configuration */}
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <div className="space-y-2">
                <Label htmlFor="focus-duration">Focus (min)</Label>
                <Input
                  id="focus-duration"
                  type="number"
                  min="5"
                  max="180"
                  value={formData.focusDuration}
                  onChange={(e) =>
                    setFormData({ ...formData, focusDuration: parseInt(e.target.value) || 25 })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="break-duration">Break (min)</Label>
                <Input
                  id="break-duration"
                  type="number"
                  min="1"
                  max="60"
                  value={formData.breakDuration}
                  onChange={(e) =>
                    setFormData({ ...formData, breakDuration: parseInt(e.target.value) || 5 })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cycles">Cycles</Label>
                <Input
                  id="cycles"
                  type="number"
                  min="1"
                  max="10"
                  value={formData.cycles}
                  onChange={(e) =>
                    setFormData({ ...formData, cycles: parseInt(e.target.value) || 4 })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="start-time">Start Time</Label>
                <Input
                  id="start-time"
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                />
              </div>
            </div>

            {/* Days of Week */}
            <div className="space-y-2">
              <Label>Days of Week</Label>
              <div className="flex flex-wrap gap-2">
                {DAYS_OF_WEEK.map((day) => (
                  <Badge
                    key={day.value}
                    variant={formData.daysOfWeek.includes(day.value) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => handleDayToggle(day.value)}
                  >
                    {day.label}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Options */}
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <Switch
                  id="auto-start"
                  checked={formData.autoStart}
                  onCheckedChange={(checked) => setFormData({ ...formData, autoStart: checked })}
                />
                <Label htmlFor="auto-start">Auto-start sessions</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="is-active"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                />
                <Label htmlFor="is-active">Enable schedule</Label>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowCreateForm(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateSession}>Create Schedule</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Scheduled Sessions List */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Your Schedules</h2>

        {scheduledSessions.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center">
              <Calendar className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
              <h3 className="mb-2 text-lg font-medium">No schedules yet</h3>
              <p className="mb-4 text-muted-foreground">
                Create your first scheduled session to automate your focus routine
              </p>
              <Button
                onClick={() => setShowCreateForm(true)}
                className="mx-auto flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Create Schedule
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {scheduledSessions.map((session) => (
              <Card key={session.id} className={cn("", !session.isActive && "opacity-60")}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold">{session.name}</h3>
                        <Badge variant={session.isActive ? "default" : "secondary"}>
                          {session.isActive ? "Active" : "Inactive"}
                        </Badge>
                        {session.autoStart && (
                          <Badge variant="outline" className="border-green-600 text-green-600">
                            Auto-start
                          </Badge>
                        )}
                      </div>
                      {session.description && (
                        <p className="text-sm text-muted-foreground">{session.description}</p>
                      )}
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>
                          {session.focusDuration}min focus, {session.breakDuration}min break
                        </span>
                        <span>•</span>
                        <span>{session.cycles} cycles</span>
                        <span>•</span>
                        <span>{formatDaysOfWeek(session.daysOfWeek)}</span>
                        <span>•</span>
                        <span>starts at {session.startTime}</span>
                      </div>
                      {session.isActive && (
                        <div className="flex items-center gap-1 text-sm text-blue-600">
                          <Clock className="h-3 w-3" />
                          Next: {getNextRunTime(session)}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={session.isActive}
                        onCheckedChange={() => handleToggleSession(session.id)}
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteSession(session.id)}
                        className="text-red-600 hover:bg-red-50 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Help Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            How Session Scheduling Works
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <h4 className="mb-2 font-medium">🕐 Scheduling</h4>
              <p className="text-sm text-muted-foreground">
                Set specific times and days for your focus sessions. The app will remind you when
                it's time to start.
              </p>
            </div>
            <div>
              <h4 className="mb-2 font-medium">🚀 Auto-start</h4>
              <p className="text-sm text-muted-foreground">
                Enable auto-start to have sessions begin automatically at the scheduled time without
                manual intervention.
              </p>
            </div>
            <div>
              <h4 className="mb-2 font-medium">🔄 Cycles</h4>
              <p className="text-sm text-muted-foreground">
                Set how many focus-break cycles you want. After each focus period, you'll get a
                break before the next cycle.
              </p>
            </div>
            <div>
              <h4 className="mb-2 font-medium">📅 Recurring</h4>
              <p className="text-sm text-muted-foreground">
                Schedules repeat weekly on the selected days, helping you build consistent
                productivity habits.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
