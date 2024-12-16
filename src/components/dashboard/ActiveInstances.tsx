import { DashboardGraph } from "./DashboardGraph";

export async function ActiveInstances({ className }: { className?: string }) {
  return (
    <DashboardGraph title="Active Instances" className={className}>
      <div className="text-2xl font-bold">1</div>
    </DashboardGraph>
  );
}
