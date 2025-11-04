-- Create bug_reports table
CREATE TABLE public.bug_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open',
  priority TEXT NOT NULL DEFAULT 'medium',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.bug_reports ENABLE ROW LEVEL SECURITY;

-- Users can insert their own bug reports
CREATE POLICY "Users can insert their own bug reports"
ON public.bug_reports
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can view their own bug reports
CREATE POLICY "Users can view their own bug reports"
ON public.bug_reports
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Users can update their own bug reports
CREATE POLICY "Users can update their own bug reports"
ON public.bug_reports
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_bug_reports_updated_at
BEFORE UPDATE ON public.bug_reports
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();