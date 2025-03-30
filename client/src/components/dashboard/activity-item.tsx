import { cn } from "@/lib/utils";
import { UsersIcon, DollarSignIcon, PackageIcon } from "lucide-react";

export type ActivityType = "student" | "expense" | "inventory";
export type ActivityAction = "create" | "update" | "delete";

interface ActivityItemProps {
  type: ActivityType;
  action: ActivityAction;
  title: string;
  timestamp: string;
}

export function ActivityItem({ type, action, title, timestamp }: ActivityItemProps) {
  const getIcon = () => {
    switch (type) {
      case "student":
        return (
          <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
            <UsersIcon className="h-4 w-4 text-primary" />
          </div>
        );
      case "expense":
        return (
          <div className="h-8 w-8 rounded-full bg-pink-100 flex items-center justify-center">
            <DollarSignIcon className="h-4 w-4 text-secondary" />
          </div>
        );
      case "inventory":
        return (
          <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
            <PackageIcon className="h-4 w-4 text-success" />
          </div>
        );
      default:
        return null;
    }
  };

  const getActionText = () => {
    switch (action) {
      case "create":
        return "created";
      case "update":
        return "updated";
      case "delete":
        return "deleted";
      default:
        return "modified";
    }
  };

  return (
    <li className="py-3 px-3 hover:bg-gray-50 rounded-md">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          {getIcon()}
        </div>
        <div className="ml-3 flex-1">
          <p className="text-sm text-gray-900">
            <span className={cn(
              type === "student" && "text-primary",
              type === "expense" && "text-secondary",
              type === "inventory" && "text-success",
              "font-medium mr-1"
            )}>
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </span>
            {getActionText()}: {title}
          </p>
          <p className="text-xs text-gray-500 mt-1">{timestamp}</p>
        </div>
      </div>
    </li>
  );
}
