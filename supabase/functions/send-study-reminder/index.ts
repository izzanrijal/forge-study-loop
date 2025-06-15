
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { Resend } from "npm:resend@2.0.0"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const resend = new Resend(Deno.env.get("RESEND_API_KEY"))

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get due email reminders
    const { data: reminders, error: reminderError } = await supabase
      .rpc('get_due_email_reminders')

    if (reminderError) {
      console.error('Error fetching reminders:', reminderError)
      throw reminderError
    }

    console.log(`Found ${reminders?.length || 0} due reminders`)

    for (const reminder of reminders || []) {
      try {
        // Generate test URL with token
        const testUrl = `https://htmkmahllfvgyhaxnjju.supabase.co/functions/v1/anonymous-study?token=${reminder.test_token}&lo_id=${reminder.learning_objective_id}`
        
        // Send email
        const emailResult = await resend.emails.send({
          from: "RecallForge <noreply@recallforge.com>",
          to: [reminder.email],
          subject: `📚 Waktu Belajar: ${reminder.learning_objective_title}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #2563eb;">🎯 Saatnya Review Materi!</h2>
              
              <p>Halo! Ini adalah pengingat untuk mereview materi pembelajaran Anda:</p>
              
              <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="margin: 0 0 10px 0; color: #1e40af;">${reminder.learning_objective_title}</h3>
                <p style="margin: 0; color: #64748b;">Learning Objective ID: ${reminder.learning_objective_id}</p>
              </div>
              
              <p>Klik tombol di bawah untuk langsung mulai belajar tanpa perlu login:</p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${testUrl}" 
                   style="background-color: #2563eb; color: white; padding: 15px 30px; 
                          text-decoration: none; border-radius: 8px; display: inline-block;
                          font-weight: bold;">
                  🚀 Mulai Belajar Sekarang
                </a>
              </div>
              
              <div style="background: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 0; color: #92400e;">
                  💡 <strong>Tips:</strong> Link ini khusus untuk Anda dan berlaku selama 24 jam. 
                  Anda bisa belajar materi lengkap dan mengerjakan latihan tanpa harus login.
                </p>
              </div>
              
              <hr style="margin: 30px 0; border: none; border-top: 1px solid #e2e8f0;">
              
              <p style="font-size: 14px; color: #64748b;">
                Email ini dikirim secara otomatis oleh sistem RecallForge untuk membantu Anda 
                tetap konsisten dalam belajar dengan metode spaced repetition.
              </p>
              
              <p style="font-size: 12px; color: #94a3b8;">
                Jika Anda tidak ingin menerima email ini lagi, silakan hubungi admin atau 
                login ke akun Anda untuk mengatur preferensi notifikasi.
              </p>
            </div>
          `
        })

        console.log(`Email sent to ${reminder.email}:`, emailResult)

        // Mark email as sent
        await supabase.rpc('mark_email_sent', { reminder_id: reminder.id })

      } catch (emailError) {
        console.error(`Failed to send email to ${reminder.email}:`, emailError)
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        processed: reminders?.length || 0,
        message: `Processed ${reminders?.length || 0} email reminders`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in send-study-reminder function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
