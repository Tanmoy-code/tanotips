
"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { handleImageTranslation } from "@/app/actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { ImageUp, Languages, X } from "lucide-react";
import { SubmitButton } from "@/app/components/submit-button";
import { Button } from "@/components/ui/button";

export function ImageTranslator() {
  const [translation, setTranslation] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFormSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);
    setTranslation(null);

    const file = fileInputRef.current?.files?.[0];
    if (!file) {
      toast({
        variant: "destructive",
        title: "No Image",
        description: "Please select an image file to translate.",
      });
      setIsLoading(false);
      return;
    }
    
    const formData = new FormData();
    formData.append('image', file);

    const result = await handleImageTranslation(formData);
    
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileName(file.name);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const triggerFileSelect = () => fileInputRef.current?.click();

  const removeImage = () => {
    setPreview(null);
    setFileName(null);
    if(fileInputRef.current) {
        fileInputRef.current.value = "";
    }
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleFormSubmit} className="space-y-4">
        {!preview ? (
            <div className="flex items-center justify-center w-full">
              <label
                htmlFor="sanskrit-image"
                className="flex flex-col items-center justify-center w-full h-48 border-2 border-border border-dashed rounded-lg cursor-pointer bg-card hover:bg-accent/10 transition-colors"
                onClick={triggerFileSelect}
              >
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <ImageUp className="w-10 h-10 mb-3 text-muted-foreground" />
                  <p className="mb-2 text-sm text-muted-foreground"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                  <p className="text-xs text-muted-foreground">PNG, JPG, JPEG, WEBP</p>
                </div>
              </label>
              <input id="sanskrit-image" type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/png, image/jpeg, image/jpg, image/webp" />
            </div>
        ) : (
          <div className="w-full space-y-4">
            <div className="relative w-full overflow-hidden rounded-lg border">
                <div className="relative aspect-video w-full">
                    <Image
                        src={preview}
                        alt="Sanskrit image preview"
                        fill
                        className="object-contain p-2"
                    />
                </div>
                <Button variant="ghost" size="icon" className="absolute top-2 right-2 bg-card/50 hover:bg-card/80" onClick={removeImage}>
                    <X className="h-4 w-4" />
                </Button>
            </div>
            <Button variant="outline" className="w-full" onClick={triggerFileSelect}>Change Image</Button>
          </div>
        )}
        
        <SubmitButton isLoading={isLoading} defaultText="Translate Image" loadingText="Translating..." />
      </form>

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
