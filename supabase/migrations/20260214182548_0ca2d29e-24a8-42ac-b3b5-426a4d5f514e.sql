
-- Update business logo URLs to R2
UPDATE businesses 
SET logo_url = REPLACE(logo_url, 'https://ngqymbjatenxztrjjdxa.supabase.co/storage/v1/object/public/', 'https://storage.mulheresemconvergencia.com.br/')
WHERE logo_url LIKE '%ngqymbjatenxztrjjdxa.supabase.co/storage%';

-- Update business cover URLs to R2
UPDATE businesses 
SET cover_image_url = REPLACE(cover_image_url, 'https://ngqymbjatenxztrjjdxa.supabase.co/storage/v1/object/public/', 'https://storage.mulheresemconvergencia.com.br/')
WHERE cover_image_url LIKE '%ngqymbjatenxztrjjdxa.supabase.co/storage%';

-- Update gallery_images array URLs to R2
UPDATE businesses
SET gallery_images = (
  SELECT array_agg(
    REPLACE(url, 'https://ngqymbjatenxztrjjdxa.supabase.co/storage/v1/object/public/', 'https://storage.mulheresemconvergencia.com.br/')
  )
  FROM unnest(gallery_images) AS url
)
WHERE gallery_images IS NOT NULL
AND EXISTS (
  SELECT 1 FROM unnest(gallery_images) AS url 
  WHERE url LIKE '%ngqymbjatenxztrjjdxa.supabase.co/storage%'
);
