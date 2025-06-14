-- Update the trigger function to handle more document types and SOP completion
CREATE OR REPLACE FUNCTION public.update_visa_progress_on_document_upload()
RETURNS TRIGGER AS $$
BEGIN
  -- Map document types to visa progress fields
  IF (NEW.document_type = 'IELTS Certificate' OR NEW.document_type = 'TOEFL Certificate') AND NEW.is_completed = true THEN
    UPDATE public.visa_progress 
    SET ielts_submitted = true 
    WHERE user_id = NEW.user_id;
  END IF;
  
  IF NEW.document_type = 'University Offer Letter' AND NEW.is_completed = true THEN
    UPDATE public.visa_progress 
    SET university_offer_letter = true 
    WHERE user_id = NEW.user_id;
  END IF;
  
  IF (NEW.document_type = 'Financial Statement' OR NEW.document_type = 'Bank Statement' OR NEW.document_type = 'Sponsorship Letter') AND NEW.is_completed = true THEN
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
  
  IF NEW.document_type = 'Statement of Purpose' AND NEW.is_completed = true THEN
    UPDATE public.visa_progress 
    SET sop_completed = true 
    WHERE user_id = NEW.user_id;
  END IF;
  
  IF NEW.document_type = 'Visa Application Form' AND NEW.is_completed = true THEN
    UPDATE public.visa_progress 
    SET visa_form_filled = true 
    WHERE user_id = NEW.user_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Also create a function to update visa progress when SOP documents are created
CREATE OR REPLACE FUNCTION public.update_visa_progress_on_sop_creation()
RETURNS TRIGGER AS $$
BEGIN
  -- Mark SOP as completed when any SOP document is created
  UPDATE public.visa_progress 
  SET sop_completed = true 
  WHERE user_id = NEW.user_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for SOP document creation
CREATE TRIGGER update_visa_progress_on_sop_insert
  AFTER INSERT ON public.sop_documents
  FOR EACH ROW
  EXECUTE FUNCTION public.update_visa_progress_on_sop_creation();