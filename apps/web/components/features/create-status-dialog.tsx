'use client';

import { useState } from 'react';
import { X, Camera, Plus, Type, Image, ImageIcon, MessageSquare, Send } from 'lucide-react';
import { motion } from 'framer-motion';
import { useCreateStatus } from '@/lib/api/queries';
import { useCloudinaryUpload } from '@/lib/cloudinary';

interface CreateStatusDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreateStatusDialog = ({ isOpen, onClose }: CreateStatusDialogProps) => {
  // Step-based wizard state
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  // Status creation state - computed based on content
  const getActiveTab = (): 'text' | 'image' | 'both' => {
    if (statusImage && statusText.trim()) return 'both';
    if (statusImage) return 'image';
    return 'text';
  };
  const [statusText, setStatusText] = useState('');
  const [statusImage, setStatusImage] = useState<string | null>(null);
  const [statusImageFile, setStatusImageFile] = useState<File | null>(null);

  const createStatusMutation = useCreateStatus();
  const { uploadImage, isConfigured } = useCloudinaryUpload();

  const handleNext = () => {
    if (currentStep < 3) {
      setCurrentStep((currentStep + 1) as 1 | 2 | 3);
    }
  };

  const handleSkip = () => {
    if (currentStep < 3) {
      setCurrentStep((currentStep + 1) as 1 | 2 | 3);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1: return !!statusImage; // Must have image to proceed to step 2
      case 2: return true; // Can always proceed from text step to post step
      case 3: return !!(statusText.trim() || statusImage); // Must have content to post
      default: return false;
    }
  };

  const handleSubmit = async () => {
    try {
      let imageUrl: string | undefined;

      // Upload image to Cloudinary if we have a file
      if (statusImageFile && isConfigured) {
        const uploadResult = await uploadImage(statusImageFile, { folder: 'status-images' });
        imageUrl = uploadResult.secure_url;
      }

      const statusData = {
        content: statusText.trim() || undefined,
        imageUrl: imageUrl,
      };

      await createStatusMutation.mutateAsync(statusData);
      onClose();
      // Reset form
      setStatusText('');
      setStatusImage(null);
      setStatusImageFile(null);
      setCurrentStep(1);
    } catch (error) {
      console.error('Failed to create status:', error);
      // Error handling will be shown by the mutation
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Left-top floating step indicator */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.2 }}
        className="fixed top-20 left-4 z-50 flex flex-col gap-3"
      >
        <div className="flex flex-col gap-2 p-3 bg-white rounded-xl border border-gray-200 shadow-lg">
          <div className={`flex items-center gap-3 p-2 rounded-lg transition-colors ${
            currentStep === 1 ? 'bg-green-50 border border-green-200' : 'bg-gray-50'
          }`}>
            <ImageIcon className={`w-4 h-4 ${
              currentStep === 1 ? 'text-green-600' : 'text-gray-400'
            }`} />
            <span className={`text-xs font-medium ${
              currentStep === 1 ? 'text-green-700' : 'text-gray-500'
            }`}>
              Image
            </span>
          </div>

          <div className={`flex items-center gap-3 p-2 rounded-lg transition-colors ${
            currentStep === 2 ? 'bg-green-50 border border-green-200' : 'bg-gray-50'
          }`}>
            <MessageSquare className={`w-4 h-4 ${
              currentStep === 2 ? 'text-green-600' : 'text-gray-400'
            }`} />
            <span className={`text-xs font-medium ${
              currentStep === 2 ? 'text-green-700' : 'text-gray-500'
            }`}>
              Text
            </span>
          </div>

          <div className={`flex items-center gap-3 p-2 rounded-lg transition-colors ${
            currentStep === 3 ? 'bg-green-50 border border-green-200' : 'bg-gray-50'
          }`}>
            <Send className={`w-4 h-4 ${
              currentStep === 3 ? 'text-green-600' : 'text-gray-400'
            }`} />
            <span className={`text-xs font-medium ${
              currentStep === 3 ? 'text-green-700' : 'text-gray-500'
            }`}>
              Post
            </span>
          </div>
        </div>
      </motion.div>

