
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
        <p className="text-foreground leading-relaxed text-base mb-4">
          This section covers the fundamental concepts related to {learningObjective.title.toLowerCase()}. 
          Understanding these principles is crucial for mastering the topic.
        </p>
        <p className="text-foreground leading-relaxed text-base mb-4">
          React Hooks provide a powerful way to manage state and side effects in functional components. 
          The useState hook allows you to add state to functional components, while useEffect enables 
          you to perform side effects such as data fetching, subscriptions, or manually changing the DOM.
        </p>
        <p className="text-foreground leading-relaxed text-base">
          Key concepts include: understanding when to use different hooks, proper dependency arrays 
          for useEffect, and avoiding common pitfalls like infinite re-renders. These fundamentals 
          form the basis for building robust React applications.
        </p>
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
