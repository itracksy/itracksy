import { AboutSection } from "@/pages/settings-page/components/AboutSection";
import { CustomizationSection } from "@/pages/settings-page/components/CustomizationSection";

export default function SettingsPage() {
  return (
    <div className="space-y-6 p-6">
      <CustomizationSection />

      <AboutSection />
    </div>
  );
}
