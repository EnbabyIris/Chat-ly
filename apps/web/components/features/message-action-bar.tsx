import { FiFile } from "react-icons/fi";
import { MdLocationOn, MdMic } from "react-icons/md";
import { motion, AnimatePresence } from "framer-motion";
import React, { useState, useEffect } from "react";
import { MoreVertical } from "lucide-react";

interface MessageActionBarProps {
  aiMessage?: string;
  currentMessage?: string;
  isListening?: boolean;
  isGettingLocation?: boolean;
  isAiLoading?: boolean;
  aiError?: string | null;
  handleAISuggestionClick?: () => void;
  handleFileUpload?: () => void;
  toggleListening?: () => void;
  handleSendLocation?: () => void;
}

const MessageActionBar = ({
  aiMessage = "",
  currentMessage = "",
  isListening = false,
  isGettingLocation = false,
  isAiLoading = false,
  aiError = null,
  handleAISuggestionClick = () => {},
  handleFileUpload = () => {},
  toggleListening = () => {},
  handleSendLocation = () => {},
}: MessageActionBarProps) => {
  const [displayText, setDisplayText] = useState(aiMessage);
  const [isRemoving, setIsRemoving] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [isTabPressed, setIsTabPressed] = useState(false);

  // Update display text when aiMessage changes - show completion preview
  React.useEffect(() => {
    if (!aiMessage && displayText) {
      setIsRemoving(true);
      const timer = setTimeout(() => {
        setDisplayText("");
        setIsRemoving(false);
      }, displayText.length * 10 + 100);

      return () => clearTimeout(timer);
    } else if (aiMessage) {
      setIsRemoving(false);
      // Show the completion with current message for preview
      const currentText = currentMessage.trim();
      const completion = aiMessage.trim();
      const preview = currentText ? `${currentText} ${completion}` : completion;
      setDisplayText(preview);
    }
  }, [aiMessage, displayText, currentMessage]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        e.preventDefault();
        setIsTabPressed(true);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        setIsTabPressed(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  return (
    <div className="relative py-1 w-full focus:outline-none outline-none bg-white ">
      {/* Desktop View - Horizontal Icons */}
      <div className="absolute left-2 top-1/2 gap-1 -translate-y-1/2 items-center z-10 hidden md:flex">
        <button
          className="h-6 w-6 flex items-center justify-center hover:bg-black/5 rounded transition-colors"
          aria-label="Upload File"
          onClick={handleFileUpload}
        >
          <FiFile className="h-4 w-4 text-[#a3a3a3] hover:text-neutral-500 transition-all duration-200" />
        </button>

        <div className="w-px h-4 bg-stone-300"></div>

        <button
          className="h-6 w-6 flex items-center justify-center hover:bg-black/5 rounded transition-colors"
          aria-label="Toggle Speech Recognition"
          onClick={toggleListening}
        >
          <MdMic className={`h-4 w-4 ${
            isListening
              ? "text-red-500"
              : "text-neutral-400 hover:text-neutral-500 transition-all duration-200"
          }`} />
        </button>

        <div className="w-px h-4 bg-stone-300"></div>

        <button
          className="h-6 w-6 flex items-center justify-center hover:bg-black/5 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Send Location"
          onClick={handleSendLocation}
          disabled={isGettingLocation}
        >
          <MdLocationOn className="h-4 w-4 text-[#a3a3a3] hover:text-neutral-500 transition-all duration-200" />
        </button>
        <div className="w-px h-4 bg-stone-300"></div>
      </div>

      {/* Mobile View - Three Dots Menu */}
      <div className="absolute left-2 top-1/2 -translate-y-1/2 z-10 flex md:hidden">
        <div className="relative">
          <button
            className="h-6 w-6 flex items-center justify-center hover:bg-black/5 rounded transition-colors"
            aria-label="More options"
            onClick={() => setShowMobileMenu(!showMobileMenu)}
          >
            <MoreVertical className="h-4 w-4 text-[#a3a3a3]" />
          </button>
          
          {showMobileMenu && (
            <div className="absolute bottom-8 left-0 bg-white border border-neutral-200 shadow-lg min-w-[120px] rounded-md p-1">
              <button 
                className="flex items-center gap-2 w-full px-2 py-1.5 text-sm hover:bg-neutral-50 rounded-sm"
                onClick={handleFileUpload}
              >
                <FiFile className="h-4 w-4 text-[#a3a3a3]" />
                <span className="text-neutral-600">Upload File</span>
              </button>
              <div className="h-px bg-neutral-200 my-1" />
              <button 
                className="flex items-center gap-2 w-full px-2 py-1.5 text-sm hover:bg-neutral-50 rounded-sm"
                onClick={toggleListening}
              >
                <MdMic className={`h-4 w-4 ${
                  isListening ? "text-red-500" : "text-[#a3a3a3]"
                }`} />
                <span className={`text-sm ${isListening ? "text-red-500" : "text-neutral-600"}`}>
                  {isListening ? "Stop Recording" : "Voice Input"}
                </span>
              </button>
              <div className="h-px bg-neutral-200 my-1" />
              <button 
                className="flex items-center gap-2 w-full px-2 py-1.5 text-sm hover:bg-neutral-50 rounded-sm disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleSendLocation}
                disabled={isGettingLocation}
              >
                <MdLocationOn className="h-4 w-4 text-[#a3a3a3]" />
                <span className="text-neutral-600">Send Location</span>
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="relative flex items-center rounded-md bg pr-4 ml-10 md:ml-28">
        <div
          onClick={handleAISuggestionClick}
          style={{boxShadow : 'inset 0 1px 2px 0 rgba(0, 0, 0, 0.1)'}}
          className="text-sm w-full px-2 pr-16 bg-neutral-100 rounded-md text-neutral-400 cursor-pointer min-h-[28px] flex items-center"
        >
          <AnimatePresence mode='popLayout'>
            {isAiLoading ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.05 }}
                className="text-neutral-400"
              >
                Getting AI suggestion...
              </motion.div>
            ) : aiError ? (
              <motion.div
                key="error"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="text-red-400"
              >
                AI suggestion unavailable
              </motion.div>
            ) : displayText ? (
              <motion.div
                key="text"
                initial={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.1 }}
                className="whitespace-pre-wrap overflow-hidden break-words"
              >
                {displayText.split("").map((char, index) => (
                  <motion.span
                    key={`${displayText}-${index}`}
                    initial={{ opacity: 1, y: 0, scale: 1 }}
                    animate={
                      isRemoving
                        ? { opacity: 0, y: -4, scale: 0.8 }
                        : { opacity: 1, y: 0, scale: 1 }
                    }
                    transition={{
                      delay: isRemoving ? index * 0.003 : 0,
                      duration: 0.2,
                      ease: "easeInOut"
                    }}
                    style={{ display: "inline-block" }}
                  >
                    {char === " " ? "\u00A0" : char}
                  </motion.span>
                ))}
              </motion.div>
            ) : (
              <motion.span
                key="placeholder"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2 }}
                className="text-neutral-400"
              >
                AI suggestion will appear here...
              </motion.span>
            )}
          </AnimatePresence>
        </div>
        <div
          style={{
            boxShadow: isTabPressed
              ? "inset 0 1.5px 3px 0 rgba(255, 255, 255, 0.3), 0 2px 3px 0 rgba(0, 0, 0, 0.1)"
              : "inset 0 1.5px 3px 0 rgba(255, 255, 255, 0.5), 0 2px 3px 0 rgba(0, 0, 0, 0.2)",
            transform: isTabPressed ? 'scale(0.95)' : 'scale(1)',
            transition: 'transform 0.1s ease, box-shadow 0.1s ease'
          }}
          className="absolute bg-white rounded-sm h-fit px-1 right-5 top-1/2 -translate-y-1/2 text-xs flex items-center text-neutral-500 font-medium border border-neutral-200"
        >
          Tab
          <img 
            src="https://static.thenounproject.com/png/enter-icon-3552033-512.png" 
            alt="enter icon" 
            width="18" 
            height="18" 
            fetchPriority="high"
            className="object-contain opacity-50"
          />
        </div>
      </div>
    </div>
  );
};

export default MessageActionBar;