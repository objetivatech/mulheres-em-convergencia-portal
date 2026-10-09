import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { AwsClient } from "https://esm.sh/aws4fetch@1.0.20"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.55.0"
import { getAuthenticatedUserId } from "../_shared/auth.ts"

type Perfil = { uid: string; admin: boolean; editora: boolean }

/** Descobre quem está chamando e o nível de acesso (validado no servidor). */
async function perfilDe(uid: string): Promise<Perfil> {
  const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } })
  const { data: pessoa } = await db.from('pessoas').select('id').eq('auth_user_id', uid).maybeSingle()
  if (!pessoa?.id) return { uid, admin: false, editora: false }
  const { data: papeis } = await db.from('papeis').select('papel').eq('pessoa_id', pessoa.id)
  const lista = (papeis ?? []).map((p: any) => p.papel)
  return { uid, admin: lista.includes('admin'), editora: lista.includes('editora') }
}

const PASTA_USUARIAS = 'usuarias'
const CATEGORIAS_USUARIA = ['perfil', 'negocio', 'galeria', 'produtos', 'conecta', 'geral']

/** Associadas sempre gravam na própria pasta: usuarias/<id>/<categoria>/ */
function pastaPermitida(p: Perfil, pedida: string): string {
  const limpa = (pedida || 'uploads').replace(/\.\./g, '').replace(/^\/+|\/+$/g, '')
  if (p.admin) return limpa
  const proprio = `${PASTA_USUARIAS}/${p.uid}`
  if (limpa.startsWith(proprio + '/') || limpa === proprio) return limpa
  if (p.editora && !limpa.startsWith(PASTA_USUARIAS)) return limpa
  const apelidos: Record<string, string> = { perfis: 'perfil', negocios: 'negocio', 'negocios-galeria': 'galeria', 'negocios-produtos': 'produtos' }
  const base = apelidos[limpa] ?? limpa
  const cat = CATEGORIAS_USUARIA.includes(base) ? base : 'geral'
  return `${proprio}/${cat}`
}

