import { useState, useRef, useEffect } from 'react';
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
import { ArrowLeft, Scan, CheckCircle, MapPin, Camera, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

const Attendance = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [locationStatus, setLocationStatus] = useState<'pending' | 'verified' | 'failed'>('pending');
  const [faceStatus, setFaceStatus] = useState<'pending' | 'verified' | 'failed'>('pending');
  const [locationData, setLocationData] = useState<{ lat: number; lng: number } | null>(null);
  const [schoolSettings, setSchoolSettings] = useState<any>(null);
  const [formData, setFormData] = useState({
    rfidCode: '',
    status: 'hadir' as 'hadir' | 'izin' | 'sakit' | 'alfa',
    notes: '',
  });

  // Load school settings
  useEffect(() => {
    const loadSettings = async () => {
      const { data } = await supabase
        .from('school_settings')
        .select('*')
        .single();
      setSchoolSettings(data);
    };
    loadSettings();
  }, []);

  // Get GPS location
  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      toast({
        title: 'GPS Tidak Didukung',
        description: 'Browser Anda tidak mendukung geolocation',
        variant: 'destructive',
      });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setLocationData({ lat: latitude, lng: longitude });

        if (!schoolSettings) {
          setLocationStatus('failed');
          return;
        }

        // Calculate distance using Haversine formula
        const R = 6371e3; // Earth radius in meters
        const φ1 = (latitude * Math.PI) / 180;
        const φ2 = (schoolSettings.latitude * Math.PI) / 180;
        const Δφ = ((schoolSettings.latitude - latitude) * Math.PI) / 180;
        const Δλ = ((schoolSettings.longitude - longitude) * Math.PI) / 180;

        const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
          Math.cos(φ1) * Math.cos(φ2) *
          Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = R * c;

        if (distance <= schoolSettings.radius_meters) {
          setLocationStatus('verified');
          toast({
            title: 'Lokasi Terverifikasi',
            description: `Anda berada dalam radius ${Math.round(distance)}m dari sekolah`,
          });
        } else {
          setLocationStatus('failed');
          toast({
            title: 'Lokasi Tidak Valid',
            description: `Anda berada ${Math.round(distance)}m dari sekolah (maksimal ${schoolSettings.radius_meters}m)`,
            variant: 'destructive',
          });
        }
      },
      (error) => {
        setLocationStatus('failed');
        toast({
          title: 'Gagal Mendapatkan Lokasi',
          description: error.message,
          variant: 'destructive',
        });
      }
    );
  };

  // Start camera for face capture
  const handleStartCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user' } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsCameraActive(true);
      }
    } catch (error) {
      toast({
        title: 'Gagal Mengakses Kamera',
        description: 'Pastikan Anda memberikan izin akses kamera',
        variant: 'destructive',
      });
    }
  };

  // Capture face photo
  const handleCaptureFace = () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        const imageData = canvas.toDataURL('image/jpeg');
        setCapturedImage(imageData);
        
        // Stop camera
        const stream = video.srcObject as MediaStream;
        stream?.getTracks().forEach(track => track.stop());
        setIsCameraActive(false);

        // Verify face
        verifyFace(imageData);
      }
    }
  };

  // Verify face using AI
  const verifyFace = async (imageBase64: string) => {
    if (!user) return;

    try {
      const { data, error } = await supabase.functions.invoke('verify-face', {
        body: { 
          user_id: user.id,
          captured_image_base64: imageBase64
        }
      });

      if (error) throw error;

      if (data.verified) {
        setFaceStatus('verified');
        toast({
          title: 'Wajah Terverifikasi',
          description: data.message,
        });
      } else {
        setFaceStatus('failed');
        toast({
          title: 'Verifikasi Gagal',
          description: data.message,
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      setFaceStatus('failed');
      toast({
        title: 'Error Verifikasi',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

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

    // Validate verifications if required
    if (schoolSettings?.require_location_verification && locationStatus !== 'verified') {
      toast({
        title: 'Verifikasi Lokasi Diperlukan',
        description: 'Silakan verifikasi lokasi terlebih dahulu',
        variant: 'destructive',
      });
      return;
    }

    if (schoolSettings?.require_face_verification && faceStatus !== 'verified') {
      toast({
        title: 'Verifikasi Wajah Diperlukan',
        description: 'Silakan verifikasi wajah terlebih dahulu',
        variant: 'destructive',
      });
      return;
    }

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
          location: locationData ? JSON.stringify(locationData) : null,
          face_verified: faceStatus === 'verified',
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
              {/* GPS Location Verification */}
              {schoolSettings?.require_location_verification && (
                <div className="space-y-4">
                  <Label>Verifikasi Lokasi GPS</Label>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant={locationStatus === 'verified' ? 'default' : 'outline'}
                      onClick={handleGetLocation}
                      disabled={isSubmitting || locationStatus === 'verified'}
                      className="flex-1"
                    >
                      <MapPin className="h-4 w-4 mr-2" />
                      {locationStatus === 'pending' && 'Dapatkan Lokasi'}
                      {locationStatus === 'verified' && '✓ Lokasi Terverifikasi'}
                      {locationStatus === 'failed' && '✗ Lokasi Tidak Valid'}
                    </Button>
                  </div>
                  {locationData && (
                    <Alert>
                      <AlertDescription>
                        Koordinat: {locationData.lat.toFixed(6)}, {locationData.lng.toFixed(6)}
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              )}

              {/* Face Verification */}
              {schoolSettings?.require_face_verification && (
                <div className="space-y-4">
                  <Label>Verifikasi Wajah</Label>
                  {!isCameraActive && !capturedImage && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleStartCamera}
                      disabled={isSubmitting}
                      className="w-full"
                    >
                      <Camera className="h-4 w-4 mr-2" />
                      Buka Kamera
                    </Button>
                  )}
                  
                  {isCameraActive && (
                    <div className="space-y-2">
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        className="w-full rounded-lg border"
                      />
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={handleCaptureFace}
                        className="w-full"
                      >
                        <Camera className="h-4 w-4 mr-2" />
                        Ambil Foto
                      </Button>
                    </div>
                  )}

                  {capturedImage && (
                    <div className="space-y-2">
                      <img
                        src={capturedImage}
                        alt="Captured face"
                        className="w-full rounded-lg border"
                      />
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant={faceStatus === 'verified' ? 'default' : 'outline'}
                          disabled
                          className="flex-1"
                        >
                          {faceStatus === 'pending' && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                          {faceStatus === 'verified' && '✓ Wajah Terverifikasi'}
                          {faceStatus === 'failed' && '✗ Verifikasi Gagal'}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setCapturedImage(null);
                            setFaceStatus('pending');
                            handleStartCamera();
                          }}
                        >
                          Ambil Ulang
                        </Button>
                      </div>
                    </div>
                  )}
                  
                  <canvas ref={canvasRef} style={{ display: 'none' }} />
                </div>
              )}

              {/* RFID Section */}
              <div className="space-y-4">
                <Label htmlFor="rfid">Kode RFID {schoolSettings?.require_rfid ? '' : '(Opsional)'}</Label>
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
                  {schoolSettings?.require_location_verification && '• Verifikasi lokasi GPS diperlukan\n'}
                  {schoolSettings?.require_face_verification && '• Verifikasi wajah diperlukan\n'}
                  {schoolSettings?.require_rfid && '• RFID diperlukan\n'}
                  • Pilih status kehadiran yang sesuai<br />
                  • Tambahkan keterangan jika diperlukan<br />
                  • Satu absensi per hari per pengguna
                </p>
              </div>
              <div className="space-y-1 mt-4 p-3 bg-blue-500/10 rounded-lg">
                <h3 className="font-semibold text-sm">Untuk ESP32 RFID Reader:</h3>
                <p className="text-xs text-muted-foreground font-mono break-all">
                  POST ke: {import.meta.env.VITE_SUPABASE_URL}/functions/v1/esp32-attendance
                  <br />
                  Body: {`{"rfid_code": "...", "device_id": "..."}`}
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