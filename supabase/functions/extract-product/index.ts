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
    const { fileData, fileType, text } = await req.json()
    const apiKey = Deno.env.get('OPENAI_API_KEY')

    if (!apiKey) throw new Error('OPENAI_API_KEY no está configurada en Supabase Secrets')

    let messages = []

    if (fileData) {
      messages = [
        {
          role: 'system',
          content: 'You are a chemical assistant. Extract product information from the provided image. You MUST return ONLY a JSON object with the following keys: "name", "formula", "cas", "manufacturer", "hazards", "precautions".'
        },
        {
          role: 'user',
          content: [
            { type: 'text', text: 'Extract chemical data from this label and output JSON.' },
            { type: 'image_url', image_url: { url: fileData } }
          ]
        }
      ]
    } else if (text) {
      messages = [
        {
          role: 'system',
          content: 'You are a chemical assistant. Extract product information from the provided text. You MUST return ONLY a JSON object with the following keys: "name", "formula", "cas", "manufacturer", "hazards", "precautions".'
        },
        {
          role: 'user',
          content: `Text:\n\n${text.substring(0, 4000)}`
        }
      ]
    } else {
      throw new Error('No se envió archivo ni texto')
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages,
        response_format: { type: 'json_object' }
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
