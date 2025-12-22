
// FIX: Added a global declaration for the Deno namespace to resolve TypeScript errors in environments 
// that do not have Deno's type definitions globally available.
declare const Deno: any;

// @ts-ignore
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { JWT } from 'https://esm.sh/google-auth-library@8.7.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { record: newRide } = await req.json();
    
    // FIX: Using the Deno global to access environment variables.
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 1. Buscar motoristas online
    const { data: drivers, error: driversError } = await supabaseAdmin
      .from('drivers')
      .select('id')
      .eq('is_active', true)
      .eq('status', 'online');

    if (driversError) throw driversError;
    if (!drivers || drivers.length === 0) {
      return new Response(JSON.stringify({ message: 'Nenhum motorista online.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    // 2. Buscar tokens FCM
    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from('profiles')
      .select('fcm_token')
      .in('id', drivers.map(d => d.id))
      .not('fcm_token', 'is', null);

    if (profilesError) throw profilesError;
    if (!profiles || profiles.length === 0) {
      return new Response(JSON.stringify({ message: 'Sem tokens FCM.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    // 3. Autenticação OAuth2 para Firebase V1
    // FIX: Using the Deno global to access the Firebase service account environment variable.
    const serviceAccount = JSON.parse(Deno.env.get('FIREBASE_SERVICE_ACCOUNT') || '{}');
    const client = new JWT({
      email: serviceAccount.client_email,
      key: serviceAccount.private_key,
      scopes: ['https://www.googleapis.com/auth/firebase.messaging'],
    });

    const credentials = await client.authorize();
    const accessToken = credentials.access_token;
    const projectId = serviceAccount.project_id;

    // 4. Enviar notificações (V1 exige envio individual ou loop)
    const sendResults = await Promise.all(profiles.map(async (profile) => {
      try {
        const res = await fetch(`https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            message: {
              token: profile.fcm_token,
              notification: {
                title: 'Nova Corrida!',
                body: 'Existe uma nova solicitação perto de você.',
              },
              data: {
                rideId: newRide.id,
                type: 'NEW_RIDE'
              }
            }
          }),
        });
        return res.ok;
      } catch (e) {
        return false;
      }
    }));

    return new Response(JSON.stringify({ success: true, sent: sendResults.filter(r => r).length }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
