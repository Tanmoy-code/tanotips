
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { handleTextTranslation } from "@/app/actions";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Languages } from "lucide-react";
import { SubmitButton } from "@/app/components/submit-button";

const formSchema = z.object({
  sanskritText: z.string().min(1, "Please enter some Sanskrit text to translate."),
});

export function TextTranslator() {
  const [translation, setTranslation] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      sanskritText: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setTranslation(null);

    const result = await handleTextTranslation(values.sanskritText);
    
    if (result.success) {
      setTranslation(result.translation);
    } else {
      toast({
        variant: "destructive",
        title: "Translation Error",
        description: result.error,
      });
    }
    
    setIsLoading(false);
  }

  return (
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="sanskritText"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-lg font-headline">Sanskrit Text</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Enter your Sanskrit text here... (e.g., तत् त्वम् असि)"
                    className="min-h-[150px] text-base resize-y"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <SubmitButton isLoading={isLoading} defaultText="Translate" loadingText="Translating..." />
        </form>
      </Form>

      {(isLoading || translation) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-headline">
              <Languages className="h-5 w-5" />
              English Translation
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            ) : (
              <p className="text-base leading-relaxed whitespace-pre-wrap">{translation}</p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
