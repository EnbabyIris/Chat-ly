import { MessageCircle } from 'lucide-react';

export const AppHeader = () => {
  return (
    <div className="flex items-center gap-3 bg-white rounded-lg border border-gray-200 px-4 py-3 shadow-sm">
      <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
        <MessageCircle className="w-5 h-5 text-white" />
      </div>
      <h1 className="text-xl font-semibold text-neutral-800 font-saira">
        Chat-ly
      </h1>
    </div>
  );
};