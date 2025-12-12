-- Add timeframes column to rooms table (array of text, default 5 timeframes)
ALTER TABLE public.rooms 
ADD COLUMN timeframes text[] NOT NULL DEFAULT ARRAY['1D', '4H', '1H', '15M', '5M']::text[];

-- Add check constraint for max 7 timeframes
ALTER TABLE public.rooms 
ADD CONSTRAINT rooms_max_timeframes CHECK (array_length(timeframes, 1) <= 7);