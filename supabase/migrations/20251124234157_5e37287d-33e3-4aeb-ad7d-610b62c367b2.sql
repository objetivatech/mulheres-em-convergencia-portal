-- Corrigir search_path nas funções de sincronização de categorias

CREATE OR REPLACE FUNCTION sync_business_category_id()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  category_mapping jsonb;
BEGIN
  -- Mapeamento de enum -> UUID das categorias
  category_mapping := '{
    "alimentacao": "d4eafad9-e7ab-47d0-9907-1706fca3d1cd",
    "artesanato": "4dbd2e41-5675-494c-a6f6-7d8af239c69d",
    "beleza": "18aff80b-22fa-40b4-83f4-baaf8c5f88d5",
    "casa_decoracao": "8a5f12f8-19f2-4b1c-97b3-7c5b01e391ef",
    "consultoria": "5722236a-2e3e-4526-8d54-e7a1fc1acb1a",
    "educacao": "2cf97144-9587-448a-ba68-c9830be741b0",
    "eventos": "cc8fd410-f109-4295-9f1f-f22f2537328a",
    "marketing": "06617282-0d03-46c4-a639-375999a8525c",
    "moda": "3b1bb611-ab03-49c0-87a8-1af70c9519fb",
    "saude": "a7f948d9-884e-418e-b2c8-fd7c8bcf603f",
    "servicos": "7dac08f3-7c13-48f7-acbd-006e5e367d99",
    "tecnologia": "c00c2fa9-3e7e-4428-ad2e-eb48a7259d73"
  }'::jsonb;

  -- Atualizar todos os negócios que tem category mas não tem category_id
  UPDATE businesses
  SET category_id = (category_mapping->>category::text)::uuid
  WHERE category IS NOT NULL 
    AND category_id IS NULL
    AND category_mapping ? category::text;

  RAISE NOTICE 'Sincronização concluída. % registros atualizados.', 
    (SELECT COUNT(*) FROM businesses WHERE category IS NOT NULL AND category_id IS NOT NULL);
END;
$$;

CREATE OR REPLACE FUNCTION auto_sync_category_id()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  category_mapping jsonb;
BEGIN
  category_mapping := '{
    "alimentacao": "d4eafad9-e7ab-47d0-9907-1706fca3d1cd",
    "artesanato": "4dbd2e41-5675-494c-a6f6-7d8af239c69d",
    "beleza": "18aff80b-22fa-40b4-83f4-baaf8c5f88d5",
    "casa_decoracao": "8a5f12f8-19f2-4b1c-97b3-7c5b01e391ef",
    "consultoria": "5722236a-2e3e-4526-8d54-e7a1fc1acb1a",
    "educacao": "2cf97144-9587-448a-ba68-c9830be741b0",
    "eventos": "cc8fd410-f109-4295-9f1f-f22f2537328a",
    "marketing": "06617282-0d03-46c4-a639-375999a8525c",
    "moda": "3b1bb611-ab03-49c0-87a8-1af70c9519fb",
    "saude": "a7f948d9-884e-418e-b2c8-fd7c8bcf603f",
    "servicos": "7dac08f3-7c13-48f7-acbd-006e5e367d99",
    "tecnologia": "c00c2fa9-3e7e-4428-ad2e-eb48a7259d73"
  }'::jsonb;

  -- Se category foi definida e category_id está vazio, sincronizar
  IF NEW.category IS NOT NULL AND NEW.category_id IS NULL THEN
    IF category_mapping ? NEW.category::text THEN
      NEW.category_id := (category_mapping->>NEW.category::text)::uuid;
    END IF;
  END IF;

  -- Se category_id foi definida, sincronizar a category enum de volta (para compatibilidade)
  IF NEW.category_id IS NOT NULL AND NEW.category IS NULL THEN
    NEW.category := (
      SELECT CASE 
        WHEN NEW.category_id = 'd4eafad9-e7ab-47d0-9907-1706fca3d1cd'::uuid THEN 'alimentacao'
        WHEN NEW.category_id = '4dbd2e41-5675-494c-a6f6-7d8af239c69d'::uuid THEN 'artesanato'
        WHEN NEW.category_id = '18aff80b-22fa-40b4-83f4-baaf8c5f88d5'::uuid THEN 'beleza'
        WHEN NEW.category_id = '8a5f12f8-19f2-4b1c-97b3-7c5b01e391ef'::uuid THEN 'casa_decoracao'
        WHEN NEW.category_id = '5722236a-2e3e-4526-8d54-e7a1fc1acb1a'::uuid THEN 'consultoria'
        WHEN NEW.category_id = '2cf97144-9587-448a-ba68-c9830be741b0'::uuid THEN 'educacao'
        WHEN NEW.category_id = 'cc8fd410-f109-4295-9f1f-f22f2537328a'::uuid THEN 'eventos'
        WHEN NEW.category_id = '06617282-0d03-46c4-a639-375999a8525c'::uuid THEN 'marketing'
        WHEN NEW.category_id = '3b1bb611-ab03-49c0-87a8-1af70c9519fb'::uuid THEN 'moda'
        WHEN NEW.category_id = 'a7f948d9-884e-418e-b2c8-fd7c8bcf603f'::uuid THEN 'saude'
        WHEN NEW.category_id = '7dac08f3-7c13-48f7-acbd-006e5e367d99'::uuid THEN 'servicos'
        WHEN NEW.category_id = 'c00c2fa9-3e7e-4428-ad2e-eb48a7259d73'::uuid THEN 'tecnologia'
        ELSE NULL
      END::business_category
    );
  END IF;

  RETURN NEW;
END;
$$;
