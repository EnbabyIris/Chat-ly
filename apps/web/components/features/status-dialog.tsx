import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import type { StatusWithUser } from '@repo/shared/types';

interface StatusDialogProps {
  isOpen: boolean;
  onClose: () => void;
  statuses: StatusWithUser[];
  userName: string;
}

export const StatusDialog = ({ isOpen, onClose, statuses, userName }: StatusDialogProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const currentStatus = statuses[currentIndex];

  const nextStatus = () => {
    setCurrentIndex((prev) => (prev + 1) % statuses.length);
  };

  const prevStatus = () => {
    setCurrentIndex((prev) => (prev - 1 + statuses.length) % statuses.length);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') prevStatus();
    if (e.key === 'ArrowRight') nextStatus();
    if (e.key === 'Escape') onClose();
  };

  const renderStatusContent = () => {
    if (!currentStatus) return null;

    const { content, imageUrl } = currentStatus;

    // Text only status
    if (content && !imageUrl) {
      return (
        <div className="flex items-center justify-center h-full bg-black">
          <div className="text-center px-8 max-w-md">
            <p className="text-white text-2xl md:text-3xl font-medium leading-relaxed">
              {content}
            </p>
          </div>
        </div>
      );
    }

    // Image only status
    if (!content && imageUrl) {
      return (
        <div className="flex items-center justify-center h-full bg-black">
          <img
            src={imageUrl}
            alt="Status"
            className="max-w-full max-h-full object-contain rounded-xl"
          />
        </div>
      );
    }

    // Text + Image status
    if (content && imageUrl) {
      return (
        <div className="relative h-full bg-black">
          <img
            src={imageUrl}
            alt="Status"
            className="w-full h-full object-cover"
          />
          <div className="absolute bottom-0 left-0 right-0 bg-black/70 backdrop-blur-sm">
            <div className="p-6">
              <p className="text-white text-xl md:text-2xl font-medium leading-relaxed">
                {content}
              </p>
            </div>
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-50"
            onClick={onClose}
          />

          {/* Outer Container - White background with padding */}
          <motion.div layout className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <motion.div layout className="bg-white p-2 border border-neutral-400 rounded-xl max-w-2xl w-full max-h-[95vh] overflow-hidden">
              {/* Inner Container - Gray background with padding */}
              <div className="bg-gray-200 p-2 border border-neutral-400 rounded-lg h-full overflow-hidden">
                {/* Dialog */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                  className="bg-black rounded-lg overflow-hidden h-full relative"
                  onClick={(e) => e.stopPropagation()}
                  onKeyDown={handleKeyDown}
                  tabIndex={-1}
                >
                  {/* Header */}
                  <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-4 bg-linear-to-b from-black/50 to-transparent">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-neutral-600 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm font-medium">
                          {userName.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="text-white text-sm font-medium">{userName}</p>
                        <p className="text-white/70 text-xs">
                          {currentIndex + 1} of {statuses.length}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={onClose}
                      className="w-8 h-8 rounded-full bg-black/50 flex items-center justify-center text-white hover:bg-black/70 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Navigation buttons */}
                  {statuses.length > 1 && (
                    <>
                      <button
                        onClick={prevStatus}
                        className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-md border border-neutral-400 bg-white flex items-center justify-center text-black hover:bg-gray-100 transition-colors z-10 shadow-lg"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <button
                        onClick={nextStatus}
                        className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-md border border-neutral-400 bg-white flex items-center justify-center text-black hover:bg-gray-100 transition-colors z-10 shadow-lg"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </>
                  )}

                  {/* Floating status indicators */}
                  {statuses.length > 1 && (
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2 z-10">
                      {statuses.slice(0, 8).map((status, index) => (
                        <motion.div
                          key={status.id}
                          className={`w-8 h-8 rounded-sm border-2 transition-all duration-300 ${
                            index === currentIndex
                              ? 'bg-white border-white scale-125'
                              : 'bg-transparent border-white/50 hover:border-white/70'
                          }`}
                          whileHover={{ scale: index !== currentIndex ? 1.1 : 1.25 }}
                          whileTap={{ scale: index !== currentIndex ? 0.9 : 1.15 }}
                        >
                          {status.imageUrl && (
                            <motion.img
                              layout
                              src={status.imageUrl}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          )}
                        </motion.div>
                      ))}
                      {statuses.length > 8 && (
                        <div className="w-4 h-4 rounded-full border-2 border-white/30 flex items-center justify-center">
                          <span className="text-white/50 text-xs font-medium">
                            +{statuses.length - 8}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Status content */}
                  <div className="h-full">
                    {renderStatusContent()}
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};