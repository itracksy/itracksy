import HourlyFocusChart from "./components/HourlyFocusChart";
import ProjectTimeChart from "./components/ProjectTimeChart";

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-tracksy-blue/5 to-tracksy-gold/5 dark:from-tracksy-blue/10 dark:to-tracksy-gold/10">
      <div className="container mx-auto p-6">
        <h1 className="mb-8 text-3xl font-bold text-tracksy-blue dark:text-white">
          Activity Dashboard
          <div className="mt-2 h-1 w-20 rounded bg-tracksy-gold dark:bg-tracksy-gold/70"></div>
        </h1>

        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <ProjectTimeChart />
          <HourlyFocusChart />
        </div>
      </div>
    </div>
  );
}
