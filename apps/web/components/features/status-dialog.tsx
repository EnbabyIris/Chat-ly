import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
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
  const dialogRef = useRef<HTMLDivElement>(null);

  const currentStatus = statuses[currentIndex];

  const nextStatus = () => {
    setCurrentIndex((prev) => (prev + 1) % statuses.length);
  };

  const prevStatus = () => {
    setCurrentIndex((prev) => (prev - 1 + statuses.length) % statuses.length);
  };

  // Global Escape key listener
  useEffect(() => {
    if (!isOpen) return;
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') prevStatus();
      if (e.key === 'ArrowRight') nextStatus();
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [isOpen, onClose]);

  // Auto-focus dialog when opened
  useEffect(() => {
    if (isOpen && dialogRef.current) {
      dialogRef.current.focus();
    }
  }, [isOpen]);

  // Reset index when statuses change
  useEffect(() => {
    setCurrentIndex(0);
  }, [statuses]);

  const getTimeAgo = (date: Date | string) => {
    const now = new Date();
    const then = new Date(date);
    const diffMin = Math.floor((now.getTime() - then.getTime()) / 60000);
    if (diffMin < 1) return 'Just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h ago`;
    return `${Math.floor(diffHr / 24)}d ago`;
  };

  const renderStatusContent = () => {
    if (!currentStatus) return null;

    const { content, imageUrl } = currentStatus;

    // Text only status
    if (content && !imageUrl) {
      return (
        <div className="flex items-center justify-center min-h-75 bg-neutral-50 rounded-lg border border-neutral-200">
          <div className="text-center px-8 max-w-md">
            <p className="text-neutral-800 text-xl md:text-2xl font-medium leading-relaxed">
              {content}
            </p>
          </div>
        </div>
      );
    }

    // Image only status
    if (!content && imageUrl) {
      return (
        <div className="flex items-center justify-center bg-neutral-50 rounded-lg border border-neutral-200 overflow-hidden">
          <img
            src={imageUrl}
            alt="Status"
            className="max-w-full max-h-[60vh] object-contain"
          />
        </div>
      );
    }

    // Text + Image status
    if (content && imageUrl) {
      return (
        <div className="bg-neutral-50 rounded-lg border border-neutral-200 overflow-hidden">
          <img
            src={imageUrl}
            alt="Status"
            className="w-full max-h-[50vh] object-contain bg-neutral-100"
          />
          <div className="p-4 border-t border-neutral-200">
            <p className="text-neutral-800 text-base md:text-lg leading-relaxed">
              {content}
            </p>
          </div>
        </div>
      );
    }

    return null;
  };

  const dialogContent = (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop with blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-9998"
            onClick={onClose}
          />

          {/* Dialog container */}
          <motion.div
            ref={dialogRef}
            tabIndex={-1}
            className="fixed inset-0 flex items-center justify-center z-9999 p-4"
            onClick={onClose}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: "spring", stiffness: 350, damping: 30 }}
              className="bg-white rounded-xl border border-neutral-200 shadow-xl max-w-lg w-full max-h-[90vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-200">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-neutral-100 rounded-full flex items-center justify-center border border-neutral-200">
                    <span className="text-sm font-medium text-neutral-600">
                      {userName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-neutral-800">{userName}</p>
                    <p className="text-[11px] text-neutral-400">
                      {currentStatus ? getTimeAgo(currentStatus.createdAt) : ''}
                      {statuses.length > 1 && ` · ${currentIndex + 1} of ${statuses.length}`}
                    </p>
                  </div>
                </div>

                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-lg bg-neutral-100 flex items-center justify-center text-neutral-500 hover:bg-neutral-200 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Progress bar for multiple statuses */}
              {statuses.length > 1 && (
                <div className="flex gap-1 px-4 pt-3">
                  {statuses.map((_, index) => (
                    <div
                      key={index}
                      className={`h-0.5 flex-1 rounded-full transition-colors ${
                        index === currentIndex ? 'bg-neutral-800' : index < currentIndex ? 'bg-neutral-400' : 'bg-neutral-200'
                      }`}
                    />
                  ))}
                </div>
              )}

              {/* Status content */}
              <div className="p-4">
                {renderStatusContent()}
              </div>

              {/* Navigation */}
              {statuses.length > 1 && (
                <div className="flex items-center justify-between px-4 pb-4">
                  <button
                    onClick={prevStatus}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm text-neutral-600 bg-neutral-100 rounded-lg hover:bg-neutral-200 transition-colors border border-neutral-200"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Prev
                  </button>
                  <button
                    onClick={nextStatus}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm text-neutral-600 bg-neutral-100 rounded-lg hover:bg-neutral-200 transition-colors border border-neutral-200"
                  >
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  // Render via portal to escape any parent stacking context
  if (typeof document === 'undefined') return null;
  return createPortal(dialogContent, document.body);
};