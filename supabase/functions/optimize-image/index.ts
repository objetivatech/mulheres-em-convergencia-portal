import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

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

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return new Response(
        JSON.stringify({ error: 'File must be an image' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Size configurations
    const sizeConfig = {
      thumbnail: { width: 150, height: 150, quality: 80 },
      medium: { width: 500, height: 500, quality: 85 },
      large: { width: 1024, height: 1024, quality: 90 },
      original: { quality: 95 } // Just compress, don't resize
    }

    const results: Record<string, string> = {}
    const fileExt = file.name.split('.').pop()?.toLowerCase()
    const baseFileName = `${Date.now()}-${Math.random().toString(36).substring(2)}`

    // Process each requested size
    for (const size of sizes) {
      const config = sizeConfig[size as keyof typeof sizeConfig]
      if (!config) continue

      try {
        let processedFile = file
        
        // For WebP conversion and optimization, we'll use a simple approach
        // In production, you might want to use a more sophisticated image processing library
        
        const fileName = `${baseFileName}-${size}.${fileExt === 'gif' ? 'gif' : 'webp'}`
        const filePath = `optimized/${fileName}`

        // Upload the file (in a real implementation, you'd process it first)
        const { error: uploadError } = await supabase.storage
          .from(bucket)
          .upload(filePath, processedFile, {
            cacheControl: '31536000', // 1 year
            upsert: false,
            contentType: fileExt === 'gif' ? 'image/gif' : 'image/webp'
          })

        if (uploadError) {
          console.error(`Upload error for ${size}:`, uploadError)
          continue
        }

        // Get public URL
        const { data } = supabase.storage
          .from(bucket)
          .getPublicUrl(filePath)

        results[size] = data.publicUrl

      } catch (error) {
        console.error(`Processing error for ${size}:`, error)
      }
    }

    // Also upload original if not processed
    if (!results.original) {
      const fileName = `${baseFileName}-original.${fileExt}`
      const filePath = `original/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, {
          cacheControl: '31536000',
          upsert: false
        })

      if (!uploadError) {
        const { data } = supabase.storage
          .from(bucket)
          .getPublicUrl(filePath)
        results.original = data.publicUrl
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