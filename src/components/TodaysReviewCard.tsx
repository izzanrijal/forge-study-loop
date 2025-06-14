
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, BookOpen } from "lucide-react";

interface TodaysReviewCardProps {
  dueCount: number;
  estimatedMinutes: number;
}

export function TodaysReviewCard({ dueCount, estimatedMinutes }: TodaysReviewCardProps) {
  return (
    <Card className="rounded-xl shadow-md bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Today's Review</CardTitle>
          <Badge variant="secondary" className="bg-primary text-primary-foreground rounded-xl">
            {dueCount} due
          </Badge>
        </div>
        <CardDescription>
          Questions ready for spaced repetition
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4 text-sm text-ash">
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
          className="w-full rounded-xl bg-primary hover:bg-primary/90" 
          size="lg"
          disabled={dueCount === 0}
        >
          {dueCount > 0 ? 'Start Review Session' : 'No reviews due'}
        </Button>
      </CardContent>
    </Card>
  );
}
