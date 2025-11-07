import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { rfid_code, device_id, timestamp } = await req.json();

    console.log('ESP32 attendance request:', { rfid_code, device_id, timestamp });

    if (!rfid_code || !device_id) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: rfid_code, device_id' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update device last seen
    const { error: deviceError } = await supabase
      .from('esp32_devices')
      .upsert({
        device_id,
        last_seen: new Date().toISOString(),
      }, {
        onConflict: 'device_id'
      });

    if (deviceError) {
      console.error('Device update error:', deviceError);
    }

    // Find user by RFID code from previous attendance records
    const { data: previousRecord, error: searchError } = await supabase
      .from('attendance_records')
      .select('user_id')
      .eq('rfid_code', rfid_code)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (searchError) {
      console.error('Search error:', searchError);
      return new Response(
        JSON.stringify({ error: 'Database error', details: searchError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!previousRecord) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'RFID tidak terdaftar. Silakan daftarkan kartu RFID terlebih dahulu melalui aplikasi.' 
        }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = previousRecord.user_id;
    const today = new Date().toISOString().split('T')[0];

    // Check if already checked in today
    const { data: existingAttendance } = await supabase
      .from('attendance_records')
      .select('id, time_in')
      .eq('user_id', userId)
      .eq('date', today)
      .maybeSingle();

    if (existingAttendance) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Sudah absen hari ini',
          time_in: existingAttendance.time_in
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create attendance record
    const { data: attendance, error: attendanceError } = await supabase
      .from('attendance_records')
      .insert({
        user_id: userId,
        date: today,
        time_in: new Date().toISOString(),
        status: 'hadir',
        rfid_code,
        device_id,
        face_verified: false,
      })
      .select()
      .single();

    if (attendanceError) {
      console.error('Attendance error:', attendanceError);
      return new Response(
        JSON.stringify({ error: 'Failed to record attendance', details: attendanceError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Attendance recorded successfully:', attendance);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Absensi berhasil dicatat',
        attendance
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
