import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'
import { AwsClient } from "npm:aws4fetch@1.0.20"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Parse request body for options
    let options: { bucket?: string; updateUrls?: boolean; offset?: number; limit?: number } = {}
    try {
      options = await req.json()
    } catch {
      // No body = default behavior
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const r2Config = {
      accessKeyId: Deno.env.get('R2_ACCESS_KEY_ID') ?? '',
      secretAccessKey: Deno.env.get('R2_SECRET_ACCESS_KEY') ?? '',
      endpoint: Deno.env.get('R2_ENDPOINT') ?? '',
      publicUrl: Deno.env.get('R2_PUBLIC_URL') ?? '',
      bucketName: Deno.env.get('R2_BUCKET_NAME') ?? '',
    }

    const aws = new AwsClient({
      accessKeyId: r2Config.accessKeyId,
      secretAccessKey: r2Config.secretAccessKey,
      service: 's3',
      region: 'auto',
    })

    // If updateUrls=true, only update database URLs (no file migration)
    if (options.updateUrls) {
      const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
      const urlUpdates = await updateDatabaseUrls(supabase, supabaseUrl, r2Config.publicUrl)
      return new Response(
        JSON.stringify({ success: true, urlUpdates }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Migrate a single bucket (required to avoid timeout)
    const bucket = options.bucket
    if (!bucket) {
      return new Response(
        JSON.stringify({
          error: 'Please specify a bucket to migrate',
          usage: {
            step1: 'Migrate each bucket one at a time:',
            examples: [
              { body: '{"bucket": "branding"}', note: 'Smallest bucket, start here' },
              { body: '{"bucket": "partner-logos"}', note: 'Partner logos' },
              { body: '{"bucket": "ambassador-materials"}', note: 'Ambassador materials' },
              { body: '{"bucket": "blog-images"}', note: 'Largest bucket, may need multiple runs with offset' },
            ],
            step2: 'After all buckets are migrated, update database URLs:',
            example: '{"updateUrls": true}',
            optional: 'For large buckets, use offset and limit: {"bucket": "blog-images", "offset": 0, "limit": 50}',
          }
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const fileLimit = options.limit || 80
    const stats = { migrated: 0, errors: 0, skipped: 0 }

    // List files in the bucket
    const { data: files, error: listError } = await supabase.storage
      .from(bucket)
      .list('', { limit: 1000, sortBy: { column: 'name', order: 'asc' } })

    if (listError) {
      return new Response(
        JSON.stringify({ error: `Error listing ${bucket}`, details: listError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!files || files.length === 0) {
      return new Response(
        JSON.stringify({ success: true, bucket, message: 'Bucket is empty', stats }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Collect all file paths (flatten folders)
    const allFiles: { bucket: string; path: string }[] = []
    await collectFiles(supabase, bucket, '', files, allFiles)

    // Apply offset and limit
    const offset = options.offset || 0
    const sliced = allFiles.slice(offset, offset + fileLimit)
    const hasMore = offset + fileLimit < allFiles.length

    console.log(`Bucket ${bucket}: ${allFiles.length} total files, processing ${sliced.length} (offset=${offset}, limit=${fileLimit})`)

    // Process files
    for (const file of sliced) {
      try {
        const { data, error } = await supabase.storage
          .from(file.bucket)
          .download(file.path)

        if (error || !data) {
          console.error(`Download error ${file.bucket}/${file.path}:`, error)
          stats.errors++
          continue
        }

        const objectKey = `${file.bucket}/${file.path}`
        const arrayBuffer = await data.arrayBuffer()
        const r2Url = `${r2Config.endpoint}/${r2Config.bucketName}/${objectKey}`

        const response = await aws.fetch(r2Url, {
          method: 'PUT',
          headers: {
            'Content-Type': data.type || 'application/octet-stream',
            'Content-Length': String(arrayBuffer.byteLength),
            'Cache-Control': 'public, max-age=31536000',
          },
          body: arrayBuffer,
        })

        if (response.ok) {
          stats.migrated++
          console.log(`✓ ${objectKey}`)
        } else {
          stats.errors++
          console.error(`✗ ${objectKey}: ${response.status}`)
        }
      } catch (err) {
        stats.errors++
        console.error(`Error migrating ${file.bucket}/${file.path}:`, err)
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        bucket,
        stats,
        totalFiles: allFiles.length,
        processed: { from: offset, to: offset + sliced.length },
        hasMore,
        nextOffset: hasMore ? offset + fileLimit : null,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Migration error:', error)
    return new Response(
      JSON.stringify({ error: 'Migration failed', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

async function collectFiles(
  supabase: any,
  bucket: string,
  prefix: string,
  items: any[],
  result: { bucket: string; path: string }[]
) {
  for (const item of items) {
    const fullPath = prefix ? `${prefix}/${item.name}` : item.name

    if (item.id === null) {
      const { data: subFiles } = await supabase.storage
        .from(bucket)
        .list(fullPath, { limit: 1000, sortBy: { column: 'name', order: 'asc' } })
      if (subFiles?.length) {
        await collectFiles(supabase, bucket, fullPath, subFiles, result)
      }
      continue
    }

    result.push({ bucket, path: fullPath })
  }
}

async function updateDatabaseUrls(supabase: any, supabaseUrl: string, r2PublicUrl: string) {
  const storageBase = `${supabaseUrl}/storage/v1/object/public/`
  const updates: Record<string, number> = {}

  const urlColumns = [
    { table: 'blog_posts', column: 'featured_image_url' },
    { table: 'ambassador_materials', column: 'file_url' },
    { table: 'ambassadors', column: 'public_photo_url' },
    { table: 'businesses', column: 'logo_url' },
    { table: 'businesses', column: 'cover_image_url' },
    { table: 'blog_authors', column: 'photo_url' },
    { table: 'community_groups', column: 'image_url' },
    { table: 'courses', column: 'image_url' },
    { table: 'business_menu_items', column: 'image_url' },
  ]

  for (const { table, column } of urlColumns) {
    try {
      const { data: rows, error } = await supabase
        .from(table)
        .select(`id, ${column}`)
        .like(column, `${storageBase}%`)

      if (error || !rows?.length) continue

      let count = 0
      for (const row of rows) {
        const oldUrl = row[column] as string
        const relativePath = oldUrl.replace(storageBase, '')
        const newUrl = `${r2PublicUrl}/${relativePath}`

        const { error: updateError } = await supabase
          .from(table)
          .update({ [column]: newUrl })
          .eq('id', row.id)

        if (!updateError) count++
      }
      updates[`${table}.${column}`] = count
    } catch (err) {
      console.error(`URL update error for ${table}.${column}:`, err)
    }
  }

  // Handle gallery_images array
  try {
    const { data: businesses } = await supabase
      .from('businesses')
      .select('id, gallery_images')
      .not('gallery_images', 'is', null)

    let galleryCount = 0
    for (const biz of businesses || []) {
      if (!biz.gallery_images?.length) continue
      const updated = biz.gallery_images.map((url: string) => {
        if (url.startsWith(storageBase)) {
          return `${r2PublicUrl}/${url.replace(storageBase, '')}`
        }
        return url
      })
      if (JSON.stringify(updated) !== JSON.stringify(biz.gallery_images)) {
        await supabase.from('businesses').update({ gallery_images: updated }).eq('id', biz.id)
        galleryCount++
      }
    }
    if (galleryCount) updates['businesses.gallery_images'] = galleryCount
  } catch (err) {
    console.error('Gallery images update error:', err)
  }

  return updates
}
