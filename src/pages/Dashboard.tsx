import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Users, ClipboardCheck, TrendingUp, LogOut, Menu, UserCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const Dashboard = () => {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    todayPresent: 0,
    todayAbsent: 0,
    totalStudents: 0,
    attendanceRate: 0,
  });
  const [profile, setProfile] = useState<any>(null);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    
    setProfile(data);
  };

  const fetchDashboardData = async () => {
    setLoadingData(true);
    try {
      const today = new Date().toISOString().split('T')[0];

      // Get today's attendance
      const { data: todayAttendance } = await supabase
        .from('attendance_records')
        .select('*')
        .eq('date', today);

      // Get total users count
      const { count: totalUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      const present = todayAttendance?.filter(a => a.status === 'hadir').length || 0;
      const total = totalUsers || 0;
      const rate = total > 0 ? Math.round((present / total) * 100) : 0;

      setStats({
        todayPresent: present,
        todayAbsent: total - present,
        totalStudents: total,
        attendanceRate: rate,
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoadingData(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  if (loading || loadingData) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <Skeleton className="h-12 w-64" />
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-secondary/5">
      {/* Header */}
      <header className="bg-card border-b border-border shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-primary">
              <Menu className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">Sistem Absensi Online</h1>
              <p className="text-sm text-muted-foreground">Dashboard</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <UserCircle className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm font-medium">{profile?.full_name || user?.email}</span>
            </div>
            <Button variant="outline" size="sm" onClick={handleSignOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Keluar
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Welcome Section */}
        <div className="bg-gradient-primary rounded-xl p-6 text-primary-foreground shadow-glow">
          <h2 className="text-2xl font-bold mb-2">Selamat Datang, {profile?.full_name || 'User'}! 👋</h2>
          <p className="text-primary-foreground/90">
            Kelola absensi dengan mudah dan efisien
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card className="border-l-4 border-l-success hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Hadir Hari Ini
              </CardTitle>
              <ClipboardCheck className="h-5 w-5 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{stats.todayPresent}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Siswa/Guru yang hadir
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-destructive hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Tidak Hadir
              </CardTitle>
              <Calendar className="h-5 w-5 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{stats.todayAbsent}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Belum absen hari ini
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-primary hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Pengguna
              </CardTitle>
              <Users className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{stats.totalStudents}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Terdaftar di sistem
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-secondary hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Tingkat Kehadiran
              </CardTitle>
              <TrendingUp className="h-5 w-5 text-secondary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{stats.attendanceRate}%</div>
              <p className="text-xs text-muted-foreground mt-1">
                Rata-rata hari ini
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Menu Cepat</CardTitle>
            <CardDescription>Akses fitur utama sistem</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <Button 
                className="h-auto py-6 flex flex-col gap-2" 
                variant="outline"
                onClick={() => navigate('/attendance')}
              >
                <ClipboardCheck className="h-6 w-6" />
                <span className="font-semibold">Catat Absensi</span>
              </Button>
              <Button 
                className="h-auto py-6 flex flex-col gap-2" 
                variant="outline"
                onClick={() => navigate('/records')}
              >
                <Calendar className="h-6 w-6" />
                <span className="font-semibold">Riwayat Absensi</span>
              </Button>
              <Button 
                className="h-auto py-6 flex flex-col gap-2" 
                variant="outline"
                onClick={() => navigate('/reports')}
              >
                <TrendingUp className="h-6 w-6" />
                <span className="font-semibold">Laporan</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Dashboard;