
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const url = new URL(req.url)
    const token = url.searchParams.get('token')
    const loId = url.searchParams.get('lo_id')

    if (!token || !loId) {
      return new Response('Missing token or learning objective ID', { 
        status: 400,
        headers: corsHeaders 
      })
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Verify token and get reminder info
    const { data: reminder, error: reminderError } = await supabase
      .from('email_reminders')
      .select('*')
      .eq('test_token', token)
      .eq('learning_objective_id', loId)
      .single()

    if (reminderError || !reminder) {
      return new Response('Invalid or expired token', { 
        status: 401,
        headers: corsHeaders 
      })
    }

    // Redirect to frontend with token
    const frontendUrl = `https://htmkmahllfvgyhaxnjju.supabase.co/?anonymous_token=${token}&lo_id=${loId}&mode=study`
    
    return new Response(null, {
      status: 302,
      headers: {
        ...corsHeaders,
        'Location': frontendUrl
      }
    })

  } catch (error) {
    console.error('Error in anonymous-study function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
