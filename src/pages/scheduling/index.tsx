/**
 * Session Scheduling Page - Simplified
 *
 * Design Philosophy:
 * 1. Focus on the main action: creating and managing schedules
 * 2. Show quick preset options for easy setup
 * 3. Clean list view for existing schedules
 */

import React, { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Clock,
  Plus,
  Trash2,
  Edit,
  Calendar as CalendarIcon,
  Zap,
  Coffee,
  Brain,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { trpcClient } from "@/utils/trpc";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

interface ScheduledSession {
  id: string;
  name: string;
  description?: string | null;
  focusDuration: number;
  breakDuration: number;
  cycles: number;
  startTime: string;
  daysOfWeek: number[];
  isActive: boolean;
  autoStart: boolean;
  userId: string;
  createdAt: number;
  updatedAt: number;
  lastRun?: number | null;
  nextRun?: number | null;
}

const DAYS_OF_WEEK = [
  { value: 0, label: "Sun", short: "S" },
  { value: 1, label: "Mon", short: "M" },
  { value: 2, label: "Tue", short: "T" },
  { value: 3, label: "Wed", short: "W" },
  { value: 4, label: "Thu", short: "T" },
  { value: 5, label: "Fri", short: "F" },
  { value: 6, label: "Sat", short: "S" },
];

const PRESET_SCHEDULES = [
  {
    name: "Pomodoro",
    focusDuration: 25,
    breakDuration: 5,
    cycles: 4,
    icon: Clock,
    description: "25min focus, 5min break",
  },
  {
    name: "Deep Work",
    focusDuration: 90,
    breakDuration: 20,
    cycles: 2,
    icon: Brain,
    description: "90min focus, 20min break",
  },
  {
    name: "Quick Sprint",
    focusDuration: 15,
    breakDuration: 5,
    cycles: 6,
    icon: Zap,
    description: "15min focus, 5min break",
  },
];

export default function SchedulingPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [showForm, setShowForm] = useState(false);
  const [editingSession, setEditingSession] = useState<ScheduledSession | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    focusDuration: 25,
    breakDuration: 5,
    cycles: 4,
    startTime: "09:00",
    daysOfWeek: [1, 2, 3, 4, 5] as number[], // Weekdays by default
    isActive: true,
    autoStart: true,
    description: "",
  });

  const { data: scheduledSessions = [], isLoading } = useQuery({
    queryKey: ["scheduling.getUserSessions"],
    queryFn: () => trpcClient.scheduling.getUserSessions.query(),
  });

  // Get focus stats for heatmap (last 3 months)
  const threeMonthsAgo = useMemo(() => {
    const date = new Date();
    date.setMonth(date.getMonth() - 3);
    date.setHours(0, 0, 0, 0);
    return date.getTime();
  }, []);

  const { data: dailyFocusStats = [] } = useQuery({
    queryKey: ["dashboard.getFocusPerformanceByPeriod", threeMonthsAgo, Date.now(), "daily"],
    queryFn: () =>
      trpcClient.dashboard.getFocusPerformanceByPeriod.query({
        startDate: threeMonthsAgo,
        endDate: Date.now(),
        period: "daily",
      }),
  });

  // Create a map of date -> focus minutes for quick lookup
  const focusStatsMap = useMemo(() => {
    const map = new Map<string, number>();
    dailyFocusStats.forEach((stat) => {
      // stat.date is the date string, stat.totalFocusTime is in seconds
      const dateKey = new Date(stat.date).toISOString().split("T")[0];
      const minutes = Math.round(stat.totalFocusTime / 60);
      map.set(dateKey, minutes);
    });
    return map;
  }, [dailyFocusStats]);

  // Get heatmap intensity level (0-4) based on focus minutes
  const getHeatmapLevel = (date: Date): number => {
    const dateKey = date.toISOString().split("T")[0];
    const minutes = focusStatsMap.get(dateKey) || 0;
    if (minutes === 0) return 0;
    if (minutes < 30) return 1; // < 30 min
    if (minutes < 60) return 2; // 30-60 min
    if (minutes < 120) return 3; // 1-2 hours
    return 4; // 2+ hours
  };

  // Heatmap colors (GitHub-style green)
  const heatmapColors: Record<number, string> = {
    0: "transparent",
    1: "hsl(142 76% 73%)", // Light green
    2: "hsl(142 76% 56%)", // Medium green
    3: "hsl(142 76% 42%)", // Dark green
    4: "hsl(142 76% 30%)", // Darkest green
  };

  const createMutation = useMutation({
    mutationFn: (data: typeof formData) => trpcClient.scheduling.createSession.mutate(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scheduling.getUserSessions"] });
      resetForm();
      toast({ title: "Schedule created", description: "Your focus schedule is now active" });
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: typeof formData }) =>
      trpcClient.scheduling.updateSession.mutate({ id, ...data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scheduling.getUserSessions"] });
      resetForm();
      toast({ title: "Schedule updated" });
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => trpcClient.scheduling.deleteSession.mutate({ id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scheduling.getUserSessions"] });
      toast({ title: "Schedule deleted" });
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      trpcClient.scheduling.toggleActive.mutate({ id, isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scheduling.getUserSessions"] });
    },
  });

  const resetForm = () => {
    setShowForm(false);
    setEditingSession(null);
    setFormData({
      name: "",
      focusDuration: 25,
      breakDuration: 5,
      cycles: 4,
      startTime: "09:00",
      daysOfWeek: [1, 2, 3, 4, 5],
      isActive: true,
      autoStart: true,
      description: "",
    });
  };

  const handleSubmit = () => {
    if (!formData.name.trim()) {
      toast({ title: "Name required", variant: "destructive" });
      return;
    }
    if (formData.daysOfWeek.length === 0) {
      toast({ title: "Select at least one day", variant: "destructive" });
      return;
    }

    if (editingSession) {
      updateMutation.mutate({ id: editingSession.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (session: ScheduledSession) => {
    setEditingSession(session);
    setFormData({
      name: session.name,
      focusDuration: session.focusDuration,
      breakDuration: session.breakDuration,
      cycles: session.cycles,
      startTime: session.startTime,
      daysOfWeek: session.daysOfWeek,
      isActive: session.isActive,
      autoStart: session.autoStart,
      description: session.description || "",
    });
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    setSessionToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (sessionToDelete) {
      deleteMutation.mutate(sessionToDelete);
      setDeleteDialogOpen(false);
      setSessionToDelete(null);
    }
  };

  const handleToggle = (id: string) => {
    const session = scheduledSessions.find((s) => s.id === id);
    if (session) {
      toggleMutation.mutate({ id, isActive: !session.isActive });
    }
  };

  const handlePreset = (preset: (typeof PRESET_SCHEDULES)[0]) => {
    setFormData({
      ...formData,
      name: preset.name,
      focusDuration: preset.focusDuration,
      breakDuration: preset.breakDuration,
      cycles: preset.cycles,
      description: preset.description,
    });
    setShowForm(true);
  };

  const handleDayToggle = (day: number) => {
    const newDays = formData.daysOfWeek.includes(day)
      ? formData.daysOfWeek.filter((d) => d !== day)
      : [...formData.daysOfWeek, day].sort();
    setFormData({ ...formData, daysOfWeek: newDays });
  };

  const formatDays = (days: number[]) => {
    if (days.length === 7) return "Every day";
    if (days.length === 5 && days.every((d) => d >= 1 && d <= 5)) return "Weekdays";
    if (days.length === 2 && days.includes(0) && days.includes(6)) return "Weekends";
    return days.map((d) => DAYS_OF_WEEK[d].label).join(", ");
  };

  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

  const getNextRun = (session: ScheduledSession) => {
    if (!session.isActive) return null;
    const today = new Date();
    const currentDay = today.getDay();

    if (session.daysOfWeek.includes(currentDay)) {
      const [hours, minutes] = session.startTime.split(":").map(Number);
      const sessionTime = new Date(today);
      sessionTime.setHours(hours, minutes, 0, 0);
      if (sessionTime > today) return `Today at ${session.startTime}`;
    }

    for (let i = 1; i <= 7; i++) {
      const nextDay = (currentDay + i) % 7;
      if (session.daysOfWeek.includes(nextDay)) {
        return `${DAYS_OF_WEEK[nextDay].label} at ${session.startTime}`;
      }
    }
    return null;
  };

  // Get sessions for selected date
  const sessionsForSelectedDate = useMemo(() => {
    if (!selectedDate) return [];
    const dayOfWeek = selectedDate.getDay();
    return scheduledSessions.filter((session) => session.daysOfWeek.includes(dayOfWeek));
  }, [selectedDate, scheduledSessions]);

  // Get days that have schedules (for highlighting in calendar)
  const scheduledDays = useMemo(() => {
    const days = new Set<number>();
    scheduledSessions.forEach((session) => {
      if (session.isActive) {
        session.daysOfWeek.forEach((day) => days.add(day));
      }
    });
    return days;
  }, [scheduledSessions]);

  // Custom day render to highlight scheduled days
  const isDayScheduled = (date: Date) => {
    return scheduledDays.has(date.getDay());
  };

  return (
    <div className="flex h-full flex-col p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Schedules</h1>
          <p className="text-sm text-muted-foreground">Automate your focus sessions</p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Schedule
        </Button>
      </div>

      {/* Content - Two Column Layout */}
      <div className="flex flex-1 gap-6 overflow-hidden">
        {/* Left: Calendar */}
        <div className="shrink-0">
          <Card>
            <CardContent className="p-3">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                modifiers={{
                  scheduled: (date) => isDayScheduled(date),
                  level1: (date) => getHeatmapLevel(date) === 1,
                  level2: (date) => getHeatmapLevel(date) === 2,
                  level3: (date) => getHeatmapLevel(date) === 3,
                  level4: (date) => getHeatmapLevel(date) === 4,
                }}
                modifiersStyles={{
                  scheduled: {
                    fontWeight: "bold",
                    textDecoration: "underline",
                    textDecorationColor: "hsl(var(--primary))",
                    textUnderlineOffset: "3px",
                  },
                  level1: {
                    backgroundColor: heatmapColors[1],
                    color: "hsl(142 76% 20%)",
                  },
                  level2: {
                    backgroundColor: heatmapColors[2],
                    color: "white",
                  },
                  level3: {
                    backgroundColor: heatmapColors[3],
                    color: "white",
                  },
                  level4: {
                    backgroundColor: heatmapColors[4],
                    color: "white",
                    fontWeight: "bold",
                  },
                }}
                className="rounded-md"
              />
              {/* Selected Day Info */}
              {selectedDate && (
                <div className="mt-3 border-t pt-3">
                  <div className="mb-2 text-sm font-medium">
                    {selectedDate.toLocaleDateString("en-US", {
                      weekday: "long",
                      month: "short",
                      day: "numeric",
                    })}
                  </div>

                  {/* Focus Time Stats */}
                  {(() => {
                    const dateKey = selectedDate.toISOString().split("T")[0];
                    const focusMinutes = focusStatsMap.get(dateKey) || 0;
                    const hours = Math.floor(focusMinutes / 60);
                    const mins = focusMinutes % 60;
                    return focusMinutes > 0 ? (
                      <div className="mb-2 flex items-center gap-2 rounded-md bg-green-500/10 px-2 py-1.5">
                        <div
                          className="h-3 w-3 rounded-sm"
                          style={{ backgroundColor: heatmapColors[getHeatmapLevel(selectedDate)] }}
                        />
                        <span className="text-xs font-medium text-green-700 dark:text-green-400">
                          {hours > 0 ? `${hours}h ${mins}m` : `${mins}m`} focused
                        </span>
                      </div>
                    ) : (
                      <p className="mb-2 text-xs text-muted-foreground">No focus time recorded</p>
                    );
                  })()}

                  {/* Scheduled Sessions */}
                  {sessionsForSelectedDate.length > 0 ? (
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-muted-foreground">Scheduled:</p>
                      {sessionsForSelectedDate.map((session) => (
                        <div
                          key={session.id}
                          className={cn(
                            "flex items-center justify-between rounded-md bg-muted/50 px-2 py-1.5 text-xs",
                            !session.isActive && "opacity-50"
                          )}
                        >
                          <span className="font-medium">{session.name}</span>
                          <span className="text-muted-foreground">{session.startTime}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">No sessions scheduled</p>
                  )}
                </div>
              )}

              {/* Heatmap Legend */}
              <div className="mt-3 border-t pt-3">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Less</span>
                  <div className="flex gap-1">
                    {[0, 1, 2, 3, 4].map((level) => (
                      <div
                        key={level}
                        className="h-3 w-3 rounded-sm border border-border/50"
                        style={{
                          backgroundColor: level === 0 ? "hsl(var(--muted))" : heatmapColors[level],
                        }}
                      />
                    ))}
                  </div>
                  <span>More</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right: Schedule List */}
        <div className="flex-1 space-y-6 overflow-auto">
          {/* Empty State with Presets */}
          {scheduledSessions.length === 0 && (
            <Card className="border-dashed">
              <CardContent className="py-12">
                <div className="mb-6 text-center">
                  <CalendarIcon className="mx-auto mb-3 h-12 w-12 text-muted-foreground/50" />
                  <h3 className="text-lg font-semibold">No schedules yet</h3>
                  <p className="text-sm text-muted-foreground">
                    Choose a preset to get started quickly
                  </p>
                </div>
                <div className="mx-auto grid max-w-lg gap-3">
                  {PRESET_SCHEDULES.map((preset) => (
                    <button
                      key={preset.name}
                      onClick={() => handlePreset(preset)}
                      className="flex items-center gap-4 rounded-lg border p-4 text-left transition-colors hover:bg-muted/50"
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                        <preset.icon className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <div className="font-medium">{preset.name}</div>
                        <div className="text-sm text-muted-foreground">{preset.description}</div>
                      </div>
                      <Badge variant="secondary">{preset.cycles} cycles</Badge>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Schedule List */}
          {scheduledSessions.length > 0 && (
            <div className="space-y-3">
              {scheduledSessions.map((session) => {
                const nextRun = getNextRun(session);
                return (
                  <Card
                    key={session.id}
                    className={cn("transition-opacity", !session.isActive && "opacity-60")}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between gap-4">
                        {/* Left: Info */}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="truncate font-semibold">{session.name}</h3>
                            {session.autoStart && (
                              <Badge variant="outline" className="shrink-0 text-xs">
                                Auto
                              </Badge>
                            )}
                          </div>
                          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                            <span>
                              {session.focusDuration}m focus / {session.breakDuration}m break
                            </span>
                            <span className="text-muted-foreground/50">•</span>
                            <span>{session.cycles} cycles</span>
                            <span className="text-muted-foreground/50">•</span>
                            <span>{formatDays(session.daysOfWeek)}</span>
                            <span className="text-muted-foreground/50">•</span>
                            <span>{session.startTime}</span>
                          </div>
                          {nextRun && (
                            <div className="mt-1 flex items-center gap-1 text-xs text-blue-600">
                              <Clock className="h-3 w-3" />
                              Next: {nextRun}
                            </div>
                          )}
                        </div>

                        {/* Right: Actions */}
                        <div className="flex shrink-0 items-center gap-2">
                          <Switch
                            checked={session.isActive}
                            onCheckedChange={() => handleToggle(session.id)}
                          />
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(session)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(session.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={showForm} onOpenChange={(open) => !open && resetForm()}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingSession ? "Edit Schedule" : "New Schedule"}</DialogTitle>
            <DialogDescription>
              {editingSession
                ? "Update your schedule settings"
                : "Set up a recurring focus session"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Presets (only for new) */}
            {!editingSession && (
              <div className="flex gap-2">
                {PRESET_SCHEDULES.map((preset) => (
                  <button
                    key={preset.name}
                    onClick={() =>
                      setFormData({
                        ...formData,
                        name: preset.name,
                        focusDuration: preset.focusDuration,
                        breakDuration: preset.breakDuration,
                        cycles: preset.cycles,
                        description: preset.description,
                      })
                    }
                    className={cn(
                      "flex-1 rounded-lg border p-2 text-center text-xs transition-colors hover:bg-muted/50",
                      formData.name === preset.name && "border-primary bg-primary/5"
                    )}
                  >
                    <preset.icon className="mx-auto mb-1 h-4 w-4" />
                    {preset.name}
                  </button>
                ))}
              </div>
            )}

            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                placeholder="e.g., Morning Focus"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            {/* Duration Settings */}
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label htmlFor="focus">Focus (min)</Label>
                <Input
                  id="focus"
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
                <Label htmlFor="break">Break (min)</Label>
                <Input
                  id="break"
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
            </div>

            {/* Time */}
            <div className="space-y-2">
              <Label htmlFor="time">Start Time</Label>
              <Input
                id="time"
                type="time"
                value={formData.startTime}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
              />
            </div>

            {/* Days */}
            <div className="space-y-2">
              <Label>Days</Label>
              <div className="flex gap-1">
                {DAYS_OF_WEEK.map((day) => (
                  <button
                    key={day.value}
                    type="button"
                    onClick={() => handleDayToggle(day.value)}
                    className={cn(
                      "flex h-9 w-9 items-center justify-center rounded-full text-sm font-medium transition-colors",
                      formData.daysOfWeek.includes(day.value)
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted hover:bg-muted/80"
                    )}
                  >
                    {day.short}
                  </button>
                ))}
              </div>
            </div>

            {/* Auto-start */}
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <Label htmlFor="autostart" className="cursor-pointer">
                  Auto-start
                </Label>
                <p className="text-xs text-muted-foreground">
                  Automatically start sessions at scheduled time
                </p>
              </div>
              <Switch
                id="autostart"
                checked={formData.autoStart}
                onCheckedChange={(checked) => setFormData({ ...formData, autoStart: checked })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={resetForm}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {editingSession ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Schedule</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this schedule. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
