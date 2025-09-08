// Editable prompts for the generation pipeline
// These can be easily modified to change the behavior of the AI

export const PROMPTS = {
  // Image enhancement prompt - sent to Gemini 2.5 Flash Image Preview
  imageEnhancement: {
    base: `Look at the image, imagine how it would look like if it would have been taken with a modern digital NIKON dslr camerea, 
    Transform the image to vibrant and realistic colors shot on an google pixel 9 pro. DO NOT RETURN Images that look like black and white ot greyscale iamges. Return only the updated image and nothing else
    `,
  },

  // Video generation prompt - creates motion description
  videoGeneration: {
    base: `Look at the image and describe what could realistically happen in the next 5 seconds, boring is fine. IF a 
    person is not showing their face on the reference image, ensure they do not turn to the camera but keep looking elsewhere. 
    Answer directly with the description of what could happen in the five seconds.`,

    withUserNote: (userNote: string) => `Look at the image and describe what could realistically happen in the next 5 seconds, boring is fine. IF a 
    person is not showing their face on the reference image, ensure they do not turn to the camera but keep looking elsewhere. 
      Take into account what the user mentioned about the image User Note:  "${userNote}", The user note is imporant 
     Answer directly with the description in active  language what happens in next five seconds.`
  }
};

// Helper to get the appropriate prompt
export const getEnhancementPrompt = (_userNote?: string): string => {
  return PROMPTS.imageEnhancement.base;
};

export const getVideoPrompt = (userNote?: string): string => {
  return userNote ? PROMPTS.videoGeneration.withUserNote(userNote) : PROMPTS.videoGeneration.base;
};