import { useState, useRef, useCallback } from 'react';

const useMessageInput = (
  selectedChat: any,
  sendMessage: (message: string) => void,
  sendFile: (file: File) => void,
  onTypingStart?: () => void,
  onTypingStop?: () => void
) => {
  const [newMessage, setNewMessage] = useState('');
  const [aiMessage, setAiMessage] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const typingHandler = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const previousValue = newMessage;
    const currentValue = e.target.value;
    setNewMessage(currentValue);

    // Handle typing indicators
    if (onTypingStart && onTypingStop) {
      if (previousValue.length === 0 && currentValue.length > 0) {
        // Started typing
        onTypingStart();
      } else if (previousValue.length > 0 && currentValue.length === 0) {
        // Stopped typing (cleared input)
        onTypingStop();
      }
    }

    // Simple AI suggestion logic
    const value = currentValue.toLowerCase();
    if (value.startsWith('hey') && value.length > 3) {
      setAiMessage('Hey, how are you doing today?');
    } else if (value.startsWith('can you') && value.length > 7) {
      setAiMessage('Can you help me with this task?');
    } else if (value.startsWith('what time') && value.length > 9) {
      setAiMessage('What time is the meeting scheduled?');
    } else {
      setAiMessage('');
    }
  }, [newMessage, onTypingStart, onTypingStop]);

  const onKeyDown = useCallback((e: KeyboardEvent | { key: string }) => {
    if (e.key === 'Enter') {
      e.preventDefault?.();
      if (newMessage.trim()) {
        sendMessage(newMessage.trim());
        setNewMessage('');
        setAiMessage('');
      }
    } else if (e.key === 'Tab' && aiMessage) {
      e.preventDefault?.();
      setNewMessage(aiMessage);
      setAiMessage('');
    }
  }, [newMessage, aiMessage, sendMessage]);

  const handleAISuggestionClick = useCallback(() => {
    if (aiMessage) {
      setNewMessage(aiMessage);
      setAiMessage('');
    }
  }, [aiMessage]);

  const handleFileUpload = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const toggleListening = useCallback(() => {
    setIsListening(prev => !prev);
    // In a real app, this would start/stop speech recognition
  }, []);

  const handleSendLocation = useCallback(() => {
    setIsGettingLocation(true);
    // Simulate getting location
    setTimeout(() => {
      setIsGettingLocation(false);
      sendMessage('📍 Location shared');
    }, 2000);
  }, [sendMessage]);

  const getTextarea = useCallback(() => {
    return inputRef.current;
  }, []);

  const updateTextareaValue = useCallback((textarea: HTMLTextAreaElement, value: string) => {
    if (textarea) {
      textarea.value = value;
      textarea.dispatchEvent(new Event('input', { bubbles: true }));
    }
  }, []);

  return {
    newMessage,
    aiMessage,
    isListening,
    isGettingLocation,
    inputRef,
    fileInputRef,
    typingHandler,
    onKeyDown,
    handleAISuggestionClick,
    handleFileUpload,
    toggleListening,
    handleSendLocation,
    getTextarea,
    updateTextareaValue,
  };
};

export default useMessageInput;