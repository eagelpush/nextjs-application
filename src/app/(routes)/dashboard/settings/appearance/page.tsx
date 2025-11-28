import { AppearanceForm } from "./appearance-form";

export default function AppearancePage() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold tracking-tight">Appearance</h2>
        <p className="text-muted-foreground">
          Customize how the dashboard looks and feels. Your theme preference will be saved to your
          account.
        </p>
      </div>
      <AppearanceForm />
    </div>
  );
}
