import { TrackingControls } from "@/components/tracking/TrackingControls";

export default function DashboardPage() {
  return (
    <div className="container mx-auto p-4">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dashboard 1</h1>
        <TrackingControls />
      </div>

      {/* Your existing dashboard content */}
    </div>
  );
}
