
import { TopBar } from "@/components/TopBar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const mockProgressData = [
  { date: '2024-01-01', mastery: 20 },
  { date: '2024-01-08', mastery: 35 },
  { date: '2024-01-15', mastery: 45 },
  { date: '2024-01-22', mastery: 60 },
  { date: '2024-01-29', mastery: 75 },
  { date: '2024-02-05', mastery: 82 },
  { date: '2024-02-12', mastery: 78 },
];

const mockReviewLog = [
  { date: '2024-02-12', questions: 23, accuracy: 87 },
  { date: '2024-02-11', questions: 15, accuracy: 92 },
  { date: '2024-02-10', questions: 31, accuracy: 79 },
  { date: '2024-02-09', questions: 18, accuracy: 95 },
  { date: '2024-02-08', questions: 27, accuracy: 84 },
];

export default function Progress() {
  return (
    <div className="min-h-screen bg-background">
      <TopBar title="Progress" streak={12} />
      
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Mastery Trend Chart */}
        <Card className="rounded-xl shadow-md">
          <CardHeader>
            <CardTitle>Mastery Trend</CardTitle>
            <CardDescription>
              Your overall learning progress over time
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={mockProgressData}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 12, fill: '#8B939E' }}
                    tickFormatter={(value) => new Date(value).toLocaleDateString()}
                  />
                  <YAxis 
                    tick={{ fontSize: 12, fill: '#8B939E' }}
                    domain={[0, 100]}
                  />
                  <Tooltip 
                    labelFormatter={(value) => new Date(value).toLocaleDateString()}
                    formatter={(value) => [`${value}%`, 'Mastery']}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="mastery" 
                    stroke="#4D596A" 
                    strokeWidth={2}
                    dot={{ fill: '#4D596A', strokeWidth: 2, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Streak Calendar */}
          <Card className="rounded-xl shadow-md">
            <CardHeader>
              <CardTitle>Study Streak Calendar</CardTitle>
              <CardDescription>
                Daily study activity heatmap
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-1 mb-4">
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day) => (
                  <div key={day} className="text-xs text-ash text-center p-1">
                    {day}
                  </div>
                ))}
                {Array.from({ length: 35 }).map((_, i) => (
                  <div
                    key={i}
                    className={`aspect-square rounded border ${
                      Math.random() > 0.3 
                        ? 'bg-primary/20 border-primary/30' 
                        : 'bg-muted border-border'
                    }`}
                  />
                ))}
              </div>
              <div className="flex items-center justify-between text-xs text-ash">
                <span>Less</span>
                <div className="flex gap-1">
                  <div className="w-3 h-3 rounded border bg-muted" />
                  <div className="w-3 h-3 rounded border bg-primary/10" />
                  <div className="w-3 h-3 rounded border bg-primary/20" />
                  <div className="w-3 h-3 rounded border bg-primary/30" />
                </div>
                <span>More</span>
              </div>
            </CardContent>
          </Card>

          {/* Review Log */}
          <Card className="rounded-xl shadow-md">
            <CardHeader>
              <CardTitle>Recent Sessions</CardTitle>
              <CardDescription>
                Your review session history
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {mockReviewLog.map((session) => (
                  <div 
                    key={session.date}
                    className="flex items-center justify-between p-3 rounded-xl border border-border"
                  >
                    <div>
                      <div className="font-medium text-sm">
                        {new Date(session.date).toLocaleDateString()}
                      </div>
                      <div className="text-xs text-ash">
                        {session.questions} questions
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`font-medium text-sm ${
                        session.accuracy >= 90 ? 'text-green-600' :
                        session.accuracy >= 80 ? 'text-yellow-600' :
                        'text-red-600'
                      }`}>
                        {session.accuracy}%
                      </div>
                      <div className="text-xs text-ash">accuracy</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
