import { Bell } from 'lucide-react';

interface NotificationBellProps {
  count?: number;
}

export const NotificationBell = ({ count = 0 }: NotificationBellProps) => {
  return (
    <div className="relative bg-white rounded-xl border border-gray-200 p-2.5 cursor-pointer hover:bg-neutral-50 transition-colors">
      <Bell className="w-5 h-5 text-neutral-600" />
      {count > 0 && (
        <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
          <span className="text-xs font-medium text-white">
            {count > 9 ? '9+' : count}
          </span>
        </div>
      )}
    </div>
  );
};