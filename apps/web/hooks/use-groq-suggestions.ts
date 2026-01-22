import { useState, useEffect, useCallback } from 'react';
import { useDebouncedValue } from './use-debounced-value';

interface GroqSuggestionResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

interface UseGroqSuggestionsOptions {
  debounceDelay?: number;
  minChars?: number;
  apiKey?: string;
}

interface UseGroqSuggestionsReturn {
  suggestion: string;
  isLoading: boolean;
  error: string | null;
  clearSuggestion: () => void;
}

/**
 * Hook for getting AI suggestions from Groq API with debouncing
 *
 * @param text - The text to get suggestions for
 * @param options - Configuration options
 * @returns Object with suggestion, loading state, error, and clear function
 */
export function useGroqSuggestions(
  text: string,
  options: UseGroqSuggestionsOptions = {}
): UseGroqSuggestionsReturn {
  const {
    debounceDelay = 600,
    minChars = 3,
    apiKey = process.env.NEXT_PUBLIC_GROQ_API_KEY
  } = options;

  const [suggestion, setSuggestion] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Debounce the input text
  const debouncedText = useDebouncedValue(text, debounceDelay);

  const clearSuggestion = useCallback(() => {
    setSuggestion('');
    setError(null);
  }, []);

  const fetchSuggestion = useCallback(async (inputText: string) => {
    if (!inputText.trim() || inputText.length < minChars) {
      setSuggestion('');
      return;
    }

    if (!apiKey) {
      console.warn('Groq API key not provided');
      setError('API key not configured');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const requestBody = {
        model: 'llama-3.1-8b-instant', // Updated to non-deprecated model
        messages: [
          {
            role: 'system',
            content: 'You are a helpful AI assistant. Complete the user\'s message naturally and conversationally. Continue their sentence or add a logical follow-up that flows naturally from what they\'ve already written. Keep the completion under 100 characters total. Return ONLY the completion text that should be appended to their message - no quotes, no full rephrasing, just the continuation.'
          },
          {
            role: 'user',
            content: `Complete this message: "${inputText}"`
          }
        ],
        max_tokens: 100,
        temperature: 0.7,
      };

      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Groq API Error:', response.status, errorText);
        throw new Error(`API request failed: ${response.status}`);
      }

      const data: GroqSuggestionResponse = await response.json();

      if (data.choices && data.choices[0]?.message?.content) {
        let aiSuggestion = data.choices[0].message.content.trim();
        // Remove surrounding quotes if present
        aiSuggestion = aiSuggestion.replace(/^["']|["']$/g, '');
        setSuggestion(aiSuggestion);
      } else {
        setSuggestion('');
      }
    } catch (err) {
      console.error('Error fetching Groq suggestion:', err);
      setError(err instanceof Error ? err.message : 'Failed to get suggestion');
      setSuggestion('');
    } finally {
      setIsLoading(false);
    }
  }, [apiKey, minChars]);

  // Effect to trigger API call when debounced text changes
  useEffect(() => {
    fetchSuggestion(debouncedText);
  }, [debouncedText, fetchSuggestion]);

  // Clear suggestion when text is cleared
  useEffect(() => {
    if (!text.trim()) {
      clearSuggestion();
    }
  }, [text, clearSuggestion]);

  return {
    suggestion,
    isLoading,
    error,
    clearSuggestion,
  };
}