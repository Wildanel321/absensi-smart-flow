import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Scan, CheckCircle } from 'lucide-react';

const Attendance = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    rfidCode: '',
    status: 'hadir' as 'hadir' | 'izin' | 'sakit' | 'alfa',
    notes: '',
  });

  const handleRFIDScan = () => {
    // Simulate RFID scan
    const randomRFID = `RFID${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
    setFormData({ ...formData, rfidCode: randomRFID });
    toast({
      title: 'RFID Terdeteksi',
      description: `Kode: ${randomRFID}`,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsSubmitting(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const { error } = await supabase
        .from('attendance_records')
        .upsert({
          user_id: user.id,
          date: today,
          time_in: new Date().toISOString(),
          status: formData.status,
          notes: formData.notes || null,
          rfid_code: formData.rfidCode || null,
        }, {
          onConflict: 'user_id,date'
        });

      if (error) throw error;

      toast({
        title: 'Absensi Berhasil!',
        description: `Status: ${formData.status.toUpperCase()}`,
      });

      navigate('/dashboard');
    } catch (error: any) {
      toast({
        title: 'Absensi Gagal',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-secondary/5 p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        <Button variant="ghost" onClick={() => navigate('/dashboard')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Kembali ke Dashboard
        </Button>

        <Card className="shadow-lg">
          <CardHeader className="bg-gradient-primary text-primary-foreground rounded-t-lg">
            <CardTitle className="text-2xl flex items-center gap-2">
              <CheckCircle className="h-6 w-6" />
              Catat Kehadiran
            </CardTitle>
            <CardDescription className="text-primary-foreground/90">
              Scan RFID atau input manual
            </CardDescription>
          </CardHeader>
          <CardContent className="mt-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* RFID Section */}
              <div className="space-y-4">
                <Label htmlFor="rfid">Kode RFID (Opsional)</Label>
                <div className="flex gap-2">
                  <Input
                    id="rfid"
                    type="text"
                    placeholder="Scan atau input manual"
                    value={formData.rfidCode}
                    onChange={(e) => setFormData({ ...formData, rfidCode: e.target.value })}
                    disabled={isSubmitting}
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={handleRFIDScan}
                    disabled={isSubmitting}
                  >
                    <Scan className="h-4 w-4 mr-2" />
                    Scan
                  </Button>
                </div>
              </div>

              {/* Status Selection */}
              <div className="space-y-2">
                <Label htmlFor="status">Status Kehadiran</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: any) => setFormData({ ...formData, status: value })}
                  disabled={isSubmitting}
                >
                  <SelectTrigger id="status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hadir">✅ Hadir</SelectItem>
                    <SelectItem value="izin">📝 Izin</SelectItem>
                    <SelectItem value="sakit">🏥 Sakit</SelectItem>
                    <SelectItem value="alfa">❌ Alfa</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes">Keterangan (Opsional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Tambahkan catatan jika diperlukan..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  disabled={isSubmitting}
                  rows={3}
                />
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full"
                size="lg"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Menyimpan...' : 'Simpan Absensi'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card className="bg-muted/50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-full bg-primary/10">
                <Scan className="h-5 w-5 text-primary" />
              </div>
              <div className="space-y-1">
                <h3 className="font-semibold">Informasi</h3>
                <p className="text-sm text-muted-foreground">
                  • Klik "Scan" untuk simulasi scan RFID<br />
                  • Pilih status kehadiran yang sesuai<br />
                  • Tambahkan keterangan jika diperlukan<br />
                  • Satu absensi per hari per pengguna
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Attendance;