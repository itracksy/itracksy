import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";

interface Session {
  id: string;
  type: "focus" | "break";
  duration: number;
  startTime: Date;
  endTime: Date;
}

const mockSessions: Session[] = [
  {
    id: "1",
    type: "focus",
    duration: 25 * 60, // 25 minutes in seconds
    startTime: new Date("2024-03-20T10:00:00"),
    endTime: new Date("2024-03-20T10:25:00"),
  },
  {
    id: "2",
    type: "break",
    duration: 5 * 60, // 5 minutes in seconds
    startTime: new Date("2024-03-20T10:25:00"),
    endTime: new Date("2024-03-20T10:30:00"),
  },
  // Add more mock data as needed
];

const AchievementsPage: React.FC = () => {
  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    return `${minutes} min`;
  };

  const renderSessionCard = (session: Session) => (
    <Card key={session.id} className="mb-4">
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold capitalize">{session.type} Session</h3>
            <p className="text-sm text-muted-foreground">
              {format(session.startTime, "MMM d, yyyy h:mm a")}
            </p>
          </div>
          <div className="text-right">
            <p className="font-medium">{formatDuration(session.duration)}</p>
            <p className="text-sm text-muted-foreground">
              {format(session.startTime, "h:mm a")} - {format(session.endTime, "h:mm a")}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="container mx-auto py-8">
      <h1 className="mb-8 text-3xl font-bold">Achievements</h1>

      <Tabs defaultValue="today" className="space-y-4">
        <TabsList>
          <TabsTrigger value="today">Today</TabsTrigger>
          <TabsTrigger value="week">This Week</TabsTrigger>
          <TabsTrigger value="month">This Month</TabsTrigger>
        </TabsList>

        <TabsContent value="today" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Today's Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold">2</p>
                  <p className="text-sm text-muted-foreground">Focus Sessions</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">50 min</p>
                  <p className="text-sm text-muted-foreground">Total Focus Time</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Session History</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">{mockSessions.map(renderSessionCard)}</ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="week">
          <Card>
            <CardHeader>
              <CardTitle>Weekly Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Weekly statistics coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="month">
          <Card>
            <CardHeader>
              <CardTitle>Monthly Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Monthly statistics coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AchievementsPage;
