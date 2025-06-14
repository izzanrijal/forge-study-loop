
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Layout } from "@/components/Layout";
import { EmptyState } from "@/components/EmptyState";
import { useStudySessions } from "@/hooks/useRealData";
import { Skeleton } from "@/components/ui/skeleton";
import { mockUser } from "@/data/mockData";

export default function Progress() {
  const { data: studySessions, isLoading } = useStudySessions();

  // Transform study sessions to chart data
  const chartData = studySessions?.map((session, index) => ({
    date: new Date(session.started_at).toLocaleDateString(),
    mastery: Math.min(100, (index + 1) * 10 + session.accuracy * 0.5), // Mock calculation
    accuracy: session.accuracy
  })) || [];

  const hasData = studySessions && studySessions.length > 0;

  if (isLoading) {
    return (
      <Layout>
        <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-4 sm:space-y-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold">Progress</h1>
            <p className="text-muted-foreground">Lacak perjalanan belajar Anda</p>
          </div>
          <Skeleton className="h-80 w-full rounded-xl" />
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
            <Skeleton className="h-64 w-full rounded-xl" />
            <Skeleton className="h-64 w-full rounded-xl" />
          </div>
        </div>
      </Layout>
    );
  }

  if (!hasData) {
    return (
      <Layout>
        <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-4 sm:space-y-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold">Progress</h1>
            <p className="text-muted-foreground">Lacak perjalanan belajar Anda</p>
          </div>
          <EmptyState 
            type="progress"
            title="Belum Ada Data Progress"
            description="Mulai sesi belajar pertama untuk melihat progress dan statistik belajar Anda."
          />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-4 sm:space-y-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Progress</h1>
          <p className="text-muted-foreground">Lacak perjalanan belajar Anda</p>
        </div>
        
        {/* Mastery Trend Chart */}
        <Card className="rounded-xl shadow-md">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg sm:text-xl">Tren Penguasaan</CardTitle>
            <CardDescription className="text-sm">
              Progress belajar Anda dari waktu ke waktu
            </CardDescription>
          </CardHeader>
          <CardContent className="px-2 sm:px-6">
            <div className="h-64 sm:h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 10, fill: '#8B939E' }}
                  />
                  <YAxis 
                    tick={{ fontSize: 10, fill: '#8B939E' }}
                    domain={[0, 100]}
                    width={30}
                  />
                  <Tooltip 
                    labelFormatter={(value) => value}
                    formatter={(value) => [`${value}%`, 'Penguasaan']}
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
              <CardTitle className="text-lg sm:text-xl">Kalender Streak</CardTitle>
              <CardDescription className="text-sm">
                Aktivitas belajar harian
              </CardDescription>
            </CardHeader>
            <CardContent className="px-4 sm:px-6">
              <div className="grid grid-cols-7 gap-1 mb-4">
                {['M', 'S', 'S', 'R', 'K', 'J', 'S'].map((day) => (
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
                <span>Sedikit</span>
                <div className="flex gap-1">
                  <div className="w-3 h-3 rounded border bg-muted" />
                  <div className="w-3 h-3 rounded border bg-primary/10" />
                  <div className="w-3 h-3 rounded border bg-primary/20" />
                  <div className="w-3 h-3 rounded border bg-primary/30" />
                </div>
                <span>Banyak</span>
              </div>
            </CardContent>
          </Card>

          {/* Recent Sessions */}
          <Card className="rounded-xl shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg sm:text-xl">Sesi Terbaru</CardTitle>
              <CardDescription className="text-sm">
                Riwayat sesi belajar Anda
              </CardDescription>
            </CardHeader>
            <CardContent className="px-4 sm:px-6">
              <div className="space-y-3">
                {studySessions.slice(0, 5).map((session) => (
                  <div 
                    key={session.id}
                    className="flex items-center justify-between p-3 sm:p-4 rounded-xl border border-border hover:bg-accent/50 transition-colors cursor-pointer"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-sm sm:text-base truncate">
                        {new Date(session.started_at).toLocaleDateString('id-ID')}
                      </div>
                      <div className="text-xs sm:text-sm text-ash">
                        {session.total_questions} soal • {Math.round(session.time_spent / 60)}min
                      </div>
                    </div>
                    <div className="text-right ml-4">
                      <div className={`font-medium text-sm sm:text-base ${
                        session.accuracy >= 90 ? 'text-green-600' :
                        session.accuracy >= 80 ? 'text-yellow-600' :
                        'text-red-600'
                      }`}>
                        {session.accuracy.toFixed(0)}%
                      </div>
                      <div className="text-xs text-ash">akurasi</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
