import { useState } from "react";

interface GeminiResponse {
  candidates?: Array<{
    content: {
      parts: Array<{ text: string }>;
    };
  }>;
}

export interface TranslationOptions {
  text: string;
  targetLanguage: string;
  apiKey?: string;
}

export interface UseMessageTranslationReturn {
  translate: (options: TranslationOptions) => Promise<string>;
  isTranslating: boolean;
  error: string | null;
}

/**
 * Hook for translating message text using Gemini API
 */
export function useMessageTranslation(): UseMessageTranslationReturn {
  const [isTranslating, setIsTranslating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const translate = async ({
    text,
    targetLanguage,
    apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY,
  }: TranslationOptions): Promise<string> => {
    if (!text.trim()) {
      throw new Error("Text is required for translation");
    }

    if (!apiKey) {
      throw new Error("Gemini API key not configured");
    }

    setIsTranslating(true);
    setError(null);

    try {
      const languageNames: Record<string, string> = {
        en: "English",
        hn: "Hindi",
        fr: "French",
        es: "Spanish",
        de: "German",
      };

      const targetLangName = languageNames[targetLanguage] || targetLanguage;

      const requestBody = {
        contents: [
          {
            parts: [
              {
                text: `You are a professional translator. Translate the following text to ${targetLangName}. Return ONLY the translated text without any additional comments, explanations, or quotes.\n\n${text}`,
              },
            ],
          },
        ],
        generationConfig: {
          maxOutputTokens: 500,
          temperature: 0.3,
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
        console.error("Translation API Error:", response.status, errorText);
        throw new Error(`Translation failed: ${response.status}`);
      }

      const data: GeminiResponse = await response.json();

      if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
        const translatedText = data.candidates[0].content.parts[0].text.trim();
        return translatedText;
      } else {
        throw new Error("No translation received");
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Translation failed";
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsTranslating(false);
    }
  };

  return {
    translate,
    isTranslating,
    error,
  };
}
