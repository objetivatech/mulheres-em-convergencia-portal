import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { AwsClient } from "npm:aws4fetch@1.0.20"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

function getR2Config() {
  return {
    accessKeyId: Deno.env.get('R2_ACCESS_KEY_ID') ?? '',
    secretAccessKey: Deno.env.get('R2_SECRET_ACCESS_KEY') ?? '',
    endpoint: Deno.env.get('R2_ENDPOINT') ?? '',
    publicUrl: Deno.env.get('R2_PUBLIC_URL') ?? '',
    bucketName: Deno.env.get('R2_BUCKET_NAME') ?? '',
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const config = getR2Config()
    const aws = new AwsClient({
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
      service: 's3',
      region: 'auto',
    })

    const formData = await req.formData()
    const file = formData.get('file') as File
    const bucket = formData.get('bucket') as string || 'blog-images'
    const sizes = JSON.parse(formData.get('sizes') as string || '["original", "large", "medium", "thumbnail"]')
    
    if (!file) {
      return new Response(
        JSON.stringify({ error: 'No file provided' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    if (!file.type.startsWith('image/')) {
      return new Response(
        JSON.stringify({ error: 'File must be an image' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    const results: Record<string, string> = {}
    const fileExt = file.name.split('.').pop()?.toLowerCase()
    const baseFileName = `${Date.now()}-${Math.random().toString(36).substring(2)}`

    // Upload each size variant to R2
    for (const size of sizes) {
      try {
        const ext = fileExt === 'gif' ? 'gif' : 'webp'
        const contentType = fileExt === 'gif' ? 'image/gif' : 'image/webp'
        const objectKey = `${bucket}/optimized/${baseFileName}-${size}.${ext}`
        
        const arrayBuffer = await file.arrayBuffer()

        const r2Url = `${config.endpoint}/${config.bucketName}/${objectKey}`
        const response = await aws.fetch(r2Url, {
          method: 'PUT',
          headers: {
            'Content-Type': contentType,
            'Content-Length': String(arrayBuffer.byteLength),
            'Cache-Control': 'public, max-age=31536000',
          },
          body: arrayBuffer,
        })

        if (!response.ok) {
          console.error(`R2 upload error for ${size}:`, await response.text())
          continue
        }

        results[size] = `${config.publicUrl}/${objectKey}`
      } catch (error) {
        console.error(`Processing error for ${size}:`, error)
      }
    }

    // Upload original if not yet uploaded
    if (!results.original) {
      const objectKey = `${bucket}/original/${baseFileName}-original.${fileExt}`
      const arrayBuffer = await file.arrayBuffer()

      const r2Url = `${config.endpoint}/${config.bucketName}/${objectKey}`
      const response = await aws.fetch(r2Url, {
        method: 'PUT',
        headers: {
          'Content-Type': file.type,
          'Content-Length': String(arrayBuffer.byteLength),
          'Cache-Control': 'public, max-age=31536000',
        },
        body: arrayBuffer,
      })

      if (response.ok) {
        results.original = `${config.publicUrl}/${objectKey}`
      }
    }

    console.log('Image optimization results:', results)

    return new Response(
      JSON.stringify({ 
        success: true, 
        urls: results,
        message: `Image optimized in ${Object.keys(results).length} sizes`
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Error in optimize-image function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})
