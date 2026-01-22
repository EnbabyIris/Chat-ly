import { Bell } from 'lucide-react';

export const NotificationBell = () => {
  return (
    <div className="relative">
      <button
        className="relative bg-white rounded-xl border border-gray-200 p-2.5 cursor-pointer hover:bg-neutral-50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
        aria-label="Notifications"
      >
        <Bell className="w-4 h-4 text-neutral-600" />
      </button>
    </div>
  );
};