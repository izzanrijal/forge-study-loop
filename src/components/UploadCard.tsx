
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function UploadCard() {
  const [isDragging, setIsDragging] = useState(false);
  const { toast } = useToast();

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    const pdfFiles = files.filter(file => file.type === 'application/pdf');
    
    if (pdfFiles.length > 0) {
      toast({
        title: "PDF Upload Started",
        description: `Processing ${pdfFiles.length} PDF${pdfFiles.length > 1 ? 's' : ''}...`,
      });
    } else {
      toast({
        title: "Invalid file type",
        description: "Please upload PDF files only.",
        variant: "destructive",
      });
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      toast({
        title: "PDF Upload Started",
        description: `Processing ${files.length} PDF${files.length > 1 ? 's' : ''}...`,
      });
    }
  };

  return (
    <Card className="rounded-xl shadow-md hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Upload className="w-5 h-5 text-primary" />
          Upload New PDF
        </CardTitle>
        <CardDescription>
          Transform any PDF into adaptive spaced-repetition questions
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div
          className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
            isDragging 
              ? 'border-primary bg-primary/5' 
              : 'border-border hover:border-primary/50'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <Upload className="w-8 h-8 text-ash mx-auto mb-3" />
          <p className="text-sm text-ash mb-4">
            Drag and drop your PDF here, or click to browse
          </p>
          <input
            type="file"
            accept=".pdf"
            multiple
            onChange={handleFileSelect}
            className="hidden"
            id="pdf-upload"
          />
          <Button asChild variant="outline" className="rounded-xl">
            <label htmlFor="pdf-upload" className="cursor-pointer">
              Choose Files
            </label>
          </Button>
          <p className="text-xs text-ash mt-3">
            Supports: PDF files up to 50MB
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
