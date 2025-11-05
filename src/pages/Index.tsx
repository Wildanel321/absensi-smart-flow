import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { School, CheckCircle, BarChart3, Users, ArrowRight } from 'lucide-react';

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      navigate('/dashboard');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Memuat...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-secondary/5">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-primary opacity-10"></div>
        <div className="relative max-w-7xl mx-auto px-6 py-24 sm:py-32">
          <div className="text-center space-y-8">
            <div className="flex justify-center">
              <div className="p-4 rounded-full bg-gradient-primary shadow-glow">
                <School className="h-16 w-16 text-primary-foreground" />
              </div>
            </div>
            <div className="space-y-4">
              <h1 className="text-5xl sm:text-6xl font-bold text-foreground">
                Sistem Absensi Online
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Kelola kehadiran sekolah atau kantor dengan mudah, cepat, dan efisien menggunakan teknologi modern
              </p>
            </div>
            <div className="flex gap-4 justify-center">
              <Button size="lg" onClick={() => navigate('/auth')} className="shadow-md">
                Mulai Sekarang
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">Fitur Unggulan</h2>
        <div className="grid gap-8 md:grid-cols-3">
          <Card className="p-6 hover:shadow-lg transition-shadow">
            <div className="p-3 rounded-lg bg-primary/10 w-fit mb-4">
              <CheckCircle className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Absensi RFID & Manual</h3>
            <p className="text-muted-foreground">
              Mendukung scan kartu RFID atau input manual dengan interface yang user-friendly
            </p>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-shadow">
            <div className="p-3 rounded-lg bg-secondary/10 w-fit mb-4">
              <BarChart3 className="h-8 w-8 text-secondary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Dashboard Statistik</h3>
            <p className="text-muted-foreground">
              Pantau tingkat kehadiran dengan visualisasi data yang interaktif dan real-time
            </p>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-shadow">
            <div className="p-3 rounded-lg bg-accent/10 w-fit mb-4">
              <Users className="h-8 w-8 text-accent" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Multi-Level Access</h3>
            <p className="text-muted-foreground">
              Sistem role-based dengan akses berbeda untuk Admin, Guru, dan Siswa
            </p>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <Card className="bg-gradient-primary text-primary-foreground p-12 text-center shadow-glow">
          <h2 className="text-3xl font-bold mb-4">Siap untuk Memulai?</h2>
          <p className="text-lg mb-8 text-primary-foreground/90 max-w-2xl mx-auto">
            Bergabunglah dengan sistem absensi modern yang memudahkan pengelolaan kehadiran
          </p>
          <Button 
            size="lg" 
            variant="secondary"
            onClick={() => navigate('/auth')}
            className="shadow-md"
          >
            Daftar Gratis Sekarang
          </Button>
        </Card>
      </section>
    </div>
  );
};

export default Index;
