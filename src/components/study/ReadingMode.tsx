
import { Button } from "@/components/ui/button";

interface ReadingModeProps {
  learningObjective: any;
  onFinishReading: () => void;
}

export function ReadingMode({ learningObjective, onFinishReading }: ReadingModeProps) {
  return (
    <div className="prose prose-sm max-w-none">
      <h3 className="font-space-grotesk font-semibold mb-4">Study Material</h3>
      <div className="bg-muted p-6 rounded-lg mb-6">
        <h4 className="font-semibold text-lg mb-3">{learningObjective.title}</h4>
        
        {learningObjective.content_text ? (
          <div className="text-foreground leading-relaxed text-base space-y-4">
            {learningObjective.content_text.split('\n').map((paragraph: string, index: number) => {
              if (paragraph.trim()) {
                return (
                  <p key={index} className="mb-4">
                    {paragraph.trim()}
                  </p>
                );
              }
              return null;
            })}
          </div>
        ) : (
          <div className="text-foreground leading-relaxed text-base space-y-4">
            <p className="mb-4">
              This section covers the fundamental concepts related to {learningObjective.title.toLowerCase()}. 
              Understanding these principles is crucial for mastering the topic.
            </p>
            <p className="mb-4">
              This learning objective focuses on developing a comprehensive understanding of the key concepts, 
              principles, and applications within this domain. The material builds upon foundational knowledge 
              to provide deeper insights into the subject matter.
            </p>
            <p className="mb-4">
              Key areas of focus include: critical analysis of core concepts, understanding of underlying 
              mechanisms, practical applications, and the ability to synthesize information from multiple 
              sources to form a complete understanding of the topic.
            </p>
          </div>
        )}
      </div>
      
      <div className="flex justify-end">
        <Button 
          className="rounded-xl bg-primary hover:bg-primary/90"
          onClick={onFinishReading}
        >
          I've Finished Reading
        </Button>
      </div>
    </div>
  );
}
