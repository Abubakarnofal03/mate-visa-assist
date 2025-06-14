import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// PDF parsing using browser's native PDF parsing capabilities
async function parsePDFFromBuffer(buffer: Uint8Array): Promise<string> {
  try {
    // Simple text extraction approach - in production you'd use a more robust PDF parser
    const decoder = new TextDecoder('utf-8');
    let text = decoder.decode(buffer);
    
    // Basic PDF text extraction (this is simplified - real PDFs would need proper parsing)
    // For this demo, we'll assume the PDF contains readable text
    text = text.replace(/[^\x20-\x7E\n\r\t]/g, ' ').trim();
    
    if (!text || text.length < 50) {
      throw new Error('Unable to extract text from PDF');
    }
    
    return text;
  } catch (error) {
    console.error('PDF parsing error:', error);
    throw new Error('Failed to parse PDF content');
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const title = formData.get('title') as string;
    const userId = formData.get('userId') as string;

    if (!file || !title || !userId) {
      throw new Error('Missing required fields');
    }

    console.log(`Processing resume: ${title} for user: ${userId}`);

    // Upload file to Supabase storage
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/${Date.now()}.${fileExt}`;
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('resumes')
      .upload(fileName, file);

    if (uploadError) {
      console.error('Upload error:', uploadError);
      throw new Error('Failed to upload file');
    }

    console.log('File uploaded successfully:', uploadData.path);

    // Parse PDF content
    const fileBuffer = await file.arrayBuffer();
    const parsedContent = await parsePDFFromBuffer(new Uint8Array(fileBuffer));

    console.log('PDF parsed, content length:', parsedContent.length);

    // Analyze resume with Gemini API
    const analysisPrompt = `
Analyze this resume and provide:
1. ATS (Applicant Tracking System) optimization suggestions
2. Content improvements
3. Format and structure recommendations
4. Missing sections or skills
5. A rating out of 10 with justification

Please structure your response in HTML format with:
- <h3> tags for main sections
- <p> tags for paragraphs
- <ul> and <li> for lists
- <strong> for emphasis
- Include a clear rating section with score out of 10

Resume content:
${parsedContent}
`;

    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${geminiApiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: analysisPrompt }] }],
          generationConfig: {
            temperature: 0.7,
            topK: 1,
            topP: 1,
            maxOutputTokens: 2048,
          },
        }),
      }
    );

    if (!geminiResponse.ok) {
      console.error('Gemini API error:', await geminiResponse.text());
      throw new Error('Failed to analyze resume');
    }

    const geminiData = await geminiResponse.json();
    let aiSuggestions = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!aiSuggestions) {
      throw new Error('No analysis generated');
    }

    // Clean up any markdown formatting
    aiSuggestions = aiSuggestions
      .replace(/^```html\s*/i, '')
      .replace(/```\s*$/, '')
      .trim();

    // Extract rating from the suggestions
    const ratingMatch = aiSuggestions.match(/(\d+)(?:\/10|out of 10)/i);
    const aiRating = ratingMatch ? parseInt(ratingMatch[1]) : null;

    console.log('AI analysis completed, rating:', aiRating);

    // Save to database
    const { data: resumeData, error: dbError } = await supabase
      .from('resumes')
      .insert({
        user_id: userId,
        title,
        file_url: uploadData.path,
        parsed_content: parsedContent,
        ai_suggestions: aiSuggestions,
        ai_rating: aiRating,
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      throw new Error('Failed to save resume data');
    }

    console.log('Resume saved successfully:', resumeData.id);

    return new Response(
      JSON.stringify({
        success: true,
        resume: resumeData,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in parse-resume function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});