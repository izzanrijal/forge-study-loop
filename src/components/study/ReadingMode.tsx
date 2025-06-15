
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Clock, Target, ArrowRight, FileText } from "lucide-react";

interface ReadingModeProps {
  learningObjective: any;
  onFinishReading: () => void;
}

export function ReadingMode({ learningObjective, onFinishReading }: ReadingModeProps) {
  // Format content text dengan markdown sederhana
  const formatContent = (text: string) => {
    if (!text) return null;
    
    return text.split('\n').map((paragraph, index) => {
      const trimmed = paragraph.trim();
      if (!trimmed) return <div key={index} className="h-4" />;
      
      // Handle headers
      if (trimmed.startsWith('# ')) {
        return (
          <h1 key={index} className="text-3xl font-bold text-gray-900 mb-6 mt-8 first:mt-0">
            {trimmed.substring(2)}
          </h1>
        );
      }
      if (trimmed.startsWith('## ')) {
        return (
          <h2 key={index} className="text-2xl font-semibold text-gray-800 mb-4 mt-6">
            {trimmed.substring(3)}
          </h2>
        );
      }
      if (trimmed.startsWith('### ')) {
        return (
          <h3 key={index} className="text-xl font-semibold text-gray-700 mb-3 mt-5">
            {trimmed.substring(4)}
          </h3>
        );
      }
      
      // Handle bullet points
      if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        return (
          <li key={index} className="text-gray-700 leading-relaxed ml-4 mb-2 list-disc list-inside">
            {trimmed.substring(2)}
          </li>
        );
      }
      
      // Handle numbered lists
      if (/^\d+\.\s/.test(trimmed)) {
        return (
          <li key={index} className="text-gray-700 leading-relaxed ml-4 mb-2 list-decimal list-inside">
            {trimmed.replace(/^\d+\.\s/, '')}
          </li>
        );
      }
      
      // Handle bold text **text**
      let content = trimmed.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      // Handle italic text *text*
      content = content.replace(/\*(.*?)\*/g, '<em>$1</em>');
      
      // Regular paragraph
      return (
        <p 
          key={index} 
          className="text-gray-700 mb-4 leading-relaxed text-base"
          dangerouslySetInnerHTML={{ __html: content }}
        />
      );
    });
  };

  return (
    <div className="max-w-none">
      {/* Header */}
      <div className="mb-8">
        <Card className="shadow-lg border-l-4 border-blue-500">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
            <div className="flex items-center gap-3">
              <Target className="h-6 w-6 text-blue-600" />
              <div className="flex-1">
                <CardTitle className="text-xl text-gray-900">
                  {learningObjective.title}
                </CardTitle>
                {learningObjective.pdfs?.filename && (
                  <p className="text-blue-600 mt-1 flex items-center gap-2 text-sm">
                    <FileText className="h-4 w-4" />
                    {learningObjective.pdfs.filename}
                  </p>
                )}
              </div>
            </div>
          </CardHeader>
          
          {learningObjective.description && (
            <CardContent className="pt-4">
              <div className="mb-4">
                <h4 className="font-semibold text-gray-900 mb-2">Tujuan Pembelajaran:</h4>
                <p className="text-gray-700 leading-relaxed">
                  {learningObjective.description}
                </p>
              </div>
              
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span>Estimasi waktu baca: 10-15 menit</span>
                </div>
                {learningObjective.page_range && (
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    <span>Halaman: {learningObjective.page_range}</span>
                  </div>
                )}
                <Badge variant="secondary">
                  Prioritas: {learningObjective.priority || 'Medium'}
                </Badge>
              </div>
            </CardContent>
          )}
        </Card>
      </div>

      {/* Study Content */}
      <Card className="shadow-lg mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <BookOpen className="h-5 w-5 text-blue-600" />
            Materi Pembelajaran
          </CardTitle>
        </CardHeader>
        
        <CardContent className="p-8">
          <div className="prose prose-lg max-w-none">
            {learningObjective.content_text ? (
              <div className="space-y-4">
                {formatContent(learningObjective.content_text)}
              </div>
            ) : (
              <div className="space-y-6 text-gray-700 leading-relaxed text-base">
                <p className="text-lg font-semibold text-gray-900 mb-4">
                  Materi Pembelajaran: {learningObjective.title}
                </p>
                
                <p>
                  Bagian ini membahas konsep-konsep fundamental yang berkaitan dengan {learningObjective.title.toLowerCase()}. 
                  Memahami prinsip-prinsip ini sangat penting untuk menguasai topik secara keseluruhan.
                </p>
                
                <p>
                  Tujuan pembelajaran ini berfokus pada pengembangan pemahaman yang komprehensif tentang konsep-konsep kunci, 
                  prinsip-prinsip, dan aplikasi dalam domain ini. Materi ini dibangun berdasarkan pengetahuan dasar 
                  untuk memberikan wawasan yang lebih mendalam tentang subjek.
                </p>
                
                <p>
                  Area fokus utama meliputi: analisis kritis dari konsep inti, pemahaman mekanisme yang mendasari, 
                  aplikasi praktis, dan kemampuan untuk mensintesis informasi dari berbagai sumber untuk membentuk 
                  pemahaman lengkap tentang topik tersebut.
                </p>
                
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-6">
                  <h4 className="font-semibold text-blue-900 mb-3">Poin-Poin Penting:</h4>
                  <ul className="space-y-2 text-blue-800">
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 mt-1">•</span>
                      <span>Pemahaman konsep dasar dan terminologi yang relevan</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 mt-1">•</span>
                      <span>Aplikasi praktis dalam konteks nyata</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 mt-1">•</span>
                      <span>Hubungan dengan topik pembelajaran lainnya</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 mt-1">•</span>
                      <span>Strategi untuk mengingat dan menerapkan informasi</span>
                    </li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      
      {/* Action Button */}
      <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200 shadow-lg">
        <CardContent className="pt-6 text-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Siap untuk Latihan Soal?
          </h3>
          <p className="text-gray-600 mb-6">
            Setelah membaca dan memahami materi di atas, lanjutkan dengan latihan soal 
            untuk menguji pemahaman dan memperkuat ingatan Anda.
          </p>
          <Button 
            onClick={onFinishReading}
            size="lg"
            className="bg-green-600 hover:bg-green-700 px-8 py-3 text-lg rounded-xl"
          >
            <Target className="h-5 w-5 mr-2" />
            Mulai Latihan Soal
            <ArrowRight className="h-5 w-5 ml-2" />
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
