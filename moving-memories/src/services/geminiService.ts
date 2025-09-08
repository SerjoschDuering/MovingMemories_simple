import { GoogleGenAI } from '@google/genai';
import type { GeminiImageResponse } from '../types';
import { getEnhancementPrompt, getVideoPrompt } from '../config/prompts';

type CandidatePart = {
  text?: string;
  inlineData?: {
    mimeType: string;
    data: string;
  };
};

type StreamChunk = {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
  }>;
};

class GeminiService {
  private ai: GoogleGenAI | null = null;
  
  /**
   * Initialize the service with an API key
   */
  init(providedApiKey?: string): void {
    if (!providedApiKey) {
      throw new Error('API key is required. Please provide your Gemini API key.');
    }
    this.ai = new GoogleGenAI({ apiKey: providedApiKey });
  }
  
  /**
   * Check if the service is initialized
   */
  isInitialized(): boolean {
    return this.ai !== null;
  }
  
  /**
   * Enhance an image using Gemini 2.5 Flash Image Preview
   */
  async enhanceImage(
    base64Image: string, 
    mimeType: string = 'image/jpeg',
    userNote?: string
  ): Promise<GeminiImageResponse> {
    if (!this.ai) {
      throw new Error('Gemini service not initialized. Please provide an API key.');
    }
    
    const instruction = getEnhancementPrompt(userNote);
    console.log('[Gemini] enhancement prompt:', instruction);
    
    try {
      // Try different content structures - array format like in the docs
      const prompt = [
        { text: instruction },
        {
          inlineData: {
            mimeType: mimeType,
            data: base64Image
          }
        }
      ];
      
      const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash-image-preview',
        contents: prompt
      });

      console.log('[Gemini] Full API response:', JSON.stringify(response, null, 2));
      const parts = (response.candidates?.[0]?.content?.parts as CandidatePart[] | undefined) || [];
      console.log('[Gemini] Response parts count:', parts.length);
      
      const images: string[] = [];
      let caption = '';
      
      for (const part of parts) {
        console.log('[Gemini] Processing part:', {
          hasText: !!part.text,
          hasInlineData: !!part.inlineData,
          inlineDataKeys: part.inlineData ? Object.keys(part.inlineData) : []
        });
        
        if (part.text) {
          caption += part.text + '\n';
        }
        
        const inline = part.inlineData;
        if (inline && inline.data && inline.mimeType) {
          console.log('[Gemini] Found image data! MimeType:', inline.mimeType);
          const dataUrl = `data:${inline.mimeType};base64,${inline.data}`;
          images.push(dataUrl);
        }
      }
      
      if (images.length === 0) {
        console.warn('[Gemini] No enhanced images returned from API, using original image');
        console.log('[Gemini] API response parts:', parts);
        const enhancedUrl = `data:${mimeType};base64,${base64Image}`;
        images.push(enhancedUrl);
        
        if (!caption) {
          caption = 'Image processed successfully';
        }
      } else {
        console.log('[Gemini] Successfully received', images.length, 'enhanced image(s)');
      }
      
