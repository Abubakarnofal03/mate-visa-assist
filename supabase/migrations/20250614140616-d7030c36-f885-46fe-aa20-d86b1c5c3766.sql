-- Create storage policies for resumes bucket if they don't exist
DO $$
BEGIN
    -- Check if policies exist before creating them
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'objects' 
        AND schemaname = 'storage' 
        AND policyname = 'Users can upload their own resumes'
    ) THEN
        CREATE POLICY "Users can upload their own resumes" 
        ON storage.objects 
        FOR INSERT 
        WITH CHECK (bucket_id = 'resumes' AND auth.uid()::text = (storage.foldername(name))[1]);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'objects' 
        AND schemaname = 'storage' 
        AND policyname = 'Users can view their own resume files'
    ) THEN
        CREATE POLICY "Users can view their own resume files" 
        ON storage.objects 
        FOR SELECT 
        USING (bucket_id = 'resumes' AND auth.uid()::text = (storage.foldername(name))[1]);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'objects' 
        AND schemaname = 'storage' 
        AND policyname = 'Users can update their own resume files'
    ) THEN
        CREATE POLICY "Users can update their own resume files" 
        ON storage.objects 
        FOR UPDATE 
        USING (bucket_id = 'resumes' AND auth.uid()::text = (storage.foldername(name))[1]);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'objects' 
        AND schemaname = 'storage' 
        AND policyname = 'Users can delete their own resume files'
    ) THEN
        CREATE POLICY "Users can delete their own resume files" 
        ON storage.objects 
        FOR DELETE 
        USING (bucket_id = 'resumes' AND auth.uid()::text = (storage.foldername(name))[1]);
    END IF;
END
$$;