function podeMexer(p: Perfil, key: string): boolean {
  if (p.admin) return true
  if (key.startsWith(`${PASTA_USUARIAS}/${p.uid}/`)) return true
  return false
}

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
  'academy-materials': {
    maxSizeMB: 200,
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

function sanitizeFileName(name: string): string {
  const ext = name.split('.').pop()?.toLowerCase() || 'bin'
  return `${Date.now()}-${Math.random().toString(36).substring(2)}.${ext}`
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const uid = await getAuthenticatedUserId(req)
    if (!uid) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    const perfil = await perfilDe(uid)
    const negar = (msg: string) => new Response(JSON.stringify({ error: msg }), {
      status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

    const config = getR2Config()
    const aws = new AwsClient({
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
      service: 's3',
      region: 'auto',
    })

    const url = new URL(req.url)
    let action = url.searchParams.get('action')

    const contentType = req.headers.get('content-type') || ''

    // ─── UPLOAD (multipart/form-data) — small files only ───
    if (contentType.includes('multipart/form-data') || contentType.includes('form-data')) {
      const formData = await req.formData()
      action = (formData.get('action') as string) || action || 'upload'

      if (action === 'upload') {
        const file = formData.get('file') as File
        const folder = pastaPermitida(perfil, (formData.get('folder') as string) || 'uploads')

        if (!file) {
          return new Response(
            JSON.stringify({ error: 'No file provided' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        const rules = FOLDER_RULES[folder.split('/').pop()!] || FOLDER_RULES[folder] || DEFAULT_RULES
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

        // Hard cap to protect edge function CPU/memory: anything > 20MB must use presign flow
        if (fileSizeMB > 20) {
          return new Response(
            JSON.stringify({ error: `File too large for direct upload (${fileSizeMB.toFixed(1)}MB). Use presigned upload for files over 20MB.` }),
            { status: 413, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        const objectKey = `${folder}/${sanitizeFileName(file.name)}`
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

    // ─── JSON body (presign / delete) ───
    if (contentType.includes('application/json')) {
      const body = await req.json()
      action = body.action || action

      // ─── PRESIGN (large file uploads — browser PUTs directly to R2) ───
      if (action === 'presign') {
        const folder: string = pastaPermitida(perfil, body.folder || 'uploads')
        const fileName: string = body.fileName || ''
        const fileType: string = body.fileType || 'application/octet-stream'
        const fileSize: number = Number(body.fileSize) || 0

        if (!fileName) {
          return new Response(
            JSON.stringify({ error: 'fileName is required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        const rules = FOLDER_RULES[folder.split('/').pop()!] || FOLDER_RULES[folder] || DEFAULT_RULES
        const fileSizeMB = fileSize / (1024 * 1024)
        if (fileSize > 0 && fileSizeMB > rules.maxSizeMB) {
          return new Response(
            JSON.stringify({ error: `Arquivo muito grande. Máximo ${rules.maxSizeMB}MB para a pasta "${folder}", recebido ${fileSizeMB.toFixed(1)}MB` }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
        if (rules.allowedMimeTypes.length > 0 && !rules.allowedMimeTypes.includes(fileType)) {
          return new Response(
            JSON.stringify({ error: `Tipo de arquivo "${fileType}" não permitido para a pasta "${folder}". Permitidos: ${rules.allowedMimeTypes.join(', ')}` }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        const objectKey = `${folder}/${sanitizeFileName(fileName)}`
        const r2Url = `${config.endpoint}/${config.bucketName}/${objectKey}`

        // Sign a PUT URL valid for 10 minutes
        const signed = await aws.sign(
          new Request(`${r2Url}?X-Amz-Expires=600`, {
            method: 'PUT',
            headers: { 'Content-Type': fileType },
          }),
          { aws: { signQuery: true } }
        )

        const publicFileUrl = `${config.publicUrl}/${objectKey}`
        return new Response(
          JSON.stringify({
            success: true,
            uploadUrl: signed.url,
            publicUrl: publicFileUrl,
            key: objectKey,
            requiredHeaders: { 'Content-Type': fileType },
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      if (action === 'delete') {
        const objectKey = body.key
        if (!objectKey) {
          return new Response(
            JSON.stringify({ error: 'No key provided' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
        if (!podeMexer(perfil, objectKey)) return negar('Você só pode apagar as suas próprias imagens.')

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
      const pedido = url.searchParams.get('prefix') || ''
      // Admin vê tudo; editora vê o acervo da equipe (sem as pastas das associadas);
      // associada vê apenas a própria pasta.
      const proprio = `${PASTA_USUARIAS}/${perfil.uid}/`
      let prefix = pedido
      if (!perfil.admin && !perfil.editora) prefix = proprio
      else if (!perfil.admin && pedido.startsWith(PASTA_USUARIAS) && !pedido.startsWith(proprio)) prefix = proprio
      const files: { key: string; url: string; modificado: string | null; tamanho: number }[] = []
      let token: string | null = null
      for (let pagina = 0; pagina < 20; pagina++) {
        const r2Url = `${config.endpoint}/${config.bucketName}?list-type=2&max-keys=1000&prefix=${encodeURIComponent(prefix)}` +
          (token ? `&continuation-token=${encodeURIComponent(token)}` : '')
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
        const blocoRegex = /<Contents>([\s\S]*?)<\/Contents>/g
        let b
        while ((b = blocoRegex.exec(xmlText)) !== null) {
          const bloco = b[1]
          const key = (bloco.match(/<Key>(.*?)<\/Key>/) || [])[1]
          if (!key) continue
          if (!perfil.admin && perfil.editora && key.startsWith(PASTA_USUARIAS + '/') && !key.startsWith(proprio)) continue
          files.push({
            key,
            url: `${config.publicUrl}/${key}`,
            modificado: (bloco.match(/<LastModified>(.*?)<\/LastModified>/) || [])[1] ?? null,
            tamanho: Number((bloco.match(/<Size>(.*?)<\/Size>/) || [])[1] ?? 0),
          })
        }
        const truncado = /<IsTruncated>true<\/IsTruncated>/.test(xmlText)
        token = (xmlText.match(/<NextContinuationToken>(.*?)<\/NextContinuationToken>/) || [])[1] ?? null
        if (!truncado || !token) break
      }

      return new Response(
        JSON.stringify({ success: true, files }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action. Send action via form-data or JSON body (upload/presign/delete) or query param (list)' }),
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