      <div
      style={{ zIndex: 99999 }}
      className="fixed inset-0 flex items-start justify-center pt-20 bg-black/20 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -10, scale: 0.97 }}
        transition={{
          duration: 0.15,
          ease: "easeOut",
        }}
        className="w-full max-w-md mx-4 bg-white rounded-2xl p-2 relative"
      >
        {/* Left side content type indicator */}
        <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-16 flex flex-col gap-2 p-2 bg-white rounded-xl border border-gray-200 ">
          <div
            className={`p-2 rounded-lg transition-colors ${
              getActiveTab() === 'text'
                ? 'bg-white shadow-sm'
                : 'bg-gray-50'
            }`}
          >
            <Type className={`w-4 h-4  text-neutral-400`} />
          </div>
          <div
            className={`p-2 rounded-lg transition-colors ${
              getActiveTab() === 'image'
                ? 'bg-white shadow-sm'
                : 'bg-gray-50'
            }`}
          >
            <Image className={`w-4 h-4 text-neutral-400`} />
          </div>
          <div
            className={`p-2 rounded-lg transition-colors ${
              getActiveTab() === 'both'
                ? 'bg-white shadow-sm'
                : 'bg-gray-50'
            }`}
          >
            <Plus className={`w-4 h-4 text-neutral-400`} />
          </div>
        </div>

        <div className="w-full p-2 bg-stone-100 rounded-xl border border-gray-200">
          {/* Header */}
            <button
              onClick={onClose}
              className="p-1 w-full hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 ml-auto  h-5 text-gray-500" />
            </button>

          {/* Form Content */}
          <div className="space-y-4">
            {/* Image Upload - Show in step 1 */}
            {currentStep >= 1 && (
              <div>
                <label className="block text-sm font-medium text-neutral-400 mb-1">
                  Status Image
                </label>
                {!statusImage ? (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center ">
                    <Camera className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600 mb-2">Click to upload an image</p>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setStatusImageFile(file);
                          const reader = new FileReader();
                          reader.onload = (e) => {
                            setStatusImage(e.target?.result as string);
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="hidden"
                      id="status-image-upload"
                    />
                    <label
                      htmlFor="status-image-upload"
                      className="inline-block px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 cursor-pointer transition-colors"
                    >
                      Choose Image
                    </label>
                  </div>
                ) : (
                  <div className="relative">
                    <img
                      src={statusImage}
                      alt="Status preview"
                      className="w-full h-72 object-cover rounded-lg"
                    />
                    <button
                      onClick={() => setStatusImage(null)}
                      className="absolute top-2 right-2 p-1 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Text Input - Show in step 2 and beyond */}
            {currentStep >= 2 && (
              <div>
                <label className="block text-sm font-medium text-neutral-400 mb-1">
                  Status Text
                </label>
                <textarea
                  value={statusText}
                  onChange={(e) => setStatusText(e.target.value)}
                  placeholder="What's on your mind?"
                  className="w-full text-neutral-400 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-400 focus:border-transparent outline-none resize-none"
                  rows={3}
                  maxLength={280}
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>{statusText.length}/280</span>
                </div>
              </div>
            )}
          </div>


          {/* Error Message */}
          {createStatusMutation.isError && (
            <p className="text-sm text-red-600 mt-3 text-center">
              Failed to create status. Please try again.
            </p>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 mt-6">
            {currentStep < 3 ? (
              <>
                <button
                  onClick={handleSkip}
                  className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Skip
                </button>
                <button
                  onClick={handleNext}
                  disabled={!canProceed()}
                  style={{boxShadow : "inset 0px 2px 7px rgba(255,255,255,0.5), 0px 2px 4px rgba(0,0,0,0.2)"}}
                  className="flex-1 px-4 py-2 bg-black  text-white  disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed rounded-lg transition-colors "
                >
                  Next
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setCurrentStep(2)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={!canProceed() || createStatusMutation.isPending}
                  className="flex-1 px-4 py-2 bg-green-500 text-white hover:bg-green-600 disabled:bg-green-300 disabled:cursor-not-allowed rounded-lg transition-colors"
                >
                  {createStatusMutation.isPending ? 'Posting...' : 'Post Status'}
                </button>
              </>
            )}
          </div>
        </div>
      </motion.div>
    </div>
    </>
  );
};