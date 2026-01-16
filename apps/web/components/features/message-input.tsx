import { Input } from "react-chat-elements";
import { SendHorizontal as Send } from "lucide-react";
import { FiFile } from "react-icons/fi";
import { MdLocationOn, MdMic } from "react-icons/md";
import { useEffect } from "react";
import useMessageInput from "../../hooks/useMessageInput";
import MessageActionBar from "./message-action-bar";
import type { ChatListItem, SendMessageDTO } from '@repo/shared';

interface MessageInputProps {
  selectedChat: ChatListItem | null;
  sendMessage: (message: string, messageType?: SendMessageDTO['messageType'], locationData?: { latitude: number; longitude: number; address?: string }) => void;
  sendFile: (file: File) => void;
  onTypingStart?: () => void;
  onTypingStop?: () => void;
}

const MessageInput = ({ selectedChat, sendMessage, sendFile, onTypingStart, onTypingStop }: MessageInputProps) => {
  const {
    newMessage,
    aiMessage,
    isListening,
    isGettingLocation,
    isUploading,
    inputRef,
    fileInputRef,
    typingHandler,
    onKeyDown,
    handleAISuggestionClick,
    handleFileUpload,
    handleFileSelect,
    toggleListening,
    handleSendLocation,
    getTextarea,
    updateTextareaValue,
  } = useMessageInput(selectedChat, sendMessage, sendFile, onTypingStart, onTypingStop);

  // Attach keydown handler and sync textarea value
  useEffect(() => {
    const textarea = getTextarea();
    if (!textarea) return;

    textarea.addEventListener('keydown', onKeyDown);
    const timeoutId = setTimeout(() => updateTextareaValue(textarea, newMessage), 0);

    return () => {
      textarea.removeEventListener('keydown', onKeyDown);
      clearTimeout(timeoutId);
    };
  }, [inputRef, onKeyDown, newMessage, getTextarea, updateTextareaValue]);

  // Enhanced AI suggestion click handler
  const handleAIClick = () => {
    handleAISuggestionClick();
    setTimeout(() => {
      const textarea = getTextarea();
      if (textarea && aiMessage) updateTextareaValue(textarea, aiMessage);
    }, 0);
  };

  if (!selectedChat) return null;

  const rightButtons = (
    <button
      onClick={() => onKeyDown({ key: 'Enter' })}
      className="px-3 py-1 mr-4 mt-3 flex bg-black/70 rounded-md shadow-[inset_-1px_1px_2px_0_rgba(255,255,255,0.6),inset_1px_-1px_2px_0_rgba(0,0,0,0.4),0_1px_2px_0_rgba(0,0,0,0.3)] items-center justify-center transition-colors"
      aria-label="Send Message"
      disabled={!newMessage.trim()}
    >
      <Send className="h-4 w-4 text-white" />
    </button>
  );

  return (
    <div className="px-2 py-1 relative bg-neutral-100 border-t border border-gray-200">
       <div
      style={{
        maskImage: 'linear-gradient(to bottom, transparent, transparent , transparent ,red)',
      }}
       className="absolute  top-0 z-5 -translate-y-[100.5%]  left-0 w-full h-full  bg-neutral-100" />
      <div
        className="flex flex-col shadow-[0_0px_3px_0_rgba(0,0,0,0.1)] border-gray-200 items-stretch mb-1 relative border rounded-lg overflow-hidden mt-1"
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,audio/*,application/pdf"
          className="hidden"
          onChange={handleFileSelect}
          disabled={isUploading}
        />

        {/* React Chat Elements Input */}
        <div className="w-full flex rce-message-input">
          <Input
            referance={inputRef}
            placeholder="Enter a message.."
            value={newMessage}
            onChange={typingHandler}
            multiline={true}
            autoHeight={false}
            minHeight={2}
            maxHeight={120}
            className="flex w-full text-black  bg-white shadow-sm"
            rightButtons={rightButtons}
            inputStyle={{
              padding: "4px 12px",
              fontSize: "14px",
              lineHeight: "1.4",
              width: "100%",
              outline: "none",
              border: "none",
              boxShadow: "none",
            }}
          />
        </div>

        {/* AI Assistant Suggestion with Action Buttons */}
        <MessageActionBar
          aiMessage={aiMessage}
          isListening={isListening}
          isGettingLocation={isGettingLocation}
          handleAISuggestionClick={handleAIClick}
          handleFileUpload={handleFileUpload}
          toggleListening={toggleListening}
          handleSendLocation={handleSendLocation}
        />
      </div>
    </div>
  );
};

export default MessageInput;