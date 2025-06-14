
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, BookOpen } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface TodaysReviewCardProps {
  dueCount: number;
  estimatedMinutes: number;
}

export function TodaysReviewCard({ dueCount, estimatedMinutes }: TodaysReviewCardProps) {
  const navigate = useNavigate();

  const handleStartReview = () => {
    if (dueCount > 0) {
      navigate('/study');
    }
  };

  return (
    <Card className="rounded-xl shadow-md bg-card border-border hover:shadow-lg transition-shadow cursor-pointer">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg text-foreground">Today's Review</CardTitle>
          <Badge variant="secondary" className="bg-primary/10 text-primary rounded-xl">
            {dueCount} due
          </Badge>
        </div>
        <CardDescription className="text-muted-foreground">
          Questions ready for spaced repetition
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            <span>~{estimatedMinutes} min</span>
          </div>
          <div className="flex items-center gap-1">
            <BookOpen className="w-4 h-4" />
            <span>{dueCount} questions</span>
          </div>
        </div>
        
        <Button 
          className="w-full rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground" 
          size="lg"
          disabled={dueCount === 0}
          onClick={handleStartReview}
        >
          {dueCount > 0 ? 'Start Review Session' : 'No reviews due'}
        </Button>
      </CardContent>
    </Card>
  );
}