      return {
        images,
        caption: caption.trim(),
      };
      
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('quota')) {
          throw new Error('API quota exceeded. Please check your Gemini API usage limits.');
        }
        if (error.message.includes('safety')) {
          throw new Error('Image was rejected for safety reasons. Please try a different image.');
        }
        if (error.message.includes('key')) {
          throw new Error('Invalid API key. Please check your Gemini API key.');
        }
      }
      
      throw new Error('Failed to enhance image. Please try again.');
    }
  }

  /**
   * Create a realistic 5-second motion description from an image (uses prompts.ts)
   */
  async generateVideoPromptFromImage(
    imageDataUrl: string,
    userNote?: string
  ): Promise<string> {
    if (!this.ai) {
      throw new Error('Gemini service not initialized. Please provide an API key.');
    }

    const prompt = getVideoPrompt(userNote);
    console.log('[Gemini] video prompt (from image):', prompt);

    try {
      let base64: string;
      let mimeType: string;

      if (imageDataUrl.startsWith('data:')) {
        // It's a data URL
        const mimeMatch = imageDataUrl.match(/^data:([^;]+);base64,/i);
        mimeType = mimeMatch?.[1] || 'image/jpeg';
        base64 = imageDataUrl.split(',')[1] || '';
        
        if (!base64) {
          throw new Error('Invalid data URL: missing base64 data');
        }
      } else if (imageDataUrl.startsWith('http')) {
        // It's a regular URL - need to fetch and convert to base64
        console.log('[Gemini] Fetching image from URL:', imageDataUrl);
        const response = await fetch(imageDataUrl);
        if (!response.ok) {
          throw new Error(`Failed to fetch image: ${response.status}`);
        }
        const blob = await response.blob();
        mimeType = blob.type || 'image/jpeg';
        
        // Convert blob to base64
        const reader = new FileReader();
        const dataUrl = await new Promise<string>((resolve, reject) => {
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
        base64 = dataUrl.split(',')[1] || '';
      } else {
        throw new Error('Invalid image format: must be either a data URL or HTTP URL');
      }

      // Use the correct API format for Gemini
      const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
          {
            parts: [
              { text: prompt },
              {
                inlineData: {
                  mimeType: mimeType,
                  data: base64
                }
              }
            ]
          }
        ],
      });

      const text = response.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
      if (!text) throw new Error('No motion prompt was generated');
      return text.replace(/^["']|["']$/g, '').replace(/\n+/g, ' ').trim();
    } catch (error) {
      console.error('[Gemini] generateVideoPromptFromImage error:', error);
      if (error instanceof Error) {
        // Don't wrap the error again if it's already properly formatted
        if (error.message.startsWith('ApiError:')) {
          throw error;
        }
        throw new Error(`ApiError: ${JSON.stringify({error: {code: 400, message: error.message, status: 'INVALID_ARGUMENT'}})}`);
      }
      throw error;
    }
  }
  
  /**
   * Generate a motion prompt for video generation
   */
  async generateMotionPrompt(
    imageDescription: string,
    userNote: string = ''
  ): Promise<string> {
    if (!this.ai) {
      throw new Error('Gemini service not initialized. Please provide an API key.');
    }
    
    const promptTemplate = getVideoPrompt(userNote);
    console.log('[Gemini] video prompt (text-only):', promptTemplate);
    
    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [promptTemplate, imageDescription],
      });
      
      const text = response.candidates?.[0]?.content?.parts?.[0]?.text || '';
      
      if (!text.trim()) {
        throw new Error('No motion prompt was generated');
      }
      
      const cleanPrompt = text.trim()
        .replace(/^["']|["']$/g, '')
        .replace(/\n+/g, ' ')
        .trim();
      
      return cleanPrompt;
      
    } catch (err) {
      if (err instanceof Error && err.message.includes('quota')) {
        throw new Error('API quota exceeded. Please check your Gemini API usage limits.');
      }
      
      throw new Error('Failed to generate motion prompt. Please try again.');
    }
  }
  
  /**
   * Generate a streaming motion prompt (for real-time UI updates)
   */
  async *generateMotionPromptStream(
    imageDescription: string,
    userNote: string = ''
  ): AsyncGenerator<string, string, unknown> {
    if (!this.ai) {
      throw new Error('Gemini service not initialized. Please provide an API key.');
    }
    
    const promptTemplate = getVideoPrompt(userNote);
    console.log('[Gemini] video prompt (stream):', promptTemplate);
    
    try {
      const stream = await this.ai.models.generateContentStream({
        model: 'gemini-2.5-flash',
        contents: [promptTemplate, imageDescription],
      });
      
      let fullText = '';
      
      for await (const chunk of stream as unknown as AsyncIterable<StreamChunk>) {
        const chunkText = chunk.candidates?.[0]?.content?.parts?.[0]?.text || '';
        if (chunkText) {
          fullText += chunkText;
          yield fullText.trim();
        }
      }
      
      return fullText.trim();
      
    } catch {
      throw new Error('Failed to generate motion prompt. Please try again.');
    }
  }
  
  /**
   * Test the API key by making a simple request
   */
  async testApiKey(): Promise<boolean> {
    if (!this.ai) {
      return false;
    }
    
    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: ['Hello'],
      });
      
      return !!(response.candidates && response.candidates.length > 0);
    } catch {
      return false;
    }
  }
}

// Export a singleton instance
export const geminiService = new GeminiService();

// Utility function to get image description from enhanced image
export function getImageDescription(caption: string, userNote: string = ''): string {
  if (caption && caption.trim()) {
    return caption.trim();
  }
  
  if (userNote && userNote.trim()) {
    return `A meaningful photograph with personal significance: ${userNote.trim()}`;
  }
  
  return 'A meaningful photograph that holds special memories';
}

// Enhanced prompts for different image types
export const IMAGE_ENHANCEMENT_PROMPTS = {
  portrait: 'Enhance this portrait with warm, natural lighting and gentle color grading. Bring out the subject\'s natural beauty while preserving authentic skin tones and genuine expressions. Add a subtle nostalgic quality.',
  
  landscape: 'Enhance this landscape with rich, natural colors and improved dynamic range. Bring out details in both shadows and highlights, add subtle warmth, and create a sense of peaceful, timeless beauty.',
  
  family: 'Enhance this family photo with warm, inviting tones that emphasize connection and joy. Improve lighting naturally, enhance facial expressions, and add a cozy, heartfelt quality that celebrates the relationship.',
  
  event: 'Enhance this special moment with vibrant yet natural colors. Improve lighting and contrast to highlight the celebration, while maintaining the authentic energy and emotion of the occasion.',
  
  nature: 'Enhance this nature scene with rich, saturated colors and improved clarity. Bring out natural textures and details, add subtle warmth to create an inviting, serene atmosphere.',
  
  vintage: 'Enhance this image while preserving its vintage character. Improve clarity and contrast gently, add warm nostalgic tones, and maintain the authentic period feel.',
} as const;