import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface GlobalSearchProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export const GlobalSearch = ({ searchQuery, onSearchChange }: GlobalSearchProps) => {
  return (
    <div className="relative shadow-chat-sidebar-header bg-white rounded-lg overflow-hidden  ">
      <Search className="absolute bg-gray-50 border-r border-gray-200 px-2 top-1/2 transform w-8 -translate-y-1/2 h-full  text-neutral-400" />
      <Input
        placeholder="Search chats or users..."
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        className="pl-10 bg-transparent border-none focus:ring-0 focus:border-none"
      />
    </div>
  );
};