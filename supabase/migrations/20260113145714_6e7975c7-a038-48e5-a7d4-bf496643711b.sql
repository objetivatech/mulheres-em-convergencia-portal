-- Add 'scheduled' to the post_status enum
ALTER TYPE post_status ADD VALUE IF NOT EXISTS 'scheduled';