import { BookOpen } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TextTranslator } from "@/app/components/text-translator";
import { ImageTranslator } from "@/app/components/image-translator";
import { Card, CardContent } from "@/components/ui/card";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center bg-background">
      <div className="w-full max-w-3xl px-4 py-12 sm:py-16 sm:px-6 lg:px-8">
        <header className="text-center mb-12">
          <div className="inline-flex items-center justify-center gap-4 mb-4 bg-card p-4 rounded-full shadow-sm">
            <BookOpen className="h-12 w-12 text-primary" />
            <h1 className="font-headline text-4xl md:text-5xl font-bold tracking-tight text-foreground">
              SanskritReader
            </h1>
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Translate Sanskrit from text and images into English with the power of AI.
          </p>
        </header>

        <Card>
          <CardContent className="p-2 sm:p-4">
            <Tabs defaultValue="text" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="text">Translate Text</TabsTrigger>
                <TabsTrigger value="image">Translate Image</TabsTrigger>
              </TabsList>
              <TabsContent value="text" className="mt-6">
                <TextTranslator />
              </TabsContent>
              <TabsContent value="image" className="mt-6">
                <ImageTranslator />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
