import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, BarChart3 } from 'lucide-react';

const Reports = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-secondary/5 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <Button variant="ghost" onClick={() => navigate('/dashboard')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Kembali ke Dashboard
        </Button>

        <Card className="shadow-lg">
          <CardHeader className="bg-gradient-primary text-primary-foreground rounded-t-lg">
            <CardTitle className="text-2xl flex items-center gap-2">
              <BarChart3 className="h-6 w-6" />
              Laporan & Statistik
            </CardTitle>
            <CardDescription className="text-primary-foreground/90">
              Analisis kehadiran dan tren
            </CardDescription>
          </CardHeader>
          <CardContent className="mt-6">
            <div className="text-center py-12 space-y-4">
              <div className="p-4 rounded-full bg-muted inline-flex">
                <BarChart3 className="h-12 w-12 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold">Fitur Laporan Segera Hadir</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                Grafik statistik, rekap bulanan, dan analisis kehadiran akan tersedia dalam update berikutnya.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Reports;