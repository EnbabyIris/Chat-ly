import { useState, useRef, useCallback } from 'react';
import { useRealTimeMessages } from './use-real-time-messages';
import { useCloudinaryUpload } from '../lib/cloudinary';
import { useGroqSuggestions } from './use-groq-suggestions';
import type { ChatListItem, Message, SendMessageDTO } from '../lib/shared';

// TypeScript declarations for Web Speech API
declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onstart: ((this: SpeechRecognition, ev: Event) => any) | null;
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
  onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => any) | null;
  onend: ((this: SpeechRecognition, ev: Event) => any) | null;
}

declare var SpeechRecognition: {
  prototype: SpeechRecognition;
  new(): SpeechRecognition;
};

interface SpeechRecognitionEvent extends Event {
  readonly resultIndex: number;
  readonly results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  readonly error: string;
  readonly message: string;
}

interface SpeechRecognitionResultList {
  readonly length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  readonly isFinal: boolean;
  readonly length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  readonly transcript: string;
  readonly confidence: number;
}

const useMessageInput = (
  selectedChat: ChatListItem | null,
  sendMessage: (message: string, messageType?: SendMessageDTO['messageType'], locationData?: { latitude: number; longitude: number; address?: string }) => void,
  sendFile: (file: File) => void,
  onTypingStart?: () => void,
  onTypingStop?: () => void
) => {
  // Get real-time messaging connection status
  const { isConnected } = useRealTimeMessages({
    selectedChatId: selectedChat?.id,
  });

  // Cloudinary upload hook
  const { uploadImage, isConfigured: isCloudinaryConfigured } = useCloudinaryUpload();

  const [newMessage, setNewMessage] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Groq AI suggestions with 600ms debounce
  const { suggestion: aiMessage, isLoading: isAiLoading, error: aiError, clearSuggestion } = useGroqSuggestions(newMessage, {
    debounceDelay: 600,
    minChars: 3,
  });
  
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const typingHandler = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const currentValue = e.target.value;
    setNewMessage(currentValue);
    // AI suggestions are now handled automatically by useGroqSuggestions hook
  }, []);

  const onKeyDown = useCallback((e: KeyboardEvent | { key: string }) => {
    if (e.key === 'Enter') {
      if ('preventDefault' in e) {
        e.preventDefault();
      }
      if (newMessage.trim()) {
        sendMessage(newMessage.trim(), 'text');
        setNewMessage('');
        clearSuggestion();
      }
    } else if (e.key === 'Tab' && aiMessage) {
      if ('preventDefault' in e) {
        e.preventDefault();
      }
      // Append the completion to the existing message instead of replacing
      const currentText = newMessage.trim();
      const completion = aiMessage.trim();
      const newText = currentText ? `${currentText} ${completion}` : completion;
      setNewMessage(newText);
      clearSuggestion();
    }
  }, [newMessage, aiMessage, sendMessage, clearSuggestion]);

  const handleAISuggestionClick = useCallback(() => {
    if (aiMessage) {
      // Append the completion to the existing message
      const currentText = newMessage.trim();
      const completion = aiMessage.trim();
      const newText = currentText ? `${currentText} ${completion}` : completion;
      setNewMessage(newText);
      clearSuggestion();
    }
  }, [aiMessage, clearSuggestion, newMessage]);

  const handleFileUpload = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileSelect = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !selectedChat) return;

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    // Check if it's an image and Cloudinary is configured
    if (file.type.startsWith('image/') && isCloudinaryConfigured) {
      try {
        setIsUploading(true);

        // Upload to Cloudinary
        const uploadResult = await uploadImage(file, {
          folder: 'chat-uploads',
        });

        // Send message with Cloudinary URL
        sendMessage(uploadResult.secure_url, 'image');

      } catch (error) {
        console.error('Image upload failed:', error);
        // Fallback to regular file upload if Cloudinary fails
        sendFile(file);
      } finally {
        setIsUploading(false);
      }
    } else {
      // For non-image files or when Cloudinary is not configured
      sendFile(file);
    }
  }, [selectedChat, isCloudinaryConfigured, uploadImage, sendMessage, sendFile]);

  const toggleListening = useCallback(() => {
    if (!isListening) {
      // Start speech recognition
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

      if (!SpeechRecognition) {
        console.error('Speech recognition not supported in this browser');
        return;
      }

      const recognition = new SpeechRecognition();

      // Configure speech recognition
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
        console.log('Speech recognition started');
      };

      recognition.onresult = (event) => {
        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          if (result && result[0]) {
            const transcript = result[0].transcript;
            if (result.isFinal) {
              finalTranscript += transcript;
            } else {
              interimTranscript += transcript;
            }
          }
        }

        // Update the text input with the recognized speech
        if (finalTranscript) {
          const currentText = newMessage;
          const newText = currentText ? `${currentText} ${finalTranscript}` : finalTranscript;
          setNewMessage(newText.trim());

        }
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
        console.log('Speech recognition ended');
      };

      // Store recognition instance for cleanup
      (window as any).__speechRecognition = recognition;

      // Start recognition
      recognition.start();
    } else {
      // Stop speech recognition
      const recognition = (window as any).__speechRecognition;
      if (recognition) {
        recognition.stop();
        (window as any).__speechRecognition = null;
      }
      setIsListening(false);
    }
  }, [isListening, newMessage]);

  const handleSendLocation = useCallback(() => {
    if (!navigator.geolocation) {
      console.error('Geolocation is not supported by this browser');
      return;
    }

    setIsGettingLocation(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        try {
          // Try to get address using reverse geocoding
          const response = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
          );
          const data = await response.json();

          const address = data.localityInfo?.administrative?.[2]?.name
            ? `${data.localityInfo.administrative[2].name}, ${data.countryName}`
            : `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;

          sendMessage('📍 Location shared', 'location', {
            latitude,
            longitude,
            address
          });
        } catch (error) {
          console.error('Failed to get address:', error);
          // Send location without address if geocoding fails
          sendMessage('📍 Location shared', 'location', {
            latitude,
            longitude
          });
        }

        setIsGettingLocation(false);
      },
      (error) => {
        console.error('Error getting location:', error);
        setIsGettingLocation(false);
        // Could show user-friendly error message here
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes
      }
    );
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
    isUploading,
    isAiLoading,
    aiError,
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
  };
};

export default useMessageInput;