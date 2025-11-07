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
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { user_id, captured_image_base64 } = await req.json();

    console.log('Face verification request for user:', user_id);

    if (!user_id || !captured_image_base64) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get stored face image
    const { data: faceData, error: faceError } = await supabase
      .from('student_faces')
      .select('face_image_url')
      .eq('user_id', user_id)
      .eq('is_active', true)
      .maybeSingle();

    if (faceError || !faceData) {
      console.error('Face data error:', faceError);
      return new Response(
        JSON.stringify({ 
          verified: false, 
          message: 'Foto wajah belum terdaftar. Silakan daftarkan foto wajah terlebih dahulu.' 
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Use Lovable AI vision model to compare faces
    if (!lovableApiKey) {
      console.error('LOVABLE_API_KEY not configured');
      return new Response(
        JSON.stringify({ verified: false, message: 'AI verification service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Compare these two face images and determine if they are the same person. Respond with ONLY "MATCH" if they are the same person, or "NO_MATCH" if they are different people. Consider facial features, structure, and overall appearance. Be strict in your comparison for security purposes.'
              },
              {
                type: 'image_url',
                image_url: {
                  url: faceData.face_image_url
                }
              },
              {
                type: 'image_url',
                image_url: {
                  url: captured_image_base64
                }
              }
            ]
          }
        ]
      })
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI verification failed:', aiResponse.status, errorText);
      return new Response(
        JSON.stringify({ verified: false, message: 'AI verification service error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const aiResult = await aiResponse.json();
    const verdict = aiResult.choices[0]?.message?.content?.trim();

    console.log('AI face comparison result:', verdict);

    const isMatch = verdict === 'MATCH';

    return new Response(
      JSON.stringify({ 
        verified: isMatch,
        message: isMatch ? 'Verifikasi wajah berhasil' : 'Wajah tidak cocok dengan data yang terdaftar',
        confidence: isMatch ? 'high' : 'low'
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ verified: false, error: 'Internal server error', details: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
