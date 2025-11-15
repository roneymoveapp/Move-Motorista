// Corrected the Supabase/Deno type definition URL to a stable version from the dist folder to resolve 'Deno' not being found.
/// <reference types="https://esm.sh/@supabase/functions-js@2.4.1/dist/edge-runtime.d.ts" />

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// CORS headers para permitir que a função seja chamada de qualquer origem.
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// A função principal que será executada.
serve(async (req: Request) => {
  // Responde a requisições OPTIONS (pre-flight) para CORS.
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // 1. RECEBE OS DADOS DA NOVA CORRIDA DO GATILHO
    const { record: newRide } = await req.json();

    // 2. CRIA UM CLIENTE SUPABASE COM PERMISSÕES DE ADMINISTRADOR
    //    Isso é necessário para buscar dados de qualquer tabela sem restrições de RLS.
    //    As chaves secretas devem ser configuradas no painel do Supabase.
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 3. ENCONTRA TODOS OS MOTORISTAS QUE ESTÃO ONLINE E ATIVOS
    const { data: drivers, error: driversError } = await supabaseAdmin
      .from('drivers')
      .select('id')
      .eq('is_active', true)
      .eq('status', 'online');

    if (driversError) {
      throw new Error(`Erro ao buscar motoristas: ${driversError.message}`);
    }

    if (!drivers || drivers.length === 0) {
      console.log('Nenhum motorista online encontrado.');
      return new Response(JSON.stringify({ message: 'Nenhum motorista online.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    const driverIds = drivers.map((d) => d.id);

    // 4. BUSCA OS TOKENS DE NOTIFICAÇÃO (FCM TOKENS) DOS MOTORISTAS ENCONTRADOS
    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from('profiles')
      .select('fcm_token')
      .in('id', driverIds)
      .not('fcm_token', 'is', null); // Garante que só peguemos perfis com token

    if (profilesError) {
      throw new Error(`Erro ao buscar perfis/tokens: ${profilesError.message}`);
    }

    if (!profiles || profiles.length === 0) {
      console.log('Nenhum motorista com token de notificação encontrado.');
      return new Response(JSON.stringify({ message: 'Nenhum motorista com token.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }
    
    // 5. PREPARA E ENVIA A NOTIFICAÇÃO PARA CADA MOTORISTA VIA FIREBASE
    const firebaseServerKey = Deno.env.get('FIREBASE_SERVER_KEY');
    if (!firebaseServerKey) {
        throw new Error('Chave do servidor Firebase não configurada como um segredo.');
    }
    
    const notificationPayload = {
      notification: {
        title: 'Nova Corrida Disponível!',
        body: `Uma nova corrida foi solicitada nas proximidades. Toque para ver os detalhes.`,
        sound: 'default',
      },
      // Os tokens de registro dos dispositivos alvo
      registration_ids: profiles.map(p => p.fcm_token),
    };

    const response = await fetch('https://fcm.googleapis.com/fcm/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `key=${firebaseServerKey}`,
      },
      body: JSON.stringify(notificationPayload),
    });

    if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`Erro ao enviar notificação para o Firebase: ${response.status} ${errorBody}`);
    }

    const responseData = await response.json();
    console.log('Notificações enviadas com sucesso:', responseData);

    return new Response(JSON.stringify({ success: true, details: responseData }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Erro na Edge Function:', error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});