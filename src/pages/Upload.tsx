
import { Layout } from "@/components/Layout";
import { UploadCard } from "@/components/UploadCard";

export default function Upload() {
  return (
    <Layout>
      <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-2 sm:mb-3">
            Upload Learning Materials
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            Upload your PDF documents to generate adaptive spaced-repetition questions and study materials.
          </p>
        </div>
        
        <div className="w-full">
          <UploadCard />
        </div>
      </div>
    </Layout>
  );
}
