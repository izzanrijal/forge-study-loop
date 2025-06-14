
import { TopBar } from "@/components/TopBar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, BookOpen } from "lucide-react";
import { Link } from "react-router-dom";

export default function Study() {
  return (
    <div className="min-h-screen bg-background">
      <TopBar title="Study Session" />
      
      <div className="p-6 max-w-4xl mx-auto">
        <div className="mb-6">
          <Link to="/" className="inline-flex items-center gap-2 text-ash hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
        </div>

        <Card className="rounded-xl shadow-md">
          <CardHeader className="border-b border-border">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-3">
                <BookOpen className="w-5 h-5 text-primary" />
                Understanding React Hooks Fundamentals
              </CardTitle>
              <Badge variant="secondary" className="bg-red-500/10 text-red-700 dark:text-red-400 rounded-xl">
                High Priority
              </Badge>
            </div>
          </CardHeader>
          
          <CardContent className="p-6">
            <div className="prose prose-sm max-w-none mb-8">
              <h3 className="font-space-grotesk font-semibold mb-4">Chapter 3: Advanced Hook Patterns</h3>
              
              <p className="text-foreground leading-relaxed mb-4">
                React Hooks fundamentally changed how we write React components by allowing us to use state 
                and other React features in functional components. The useState and useEffect hooks are the 
                foundation, but understanding advanced patterns is crucial for building scalable applications.
              </p>
              
              <p className="text-foreground leading-relaxed mb-4">
                Custom hooks enable you to extract component logic into reusable functions. They follow the 
                same rules as built-in hooks: they must start with "use" and can only be called at the top 
                level of React functions.
              </p>
              
              <div className="bg-muted p-4 rounded-lg mb-4">
                <code className="text-sm">
                  {`function useCounter(initialValue = 0) {
  const [count, setCount] = useState(initialValue);
  const increment = () => setCount(count + 1);
  const decrement = () => setCount(count - 1);
  return { count, increment, decrement };
}`}
                </code>
              </div>
              
              <p className="text-foreground leading-relaxed">
                This pattern allows you to share stateful logic between components without the complexity 
                of higher-order components or render props patterns from the class component era.
              </p>
            </div>
            
            <div className="flex justify-between items-center pt-6 border-t border-border">
              <div className="text-sm text-ash">
                From: react-advanced-patterns.pdf • Page 47-52
              </div>
              <Button className="rounded-xl bg-primary hover:bg-primary/90">
                Mark as Reviewed
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
