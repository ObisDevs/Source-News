-- User Usage Tracking Migration
-- This enables proper analytics tracking for searches, AI chats, and bookmarks

-- Update user_usage table to include bookmarks
ALTER TABLE public.user_usage 
ADD COLUMN IF NOT EXISTS bookmarks_added INTEGER DEFAULT 0;

-- Create or replace the increment function
CREATE OR REPLACE FUNCTION increment_user_usage(
  p_user_id UUID,
  p_date DATE,
  p_field TEXT
)
RETURNS VOID AS $$
BEGIN
  -- Insert or update the user usage record
  INSERT INTO public.user_usage (user_id, date, ai_explanations_used, bias_checks_used, searches_performed, bookmarks_added)
  VALUES (
    p_user_id,
    p_date,
    CASE WHEN p_field = 'ai_explanations_used' THEN 1 ELSE 0 END,
    CASE WHEN p_field = 'bias_checks_used' THEN 1 ELSE 0 END,
    CASE WHEN p_field = 'searches_performed' THEN 1 ELSE 0 END,
    CASE WHEN p_field = 'bookmarks_added' THEN 1 ELSE 0 END
  )
  ON CONFLICT (user_id, date)
  DO UPDATE SET
    ai_explanations_used = CASE 
      WHEN p_field = 'ai_explanations_used' THEN public.user_usage.ai_explanations_used + 1
      ELSE public.user_usage.ai_explanations_used
    END,
    bias_checks_used = CASE 
      WHEN p_field = 'bias_checks_used' THEN public.user_usage.bias_checks_used + 1
      ELSE public.user_usage.bias_checks_used
    END,
    searches_performed = CASE 
      WHEN p_field = 'searches_performed' THEN public.user_usage.searches_performed + 1
      ELSE public.user_usage.searches_performed
    END,
    bookmarks_added = CASE 
      WHEN p_field = 'bookmarks_added' THEN public.user_usage.bookmarks_added + 1
      ELSE public.user_usage.bookmarks_added
    END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add unique constraint if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'user_usage_user_id_date_key'
  ) THEN
    ALTER TABLE public.user_usage 
    ADD CONSTRAINT user_usage_user_id_date_key UNIQUE (user_id, date);
  END IF;
END $$;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_usage_user_date ON public.user_usage(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_user_usage_date ON public.user_usage(date DESC);

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION increment_user_usage TO authenticated;
GRANT EXECUTE ON FUNCTION increment_user_usage TO anon;
