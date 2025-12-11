// This is a Genkit flow for translating Sanskrit text to English.

'use server';

/**
 * @fileOverview Translates Sanskrit text into English.
 *
 * - translateSanskritText - A function that translates Sanskrit text to English.
 * - TranslateSanskritTextInput - The input type for the translateSanskritText function.
 * - TranslateSanskritTextOutput - The return type for the translateSanskritText function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const TranslateSanskritTextInputSchema = z.object({
  sanskritText: z.string().describe('The Sanskrit text to translate.'),
});

export type TranslateSanskritTextInput = z.infer<
  typeof TranslateSanskritTextInputSchema
>;

const TranslateSanskritTextOutputSchema = z.object({
  englishTranslation: z
    .string()
    .describe('The English translation of the Sanskrit text.'),
});

export type TranslateSanskritTextOutput = z.infer<
  typeof TranslateSanskritTextOutputSchema
>;

export async function translateSanskritText(
  input: TranslateSanskritTextInput
): Promise<TranslateSanskritTextOutput> {
  return translateSanskritTextFlow(input);
}

const translateSanskritTextPrompt = ai.definePrompt({
  name: 'translateSanskritTextPrompt',
  input: {schema: TranslateSanskritTextInputSchema},
  output: {schema: TranslateSanskritTextOutputSchema},
  prompt: `Translate the following Sanskrit text into English, intelligently incorporating known Sanskrit root meanings:

{{{sanskritText}}}`,
});

const translateSanskritTextFlow = ai.defineFlow(
  {
    name: 'translateSanskritTextFlow',
    inputSchema: TranslateSanskritTextInputSchema,
    outputSchema: TranslateSanskritTextOutputSchema,
  },
  async input => {
    const {output} = await translateSanskritTextPrompt(input);
    if (!output) {
      throw new Error('Translation failed to produce an output.');
    }
    return output;
  }
);
