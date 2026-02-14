import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { AwsClient } from "npm:aws4fetch@1.0.20"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
}

// Per-folder upload rules (replicating old Supabase Storage policies)
const FOLDER_RULES: Record<string, { maxSizeMB: number; allowedMimeTypes: string[] }> = {
  'ambassador-materials': {
    maxSizeMB: 10,
    allowedMimeTypes: ['image/png', 'image/jpeg', 'image/webp', 'application/pdf'],
  },
}

const DEFAULT_RULES = { maxSizeMB: 50, allowedMimeTypes: [] as string[] } // empty = any

function getR2Config() {
  const accessKeyId = Deno.env.get('R2_ACCESS_KEY_ID')
  const secretAccessKey = Deno.env.get('R2_SECRET_ACCESS_KEY')
  const endpoint = Deno.env.get('R2_ENDPOINT')
  const publicUrl = Deno.env.get('R2_PUBLIC_URL')
  const bucketName = Deno.env.get('R2_BUCKET_NAME')

  if (!accessKeyId || !secretAccessKey || !endpoint || !publicUrl || !bucketName) {
    throw new Error('Missing R2 configuration')
  }

  return { accessKeyId, secretAccessKey, endpoint, publicUrl, bucketName }
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

    const url = new URL(req.url)
    let action = url.searchParams.get('action')

    // Determine action from content type
    const contentType = req.headers.get('content-type') || ''

    // ─── UPLOAD (multipart/form-data) ───
    if (contentType.includes('multipart/form-data') || contentType.includes('form-data')) {
      const formData = await req.formData()
      action = (formData.get('action') as string) || action || 'upload'

      if (action === 'upload') {
        const file = formData.get('file') as File
        const folder = (formData.get('folder') as string) || 'uploads'

        if (!file) {
          return new Response(
            JSON.stringify({ error: 'No file provided' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        // Apply folder-specific rules
        const rules = FOLDER_RULES[folder] || DEFAULT_RULES
        const fileSizeMB = file.size / (1024 * 1024)
        if (fileSizeMB > rules.maxSizeMB) {
          return new Response(
            JSON.stringify({ error: `File too large. Max ${rules.maxSizeMB}MB for folder "${folder}", got ${fileSizeMB.toFixed(1)}MB` }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
        if (rules.allowedMimeTypes.length > 0 && !rules.allowedMimeTypes.includes(file.type)) {
          return new Response(
            JSON.stringify({ error: `File type "${file.type}" not allowed for folder "${folder}". Allowed: ${rules.allowedMimeTypes.join(', ')}` }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        const fileExt = file.name.split('.').pop()?.toLowerCase() || 'bin'
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
        const objectKey = `${folder}/${fileName}`

        const arrayBuffer = await file.arrayBuffer()

        const r2Url = `${config.endpoint}/${config.bucketName}/${objectKey}`
        const response = await aws.fetch(r2Url, {
          method: 'PUT',
          headers: {
            'Content-Type': file.type || 'application/octet-stream',
            'Content-Length': String(arrayBuffer.byteLength),
          },
          body: arrayBuffer,
        })

        if (!response.ok) {
          const errorText = await response.text()
          console.error('R2 upload error:', errorText)
          return new Response(
            JSON.stringify({ error: 'Failed to upload to R2', details: errorText }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        const publicFileUrl = `${config.publicUrl}/${objectKey}`
        return new Response(
          JSON.stringify({ success: true, url: publicFileUrl, key: objectKey }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    // ─── JSON body (delete action) ───
    if (contentType.includes('application/json')) {
      const body = await req.json()
      action = body.action || action

      if (action === 'delete') {
        const objectKey = body.key
        if (!objectKey) {
          return new Response(
            JSON.stringify({ error: 'No key provided' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        const r2Url = `${config.endpoint}/${config.bucketName}/${objectKey}`
        const response = await aws.fetch(r2Url, { method: 'DELETE' })

        if (!response.ok && response.status !== 404) {
          const errorText = await response.text()
          console.error('R2 delete error:', errorText)
          return new Response(
            JSON.stringify({ error: 'Failed to delete from R2', details: errorText }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        return new Response(
          JSON.stringify({ success: true }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    // ─── LIST (GET with query params) ───
    if (action === 'list') {
      const prefix = url.searchParams.get('prefix') || ''
      const r2Url = `${config.endpoint}/${config.bucketName}?list-type=2&prefix=${encodeURIComponent(prefix)}`
      const response = await aws.fetch(r2Url, { method: 'GET' })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('R2 list error:', errorText)
        return new Response(
          JSON.stringify({ error: 'Failed to list R2 objects', details: errorText }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const xmlText = await response.text()
      const keys: string[] = []
      const keyRegex = /<Key>(.*?)<\/Key>/g
      let match
      while ((match = keyRegex.exec(xmlText)) !== null) {
        keys.push(match[1])
      }

      const files = keys.map(key => ({
        key,
        url: `${config.publicUrl}/${key}`,
      }))

      return new Response(
        JSON.stringify({ success: true, files }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action. Send action via form-data or JSON body (upload/delete) or query param (list)' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('r2-storage error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
