
import { FileText, Upload, BookOpen, BarChart3 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

interface EmptyStateProps {
  type: 'pdfs' | 'learning-objectives' | 'study-sessions' | 'progress';
  title?: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
}

const emptyStateConfig = {
  pdfs: {
    icon: FileText,
    title: "Belum Ada Dokumen PDF",
    description: "Upload dokumen PDF pertama Anda untuk mulai membuat learning objectives dan soal-soal latihan.",
    actionLabel: "Upload PDF",
    actionHref: "/upload"
  },
  'learning-objectives': {
    icon: BookOpen,
    title: "Belum Ada Learning Objectives",
    description: "Learning objectives akan dibuat otomatis setelah Anda mengupload dokumen PDF.",
    actionLabel: "Upload PDF",
    actionHref: "/upload"
  },
  'study-sessions': {
    icon: BarChart3,
    title: "Belum Ada Sesi Belajar",
    description: "Mulai sesi belajar pertama Anda untuk melacak progress dan meningkatkan pemahaman.",
    actionLabel: "Mulai Belajar",
    actionHref: "/study"
  },
  progress: {
    icon: BarChart3,
    title: "Belum Ada Data Progress",
    description: "Data progress akan muncul setelah Anda menyelesaikan beberapa sesi belajar.",
    actionLabel: "Mulai Belajar",
    actionHref: "/study"
  }
};

export function EmptyState({ 
  type, 
  title, 
  description, 
  actionLabel, 
  actionHref,
  onAction 
}: EmptyStateProps) {
  const config = emptyStateConfig[type];
  const Icon = config.icon;
  
  const finalTitle = title || config.title;
  const finalDescription = description || config.description;
  const finalActionLabel = actionLabel || config.actionLabel;
  const finalActionHref = actionHref || config.actionHref;

  return (
    <Card className="rounded-xl shadow-md">
      <CardContent className="p-8 text-center">
        <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
          <Icon className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-2">{finalTitle}</h3>
        <p className="text-muted-foreground mb-6 max-w-md mx-auto">
          {finalDescription}
        </p>
        {onAction ? (
          <Button onClick={onAction} className="rounded-xl">
            {finalActionLabel}
          </Button>
        ) : finalActionHref ? (
          <Link to={finalActionHref}>
            <Button className="rounded-xl">
              {finalActionLabel}
            </Button>
          </Link>
        ) : null}
      </CardContent>
    </Card>
  );
}
