
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, CheckCircle, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useUploadPDF } from "@/hooks/useSupabaseData";
import { Progress } from "@/components/ui/progress";

export function UploadCard() {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const { toast } = useToast();
  const uploadMutation = useUploadPDF();

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
      handleFileUpload(pdfFiles[0]);
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
      handleFileUpload(files[0]);
    }
  };

  const handleFileUpload = async (file: File) => {
    if (file.size > 50 * 1024 * 1024) { // 50MB limit
      toast({
        title: "File too large",
        description: "Please upload files smaller than 50MB.",
        variant: "destructive",
      });
      return;
    }

    try {
      setUploadProgress(25);
      
      await uploadMutation.mutateAsync(file);
      
      setUploadProgress(100);
      
      toast({
        title: "PDF Upload Successful",
        description: `${file.name} has been uploaded and is being processed.`,
      });
      
      // Reset progress after a delay
      setTimeout(() => setUploadProgress(0), 2000);
      
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: "There was an error uploading your PDF. Please try again.",
        variant: "destructive",
      });
      setUploadProgress(0);
    }
  };

  return (
    <Card className="rounded-xl shadow-md hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          {uploadProgress === 100 ? (
            <CheckCircle className="w-5 h-5 text-green-500" />
          ) : uploadProgress > 0 ? (
            <AlertCircle className="w-5 h-5 text-blue-500" />
          ) : (
            <Upload className="w-5 h-5 text-primary" />
          )}
          Upload New PDF
        </CardTitle>
        <CardDescription>
          Transform any PDF into adaptive spaced-repetition questions
        </CardDescription>
      </CardHeader>
      <CardContent>
        {uploadProgress > 0 && uploadProgress < 100 && (
          <div className="mb-4">
            <Progress value={uploadProgress} className="w-full" />
            <p className="text-sm text-muted-foreground mt-2">Uploading...</p>
          </div>
        )}
        
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
          <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground mb-4">
            Drag and drop your PDF here, or click to browse
          </p>
          <input
            type="file"
            accept=".pdf"
            onChange={handleFileSelect}
            className="hidden"
            id="pdf-upload"
            disabled={uploadMutation.isPending}
          />
          <Button 
            asChild 
            variant="outline" 
            className="rounded-xl"
            disabled={uploadMutation.isPending}
          >
            <label htmlFor="pdf-upload" className="cursor-pointer">
              {uploadMutation.isPending ? "Uploading..." : "Choose Files"}
            </label>
          </Button>
          <p className="text-xs text-muted-foreground mt-3">
            Supports: PDF files up to 50MB
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
