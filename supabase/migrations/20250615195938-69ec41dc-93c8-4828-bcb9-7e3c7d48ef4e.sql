
-- Create a function to safely find users by email
CREATE OR REPLACE FUNCTION public.find_user_by_email(p_email text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_record RECORD;
BEGIN
    -- Query the auth.users table to find user by email
    SELECT id INTO user_record 
    FROM auth.users 
    WHERE email = p_email 
    AND email_confirmed_at IS NOT NULL;
    
    -- Return the user_id if found, NULL if not found
    RETURN user_record.id;
EXCEPTION
    WHEN OTHERS THEN
        -- Return NULL if any error occurs
        RETURN NULL;
END;
$$;
