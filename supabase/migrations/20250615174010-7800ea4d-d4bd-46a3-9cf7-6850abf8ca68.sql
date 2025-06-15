-- Add residence_country column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN residence_country text;

-- Update existing profiles to have null residence_country initially
-- This will require users to update their profile