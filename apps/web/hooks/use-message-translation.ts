import { useState } from 'react';

interface TranslationResponse {
  choices: Array<{
    message: {
      content: string;
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
 * Hook for translating message text using Groq API
 */
export function useMessageTranslation(): UseMessageTranslationReturn {
  const [isTranslating, setIsTranslating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const translate = async ({ text, targetLanguage, apiKey = process.env.NEXT_PUBLIC_GROQ_API_KEY }: TranslationOptions): Promise<string> => {
    if (!text.trim()) {
      throw new Error('Text is required for translation');
    }

    if (!apiKey) {
      throw new Error('Groq API key not configured');
    }

    setIsTranslating(true);
    setError(null);

    try {
      const languageNames: Record<string, string> = {
        'en': 'English',
        'hn': 'Hindi',
        'fr': 'French',
        'es': 'Spanish',
        'de': 'German'
      };

      const targetLangName = languageNames[targetLanguage] || targetLanguage;

      const requestBody = {
        model: 'llama-3.1-8b-instant',
        messages: [
          {
            role: 'system',
            content: `You are a professional translator. Translate the given text to ${targetLangName}. Return ONLY the translated text without any additional comments, explanations, or quotes.`
          },
          {
            role: 'user',
            content: text
          }
        ],
        max_tokens: 500,
        temperature: 0.3,
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
        console.error('Translation API Error:', response.status, errorText);
        throw new Error(`Translation failed: ${response.status}`);
      }

      const data: TranslationResponse = await response.json();

      if (data.choices && data.choices[0]?.message?.content) {
        const translatedText = data.choices[0].message.content.trim();
        return translatedText;
      } else {
        throw new Error('No translation received');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Translation failed';
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