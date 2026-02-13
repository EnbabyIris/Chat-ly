import { useState, useEffect, useCallback } from "react";
import { useDebouncedValue } from "./use-debounced-value";

interface GeminiResponse {
  candidates?: Array<{
    content: {
      parts: Array<{ text: string }>;
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
 * Hook for getting AI suggestions from Gemini API with debouncing
 *
 * @param text - The text to get suggestions for
 * @param options - Configuration options
 * @returns Object with suggestion, loading state, error, and clear function
 */
export function useGroqSuggestions(
  text: string,
  options: UseGroqSuggestionsOptions = {},
): UseGroqSuggestionsReturn {
  const {
    debounceDelay = 600,
    minChars = 3,
    apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY,
  } = options;

  const [suggestion, setSuggestion] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Debounce the input text
  const debouncedText = useDebouncedValue(text, debounceDelay);

  const clearSuggestion = useCallback(() => {
    setSuggestion("");
    setError(null);
  }, []);

  const fetchSuggestion = useCallback(
    async (inputText: string) => {
      if (!inputText.trim() || inputText.length < minChars) {
        setSuggestion("");
        return;
      }

      if (!apiKey) {
        console.warn("Gemini API key not provided");
        setError("API key not configured");
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const requestBody = {
          contents: [
            {
              parts: [
                {
                  text: `You are a helpful AI assistant. Complete the user's chat message naturally and conversationally. Continue their sentence or add a logical follow-up that flows naturally from what they've already written. Keep the completion under 100 characters total. Return ONLY the completion text that should be appended to their message - no quotes, no full rephrasing, just the continuation.\n\nComplete this message: "${inputText}"`,
                },
              ],
            },
          ],
          generationConfig: {
            maxOutputTokens: 100,
            temperature: 0.7,
          },
        };

        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(requestBody),
          },
        );

        if (!response.ok) {
          const errorText = await response.text();
          console.error("Gemini API Error:", response.status, errorText);
          throw new Error(`API request failed: ${response.status}`);
        }

        const data: GeminiResponse = await response.json();

        if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
          let aiSuggestion = data.candidates[0].content.parts[0].text.trim();
          // Remove surrounding quotes if present
          aiSuggestion = aiSuggestion.replace(/^["']|["']$/g, "");
          setSuggestion(aiSuggestion);
        } else {
          setSuggestion("");
        }
      } catch (err) {
        console.error("Error fetching Gemini suggestion:", err);
        setError(
          err instanceof Error ? err.message : "Failed to get suggestion",
        );
        setSuggestion("");
      } finally {
        setIsLoading(false);
      }
    },
    [apiKey, minChars],
  );

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
