
'use server';

import { translateSanskritText } from '@/ai/flows/translate-sanskrit-text';
import { translateSanskritImage } from '@/ai/flows/translate-sanskrit-image';
import { z } from 'zod';

const textSchema = z.string().min(1, 'Sanskrit text cannot be empty.');

export async function handleTextTranslation(text: string) {
  try {
    const validatedText = textSchema.parse(text);
    const result = await translateSanskritText({ sanskritText: validatedText });
    return { success: true, translation: result.englishTranslation };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message };
    }
    console.error('Text translation error:', error);
    return { success: false, error: 'An unexpected error occurred during translation.' };
  }
}

export async function handleImageTranslation(formData: FormData) {
  try {
    const imageFile = formData.get('image') as File;

    if (!imageFile || imageFile.size === 0) {
      return { success: false, error: "No image file provided." };
    }
    if (!imageFile.type.startsWith('image/')) {
      return { success: false, error: "Invalid file type. Please upload an image." };
    }

    const buffer = await imageFile.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');
    const imageUri = `data:${imageFile.type};base64,${base64}`;

    const result = await translateSanskritImage({ imageUri });
    return { success: true, translation: result.translation };
  } catch (error) {
    console.error('Image translation error:', error);
    return { success: false, error: 'Failed to translate image. The image may be too large or in an unsupported format.' };
  }
}
