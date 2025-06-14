-- Add additional visa progress fields for study abroad
ALTER TABLE public.visa_progress 
ADD COLUMN passport_ready BOOLEAN DEFAULT false,
ADD COLUMN photos_submitted BOOLEAN DEFAULT false,
ADD COLUMN degree_transcript_verified BOOLEAN DEFAULT false,
ADD COLUMN police_clearance_obtained BOOLEAN DEFAULT false,
ADD COLUMN sop_completed BOOLEAN DEFAULT false,
ADD COLUMN visa_interview_scheduled BOOLEAN DEFAULT false;

-- Create function to automatically update visa progress based on document uploads
CREATE OR REPLACE FUNCTION public.update_visa_progress_on_document_upload()
RETURNS TRIGGER AS $$
BEGIN
  -- Map document types to visa progress fields
  IF NEW.document_type = 'IELTS Certificate' AND NEW.is_completed = true THEN
    UPDATE public.visa_progress 
    SET ielts_submitted = true 
    WHERE user_id = NEW.user_id;
  END IF;
  
  IF NEW.document_type = 'University Offer Letter' AND NEW.is_completed = true THEN
    UPDATE public.visa_progress 
    SET university_offer_letter = true 
    WHERE user_id = NEW.user_id;
  END IF;
  
  IF NEW.document_type = 'Financial Statement' AND NEW.is_completed = true THEN
    UPDATE public.visa_progress 
    SET financial_documents_ready = true 
    WHERE user_id = NEW.user_id;
  END IF;
  
  IF NEW.document_type = 'Medical Certificate' AND NEW.is_completed = true THEN
    UPDATE public.visa_progress 
    SET medical_check_done = true 
    WHERE user_id = NEW.user_id;
  END IF;
  
  IF NEW.document_type = 'Passport' AND NEW.is_completed = true THEN
    UPDATE public.visa_progress 
    SET passport_ready = true 
    WHERE user_id = NEW.user_id;
  END IF;
  
  IF NEW.document_type = 'Photos' AND NEW.is_completed = true THEN
    UPDATE public.visa_progress 
    SET photos_submitted = true 
    WHERE user_id = NEW.user_id;
  END IF;
  
  IF (NEW.document_type = 'Degree Certificate' OR NEW.document_type = 'Transcript') AND NEW.is_completed = true THEN
    UPDATE public.visa_progress 
    SET degree_transcript_verified = true 
    WHERE user_id = NEW.user_id;
  END IF;
  
  IF NEW.document_type = 'Police Clearance' AND NEW.is_completed = true THEN
    UPDATE public.visa_progress 
    SET police_clearance_obtained = true 
    WHERE user_id = NEW.user_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update visa progress when documents are updated
CREATE TRIGGER update_visa_progress_on_document_change
  AFTER UPDATE ON public.documents
  FOR EACH ROW
  EXECUTE FUNCTION public.update_visa_progress_on_document_upload();

-- Also create trigger for inserts (when document is first uploaded as completed)
CREATE TRIGGER update_visa_progress_on_document_insert
  AFTER INSERT ON public.documents
  FOR EACH ROW
  EXECUTE FUNCTION public.update_visa_progress_on_document_upload();