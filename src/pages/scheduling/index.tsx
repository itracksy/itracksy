/**
 * Session Scheduling Page - Simplified
 *
 * Design Philosophy:
 * 1. Focus on the main action: creating and managing schedules
 * 2. Show quick preset options for easy setup
 * 3. Clean list view for existing schedules
 */

import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import { Clock, Plus, Trash2, Edit, Calendar, Zap, Coffee, Brain } from "lucide-react";
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

      {/* Content */}
      <div className="flex-1 space-y-6 overflow-auto">
        {/* Empty State with Presets */}
        {scheduledSessions.length === 0 && (
          <Card className="border-dashed">
            <CardContent className="py-12">
              <div className="mb-6 text-center">
                <Calendar className="mx-auto mb-3 h-12 w-12 text-muted-foreground/50" />
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
