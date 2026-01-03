-- Expand allowed event types to include 'encontro_networking'
ALTER TABLE public.events
  DROP CONSTRAINT IF EXISTS events_type_check;

ALTER TABLE public.events
  ADD CONSTRAINT events_type_check
  CHECK (
    type = ANY (
      ARRAY[
        'curso'::text,
        'workshop'::text,
        'palestra'::text,
        'encontro'::text,
        'encontro_networking'::text,
        'mentoria'::text,
        'webinar'::text,
        'conferencia'::text,
        'outro'::text
      ]
    )
  );
