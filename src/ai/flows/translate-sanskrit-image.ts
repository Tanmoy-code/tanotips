'use server';
/**
 * @fileOverview This file defines a Genkit flow for translating Sanskrit text from an image into English.
 *
 * - translateSanskritImage - A function that takes an image containing Sanskrit text and returns its English translation.
 * - TranslateSanskritImageInput - The input type for the translateSanskritImage function.
 * - TranslateSanskritImageOutput - The return type for the translateSanskritImage function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const TranslateSanskritImageInputSchema = z.object({
  imageUri: z
    .string()
    .describe(
      'An image containing Sanskrit text, as a data URI that must include a MIME type and use Base64 encoding. Expected format: \'data:<mimetype>;base64,<encoded_data>\'.'
    ),
});
export type TranslateSanskritImageInput = z.infer<typeof TranslateSanskritImageInputSchema>;

const TranslateSanskritImageOutputSchema = z.object({
  translation: z.string().describe('The English translation of the Sanskrit text in the image.'),
});
export type TranslateSanskritImageOutput = z.infer<typeof TranslateSanskritImageOutputSchema>;

export async function translateSanskritImage(input: TranslateSanskritImageInput): Promise<TranslateSanskritImageOutput> {
  return translateSanskritImageFlow(input);
}

const prompt = ai.definePrompt({
  name: 'translateSanskritImagePrompt',
  input: {schema: TranslateSanskritImageInputSchema},
  output: {schema: TranslateSanskritImageOutputSchema},
  prompt: `You are an expert Sanskrit translator. You will be provided with an image containing Sanskrit text.
Your task is to translate the text in the image into English.
Use all your knowledge of Sanskrit, including root meanings, to provide the most accurate translation possible.

Image: {{media url=imageUri}}

Translation:`,
});

const translateSanskritImageFlow = ai.defineFlow(
  {
    name: 'translateSanskritImageFlow',
    inputSchema: TranslateSanskritImageInputSchema,
    outputSchema: TranslateSanskritImageOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
