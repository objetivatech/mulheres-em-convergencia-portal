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

    const buckets = ['blog-images', 'branding', 'ambassador-materials', 'partner-logos']
    const results: Record<string, { migrated: number; errors: number }> = {}

    for (const bucket of buckets) {
      results[bucket] = { migrated: 0, errors: 0 }

      // List all files in the Supabase bucket
      const { data: files, error: listError } = await supabase.storage
        .from(bucket)
        .list('', { limit: 1000, sortBy: { column: 'name', order: 'asc' } })

      if (listError) {
        console.error(`Error listing ${bucket}:`, listError)
        continue
      }

      if (!files || files.length === 0) {
        console.log(`Bucket ${bucket}: empty, skipping`)
        continue
      }

      // Process files (including nested folders)
      await processFolder(supabase, aws, r2Config, bucket, '', files, results[bucket])
    }

    // After migration, update URLs in the database
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const urlUpdates = await updateDatabaseUrls(supabase, supabaseUrl, r2Config.publicUrl)

    return new Response(
      JSON.stringify({
        success: true,
        migration: results,
        urlUpdates,
        message: 'Migration completed. Review results above.'
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

async function processFolder(
  supabase: any,
  aws: AwsClient,
  r2Config: any,
  bucket: string,
  prefix: string,
  items: any[],
  stats: { migrated: number; errors: number }
) {
  for (const item of items) {
    const fullPath = prefix ? `${prefix}/${item.name}` : item.name

    // If it's a folder, recurse
    if (item.id === null) {
      const { data: subFiles } = await supabase.storage
        .from(bucket)
        .list(fullPath, { limit: 1000, sortBy: { column: 'name', order: 'asc' } })
      
      if (subFiles?.length) {
        await processFolder(supabase, aws, r2Config, bucket, fullPath, subFiles, stats)
      }
      continue
    }

    try {
      // Download from Supabase
      const { data, error } = await supabase.storage
        .from(bucket)
        .download(fullPath)

      if (error || !data) {
        console.error(`Download error ${bucket}/${fullPath}:`, error)
        stats.errors++
        continue
      }

      // Upload to R2 keeping same structure
      const objectKey = `${bucket}/${fullPath}`
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
        console.log(`✓ ${bucket}/${fullPath}`)
      } else {
        stats.errors++
        console.error(`✗ ${bucket}/${fullPath}: ${response.status}`)
      }
    } catch (err) {
      stats.errors++
      console.error(`Error migrating ${bucket}/${fullPath}:`, err)
    }
  }
}

async function updateDatabaseUrls(supabase: any, supabaseUrl: string, r2PublicUrl: string) {
  const storageBase = `${supabaseUrl}/storage/v1/object/public/`
  const updates: Record<string, number> = {}

  // Tables and columns that contain storage URLs
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
      // Find rows with Supabase storage URLs
      const { data: rows, error } = await supabase
        .from(table)
        .select(`id, ${column}`)
        .like(column, `${storageBase}%`)

      if (error || !rows?.length) continue

      let count = 0
      for (const row of rows) {
        const oldUrl = row[column] as string
        // Extract the bucket/path portion
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

  // Handle gallery_images array in businesses
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
