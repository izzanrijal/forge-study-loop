
import { TopBar } from "@/components/TopBar";
import { UploadCard } from "@/components/UploadCard";

export default function Upload() {
  return (
    <div className="min-h-screen bg-background">
      <TopBar title="Upload PDF" streak={12} />
      
      <div className="p-4 sm:p-6 max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-2">Upload Learning Materials</h1>
          <p className="text-muted-foreground">
            Upload your PDF documents to generate adaptive spaced-repetition questions and study materials.
          </p>
        </div>
        
        <UploadCard />
      </div>
    </div>
  );
}
