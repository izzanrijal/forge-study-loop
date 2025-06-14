
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, CheckCircle, AlertCircle, FileText, File } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useUploadFile } from "@/hooks/useSupabaseData";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

export function UploadCard() {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { toast } = useToast();
  const uploadMutation = useUploadFile();

  const acceptedTypes = {
    'application/pdf': ['.pdf'],
    'text/markdown': ['.md', '.markdown'],
    'text/plain': ['.txt']
  };

  const getFileIcon = (type: string) => {
    if (type === 'application/pdf') return <File className="w-4 h-4" />;
    if (type.includes('markdown') || type.includes('text')) return <FileText className="w-4 h-4" />;
    return <File className="w-4 h-4" />;
  };

  const getFileTypeLabel = (type: string) => {
    if (type === 'application/pdf') return 'PDF';
    if (type.includes('markdown')) return 'Markdown';
    if (type.includes('text')) return 'Text';
    return 'Unknown';
  };

  const validateFile = (file: File) => {
    const maxSize = 50 * 1024 * 1024; // 50MB
    const allowedTypes = Object.keys(acceptedTypes);
    
    if (!allowedTypes.includes(file.type) && !file.name.match(/\.(pdf|md|markdown|txt)$/i)) {
      throw new Error('File type not supported. Please upload PDF, Markdown, or Text files.');
    }
    
    if (file.size > maxSize) {
      throw new Error('File size too large. Please upload files smaller than 50MB.');
    }
    
    return true;
  };

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
    if (files.length > 0) {
      try {
        validateFile(files[0]);
        setSelectedFile(files[0]);
      } catch (error) {
        toast({
          title: "Invalid file",
          description: error instanceof Error ? error.message : "Please select a valid file.",
          variant: "destructive",
        });
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      try {
        validateFile(files[0]);
        setSelectedFile(files[0]);
      } catch (error) {
        toast({
          title: "Invalid file",
          description: error instanceof Error ? error.message : "Please select a valid file.",
          variant: "destructive",
        });
      }
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    try {
      setUploadProgress(25);
      
      await uploadMutation.mutateAsync(selectedFile);
      
      setUploadProgress(100);
      
      toast({
        title: "Upload Successful",
        description: `${selectedFile.name} has been uploaded and is being processed.`,
      });
      
      // Reset state after delay
      setTimeout(() => {
        setUploadProgress(0);
        setSelectedFile(null);
      }, 2000);
      
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: "There was an error uploading your file. Please try again.",
        variant: "destructive",
      });
      setUploadProgress(0);
    }
  };

  const clearSelection = () => {
    setSelectedFile(null);
    setUploadProgress(0);
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
          Upload Learning Materials
        </CardTitle>
        <CardDescription>
          Upload PDF documents or Markdown files to generate adaptive learning content
        </CardDescription>
      </CardHeader>
      <CardContent>
        {uploadProgress > 0 && uploadProgress < 100 && (
          <div className="mb-4">
            <Progress value={uploadProgress} className="w-full" />
            <p className="text-sm text-muted-foreground mt-2">Uploading...</p>
          </div>
        )}

        {selectedFile && uploadProgress === 0 && (
          <div className="mb-4 p-3 border rounded-lg bg-muted/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {getFileIcon(selectedFile.type)}
                <div>
                  <p className="text-sm font-medium">{selectedFile.name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="secondary" className="text-xs">
                      {getFileTypeLabel(selectedFile.type)}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </span>
                  </div>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearSelection}
                className="text-muted-foreground hover:text-foreground"
              >
                ×
              </Button>
            </div>
          </div>
        )}
        
        <div
          className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
            isDragging 
              ? 'border-primary bg-primary/5' 
              : selectedFile 
              ? 'border-green-300 bg-green-50 dark:bg-green-950/20'
              : 'border-border hover:border-primary/50'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="flex flex-col items-center gap-3">
            {selectedFile ? (
              <>
                <CheckCircle className="w-8 h-8 text-green-500" />
                <p className="text-sm text-green-700 dark:text-green-300 font-medium">
                  File selected and ready to upload
                </p>
              </>
            ) : (
              <>
                <Upload className="w-8 h-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground mb-2">
                  Drag and drop your files here, or click to browse
                </p>
              </>
            )}
            
            <div className="flex flex-wrap gap-2 justify-center mb-3">
              <Badge variant="outline" className="text-xs">
                <File className="w-3 h-3 mr-1" />
                PDF
              </Badge>
              <Badge variant="outline" className="text-xs">
                <FileText className="w-3 h-3 mr-1" />
                Markdown
              </Badge>
              <Badge variant="outline" className="text-xs">
                <FileText className="w-3 h-3 mr-1" />
                Text
              </Badge>
            </div>

            {selectedFile ? (
              <Button 
                onClick={handleUpload}
                className="rounded-xl"
                disabled={uploadMutation.isPending}
              >
                {uploadMutation.isPending ? "Uploading..." : "Upload File"}
              </Button>
            ) : (
              <>
                <input
                  type="file"
                  accept=".pdf,.md,.markdown,.txt"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="file-upload"
                  disabled={uploadMutation.isPending}
                />
                <Button 
                  asChild 
                  variant="outline" 
                  className="rounded-xl"
                  disabled={uploadMutation.isPending}
                >
                  <label htmlFor="file-upload" className="cursor-pointer">
                    Choose Files
                  </label>
                </Button>
              </>
            )}
          </div>
          
          <p className="text-xs text-muted-foreground mt-4">
            Supports: PDF, Markdown (.md), and Text files up to 50MB
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
