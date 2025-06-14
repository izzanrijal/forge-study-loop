
import { TopBar } from "@/components/TopBar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { mockProgressData, mockReviewSessions, mockUser } from "@/data/mockData";

export default function Progress() {
  return (
    <div className="min-h-screen bg-background">
      <TopBar title="Progress" streak={mockUser.streak} />
      
      <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-4 sm:space-y-6">
        {/* Mastery Trend Chart */}
        <Card className="rounded-xl shadow-md">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg sm:text-xl">Mastery Trend</CardTitle>
            <CardDescription className="text-sm">
              Your overall learning progress over time
            </CardDescription>
          </CardHeader>
          <CardContent className="px-2 sm:px-6">
            <div className="h-64 sm:h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={mockProgressData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 10, fill: '#8B939E' }}
                    tickFormatter={(value) => {
                      const date = new Date(value);
                      return window.innerWidth < 640 
                        ? `${date.getMonth() + 1}/${date.getDate()}`
                        : date.toLocaleDateString();
                    }}
                  />
                  <YAxis 
                    tick={{ fontSize: 10, fill: '#8B939E' }}
                    domain={[0, 100]}
                    width={30}
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
                    dot={{ fill: '#4D596A', strokeWidth: 2, r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
          {/* Streak Calendar */}
          <Card className="rounded-xl shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg sm:text-xl">Study Streak Calendar</CardTitle>
              <CardDescription className="text-sm">
                Daily study activity heatmap
              </CardDescription>
            </CardHeader>
            <CardContent className="px-4 sm:px-6">
              <div className="grid grid-cols-7 gap-1 mb-4">
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day) => (
                  <div key={day} className="text-xs text-ash text-center p-1 sm:p-2">
                    {day}
                  </div>
                ))}
                {Array.from({ length: 35 }).map((_, i) => (
                  <div
                    key={i}
                    className={`aspect-square rounded border min-h-[20px] sm:min-h-[24px] cursor-pointer hover:scale-110 transition-transform ${
                      Math.random() > 0.3 
                        ? 'bg-primary/20 border-primary/30' 
                        : 'bg-muted border-border'
                    }`}
                    onClick={() => console.log(`Clicked day ${i + 1}`)}
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
            <CardHeader className="pb-3">
              <CardTitle className="text-lg sm:text-xl">Recent Sessions</CardTitle>
              <CardDescription className="text-sm">
                Your review session history
              </CardDescription>
            </CardHeader>
            <CardContent className="px-4 sm:px-6">
              <div className="space-y-3">
                {mockReviewSessions.map((session) => (
                  <div 
                    key={session.id}
                    className="flex items-center justify-between p-3 sm:p-4 rounded-xl border border-border hover:bg-accent/50 transition-colors cursor-pointer"
                    onClick={() => console.log('Session details:', session)}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-sm sm:text-base truncate">
                        {new Date(session.date).toLocaleDateString()}
                      </div>
                      <div className="text-xs sm:text-sm text-ash">
                        {session.questions} questions • {session.timeSpent}min
                      </div>
                    </div>
                    <div className="text-right ml-4">
                      <div className={`font-medium text-sm sm:text-base ${
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
