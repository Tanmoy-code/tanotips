
"use client";

import { Button, type ButtonProps } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface SubmitButtonProps extends ButtonProps {
  isLoading: boolean;
  defaultText: string;
  loadingText: string;
}

export function SubmitButton({ isLoading, defaultText, loadingText, ...props }: SubmitButtonProps) {
  return (
    <Button type="submit" disabled={isLoading} className="w-full" {...props}>
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          {loadingText}
        </>
      ) : (
        defaultText
      )}
    </Button>
  );
}
