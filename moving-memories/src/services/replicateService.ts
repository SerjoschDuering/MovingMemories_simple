import { getEnhancementPrompt } from '../config/prompts';

class ReplicateService {
  private apiToken: string | null = null;

  /**
   * Initialize with Replicate API token
   */
  init(token: string) {
    this.apiToken = token;
  }

  /**
   * Enhance image using Replicate's Nano Banana (Google's image model)
   */
  async enhanceImage(
    imageDataUrl: string,
    userNote?: string
  ): Promise<{ imageUrl: string; caption?: string }> {
    if (!this.apiToken) {
      throw new Error('Replicate API token not set');
    }

    const prompt = getEnhancementPrompt(userNote);
    console.log('[Replicate] Enhancement prompt:', prompt);

    try {
      // Use the Vite proxy to avoid CORS issues
      const response = await fetch('/replicate/v1/models/google/nano-banana/predictions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
          'Content-Type': 'application/json',
          'Prefer': 'wait' // Wait for the result instead of polling
        },
        body: JSON.stringify({
          input: {
            prompt: prompt,
            image_input: [imageDataUrl], // Can accept data URLs directly
            output_format: 'png'
          }
        })
      });

      if (!response.ok) {
        const error = await response.text();
        console.error('[Replicate] API error:', error);
        throw new Error(`Replicate API error: ${response.status}`);
      }

      const result = await response.json();
      console.log('[Replicate] API response:', result);

      // The output should be in result.output
      if (result.output && Array.isArray(result.output) && result.output.length > 0) {
        console.log('[Replicate] Successfully received enhanced image');
        return {
          imageUrl: result.output[0],
          caption: 'Enhanced with AI'
        };
      } else if (typeof result.output === 'string') {
        // Sometimes it returns a single string instead of array
        console.log('[Replicate] Successfully received enhanced image (string format)');
        return {
          imageUrl: result.output,
          caption: 'Enhanced with AI'
        };
      } else {
        throw new Error('No enhanced image in response');
      }
    } catch (error) {
      console.error('[Replicate] Enhancement failed:', error);
      throw error;
    }
  }
}

export const replicateService = new ReplicateService();