
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { LucideIcon } from "lucide-react";

export interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  actionLink?: string;
  icon?: LucideIcon;
  type?: 'upload' | 'progress' | 'general';
}

export function EmptyState({ 
  title, 
  description, 
  actionLabel, 
  actionLink, 
  icon: Icon,
  type = 'general'
}: EmptyStateProps) {
  return (
    <Card className="border-dashed border-2 border-gray-300">
      <CardContent className="flex flex-col items-center justify-center p-12 text-center">
        {Icon && (
          <div className="mb-4 p-3 bg-primary/10 rounded-full">
            <Icon className="w-8 h-8 text-primary" />
          </div>
        )}
        <h3 className="text-xl font-semibold mb-2">{title}</h3>
        <p className="text-muted-foreground mb-6 max-w-md">{description}</p>
        {actionLabel && actionLink && (
          <Link to={actionLink}>
            <Button>{actionLabel}</Button>
          </Link>
        )}
      </CardContent>
    </Card>
  );
}
