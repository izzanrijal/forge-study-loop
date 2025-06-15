
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { BookOpen, Clock, Target, ArrowRight, FileText } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface EnhancedReadingModeProps {
  learningObjective: any;
  onStartExercise: () => void;
  estimatedReadTime?: number;
}

export function EnhancedReadingMode({
  learningObjective,
  onStartExercise,
  estimatedReadTime = 10
}: EnhancedReadingModeProps) {
  const [readingProgress, setReadingProgress] = useState(0);
  const [startTime] = useState(Date.now());
  const [currentReadTime, setCurrentReadTime] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentReadTime(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);

    return () => clearInterval(timer);
  }, [startTime]);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.pageYOffset;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollPercent = Math.min((scrollTop / docHeight) * 100, 100);
      setReadingProgress(scrollPercent);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const markdownComponents = {
    h1: ({ children }: any) => (
      <h1 className="text-3xl font-bold text-gray-900 mb-6 mt-8 first:mt-0">
        {children}
      </h1>
    ),
    h2: ({ children }: any) => (
      <h2 className="text-2xl font-semibold text-gray-800 mb-4 mt-6">
        {children}
      </h2>
    ),
    h3: ({ children }: any) => (
      <h3 className="text-xl font-semibold text-gray-700 mb-3 mt-5">
        {children}
      </h3>
    ),
    p: ({ children }: any) => (
      <p className="text-gray-700 mb-4 leading-relaxed">
        {children}
      </p>
    ),
    ul: ({ children }: any) => (
      <ul className="list-disc list-inside mb-4 space-y-2 ml-4">
        {children}
      </ul>
    ),
    ol: ({ children }: any) => (
      <ol className="list-decimal list-inside mb-4 space-y-2 ml-4">
        {children}
      </ol>
    ),
    li: ({ children }: any) => (
      <li className="text-gray-700 leading-relaxed">
        {children}
      </li>
    ),
    blockquote: ({ children }: any) => (
      <blockquote className="border-l-4 border-blue-500 pl-4 mb-4 italic text-gray-600 bg-blue-50 py-2">
        {children}
      </blockquote>
    ),
    code: ({ children }: any) => (
      <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono">
        {children}
      </code>
    ),
    pre: ({ children }: any) => (
      <pre className="bg-gray-100 p-4 rounded-lg mb-4 overflow-x-auto">
        {children}
      </pre>
    ),
    strong: ({ children }: any) => (
      <strong className="font-semibold text-gray-900">
        {children}
      </strong>
    ),
    em: ({ children }: any) => (
      <em className="italic text-gray-800">
        {children}
      </em>
    )
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Progress Header */}
      <div className="fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-b z-50">
        <div className="max-w-4xl mx-auto px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <BookOpen className="h-5 w-5 text-blue-600" />
              <span className="font-medium text-gray-900">Study Material</span>
              <Badge variant="outline">
                Progress: {Math.round(readingProgress)}%
              </Badge>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Clock className="h-4 w-4" />
                <span>{formatTime(currentReadTime)}</span>
              </div>
              <Button 
                onClick={onStartExercise}
                size="sm"
                className="bg-green-600 hover:bg-green-700"
              >
                Start Exercise
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
            <div 
              className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${readingProgress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mt-20">
        {/* Header Card */}
        <Card className="mb-8 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
            <div className="flex items-center gap-3">
              <Target className="h-6 w-6" />
              <div>
                <CardTitle className="text-xl">
                  {learningObjective.title}
                </CardTitle>
                {learningObjective.pdfs?.filename && (
                  <p className="text-blue-100 mt-1 flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    {learningObjective.pdfs.filename}
                  </p>
                )}
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="pt-6">
            {learningObjective.description && (
              <div className="mb-4">
                <h3 className="font-semibold text-gray-900 mb-2">Learning Objective:</h3>
                <p className="text-gray-700 leading-relaxed">
                  {learningObjective.description}
                </p>
              </div>
            )}
            
            <div className="flex items-center gap-6 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>Estimated read time: {estimatedReadTime} min</span>
              </div>
              {learningObjective.page_range && (
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  <span>Pages: {learningObjective.page_range}</span>
                </div>
              )}
              <Badge variant="secondary">
                Priority: {learningObjective.priority || 'Medium'}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Study Material Content */}
        <Card className="shadow-lg">
          <CardContent className="p-8">
            {learningObjective.content_text ? (
              <div className="prose prose-lg max-w-none">
                <ReactMarkdown components={markdownComponents}>
                  {learningObjective.content_text}
                </ReactMarkdown>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No study material content available for this learning objective.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Bottom Action */}
        <div className="mt-8 text-center">
          <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
            <CardContent className="pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Ready for Practice?
              </h3>
              <p className="text-gray-600 mb-4">
                Setelah membaca materi di atas, lanjutkan dengan latihan soal untuk menguji pemahaman Anda.
              </p>
              <Button 
                onClick={onStartExercise}
                size="lg"
                className="bg-green-600 hover:bg-green-700"
              >
                <Target className="h-5 w-5 mr-2" />
                Start Exercise Now
                <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
