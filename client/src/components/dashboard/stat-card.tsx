import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  change?: {
    value: string;
    type: "increase" | "decrease" | "neutral";
    text?: string;
  };
  className?: string;
}

export function StatCard({ title, value, icon, change, className }: StatCardProps) {
  return (
    <div className={cn("bg-white rounded-lg shadow-sm p-5 border border-gray-200", className)}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
        </div>
        <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
          {icon}
        </div>
      </div>
      {change && (
        <div className="mt-3 flex items-center text-sm">
          <span 
            className={cn(
              "font-medium flex items-center",
              change.type === "increase" && "text-success",
              change.type === "decrease" && "text-error",
              change.type === "neutral" && "text-warning"
            )}
          >
            {change.value}
          </span>
          {change.text && <span className="text-gray-500 ml-2">{change.text}</span>}
        </div>
      )}
    </div>
  );
}
