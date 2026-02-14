
-- Revert business logo URLs from R2 back to Supabase Storage
UPDATE businesses 
SET logo_url = REPLACE(logo_url, 'https://storage.mulheresemconvergencia.com.br/', 'https://ngqymbjatenxztrjjdxa.supabase.co/storage/v1/object/public/')
WHERE logo_url LIKE '%storage.mulheresemconvergencia.com.br%';

-- Revert business cover URLs from R2 back to Supabase Storage
UPDATE businesses 
SET cover_image_url = REPLACE(cover_image_url, 'https://storage.mulheresemconvergencia.com.br/', 'https://ngqymbjatenxztrjjdxa.supabase.co/storage/v1/object/public/')
WHERE cover_image_url LIKE '%storage.mulheresemconvergencia.com.br%';

-- Revert gallery_images array URLs
UPDATE businesses
SET gallery_images = (
  SELECT array_agg(
    REPLACE(url, 'https://storage.mulheresemconvergencia.com.br/', 'https://ngqymbjatenxztrjjdxa.supabase.co/storage/v1/object/public/')
  )
  FROM unnest(gallery_images) AS url
)
WHERE gallery_images IS NOT NULL
AND EXISTS (
  SELECT 1 FROM unnest(gallery_images) AS url 
  WHERE url LIKE '%storage.mulheresemconvergencia.com.br%'
);
