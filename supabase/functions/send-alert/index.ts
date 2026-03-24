import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { productName, currentQuantity, minQuantity } = await req.json()
    const apiKey = Deno.env.get('RESEND_API_KEY')

    if (!apiKey) throw new Error('RESEND_API_KEY no está configurada en Supabase Secrets')

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'ChemStock Alerts <onboarding@resend.dev>',
        to: ['entregas@nilg.es'], // Cambia si el usuario quiere que llegue a otro
        subject: `⚠️ Alerta de Stock Bajo: ${productName}`,
        html: `
          <h2>Aviso del Inventario</h2>
          <p>El producto <strong>${productName}</strong> ha alcanzado su nivel mínimo de stock.</p>
          <ul>
            <li><strong>Cantidad actual:</strong> ${currentQuantity}</li>
            <li><strong>Cantidad mínima recomiendada:</strong> ${minQuantity}</li>
          </ul>
          <p>Por favor, revisa el laboratorio y procede a la reposición.</p>
        `
      }),
    })

    const data = await response.json()
    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
