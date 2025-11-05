import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

interface AttendanceRecord {
  id: string;
  date: string;
  time_in: string | null;
  time_out: string | null;
  status: 'hadir' | 'izin' | 'sakit' | 'alfa';
  notes: string | null;
  rfid_code: string | null;
}

const statusConfig = {
  hadir: { label: 'Hadir', variant: 'default' as const, color: 'bg-success text-success-foreground' },
  izin: { label: 'Izin', variant: 'secondary' as const, color: 'bg-warning text-warning-foreground' },
  sakit: { label: 'Sakit', variant: 'outline' as const, color: 'bg-muted text-muted-foreground' },
  alfa: { label: 'Alfa', variant: 'destructive' as const, color: 'bg-destructive text-destructive-foreground' },
};

const Records = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchRecords();
    }
  }, [user]);

  const fetchRecords = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('attendance_records')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false })
        .limit(30);

      if (error) throw error;
      setRecords(data || []);
    } catch (error) {
      console.error('Error fetching records:', error);
    } finally {
      setLoading(false);
    }
  };

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
              <Calendar className="h-6 w-6" />
              Riwayat Kehadiran
            </CardTitle>
          </CardHeader>
          <CardContent className="mt-6">
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">
                Memuat data...
              </div>
            ) : records.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Belum ada riwayat absensi
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tanggal</TableHead>
                      <TableHead>Waktu Masuk</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Keterangan</TableHead>
                      <TableHead>RFID</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {records.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell className="font-medium">
                          {format(new Date(record.date), 'dd MMMM yyyy', { locale: id })}
                        </TableCell>
                        <TableCell>
                          {record.time_in
                            ? format(new Date(record.time_in), 'HH:mm', { locale: id })
                            : '-'}
                        </TableCell>
                        <TableCell>
                          <Badge className={statusConfig[record.status].color}>
                            {statusConfig[record.status].label}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-xs truncate">
                          {record.notes || '-'}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {record.rfid_code || '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Records;