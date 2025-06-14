import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const geminiApiKey = "AIzaSyD08db9gKCjzHM6gvAi1a5b22Ant_9MPqE";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
  const { documentType, prompt, country, university } = await req.json();

    console.log('Generating document with Gemini API:', { documentType, country, university });

    // Generate a structured prompt with HTML formatting instructions
    const generatePrompt = (documentType: string, country: string, university: string) => {
      if (documentType === 'sop') {
        return `Generate a comprehensive Statement of Purpose (SOP) for studying in ${university}, ${country}. 

Structure the response with proper formatting using HTML tags:
- Use <h2> for main section headings
- Use <h3> for subsection headings  
- Use <p> for paragraphs
- Use <strong> for emphasis/bold text
- Use <ul> and <li> for bullet points where appropriate

Include these sections:
1. **Introduction** - Personal background and motivation
2. **Academic Background** - Educational qualifications and achievements
3. **Professional Experience** - Work experience and skills (if applicable)
4. **Why This University** - Specific reasons for choosing ${university}
5. **Why ${country}** - Reasons for choosing ${country} for studies
6. **Career Goals** - Short-term and long-term career objectives
7. **Conclusion** - Summary and commitment statement

Make it professional, personalized, and compelling. Length should be 800-1000 words.
Return ONLY the formatted HTML content without any markdown backticks or additional text.`;
      } else if (documentType === 'cover_letter') {
        return `Generate a professional Cover Letter for a job application or university application in ${country}. 

Structure the response with proper formatting using HTML tags:
- Use <h2> for the main heading "Cover Letter"
- Use <p> for paragraphs
- Use <strong> for emphasis/bold text
- Use proper spacing between sections

Include these sections:
1. **Header** - Date and recipient information
2. **Opening** - Professional greeting and purpose
3. **Body Paragraphs** - 
   - Your background and qualifications
   - Why you're interested in the opportunity
   - What you can contribute
4. **Closing** - Professional closing and call to action
5. **Signature** - Professional sign-off

Make it professional and compelling. Length should be 300-500 words.
Return ONLY the formatted HTML content without any markdown backticks or additional text.`;
      } else {
        return `Generate a professional ${documentType} document for ${university}, ${country}. 
      
Use proper HTML formatting with headings, paragraphs, and emphasis where appropriate.
Make it professional and well-structured.
Return ONLY the formatted HTML content without any markdown backticks or additional text.`;
      }
    };

    const fullPrompt = `${generatePrompt(documentType, country || 'Not specified', university || 'Not specified')}

Additional information provided by the user:
${prompt}

Important: Format the entire response as valid HTML that can be directly embedded in a webpage. Do not include any markdown formatting, only HTML.`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${geminiApiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
          parts: [
              {
                text: fullPrompt
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          topK: 1,
          topP: 1,
          maxOutputTokens: 2048,
        },
        safetySettings: [
          {
            category: "HARM_CATEGORY_HARASSMENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_HATE_SPEECH",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_DANGEROUS_CONTENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          }
        ]
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Gemini API error:', errorData);
      throw new Error(`Gemini API error: ${response.status} - ${errorData}`);
    }

    const data = await response.json();
    console.log('Gemini API response received');
    
    let generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!generatedText) {
      throw new Error('No content generated by Gemini API');
    }

    // Clean up any markdown formatting
    generatedText = generatedText
      .replace(/^```html\s*/i, '')
      .replace(/```\s*$/, '')
      .trim();

    return new Response(JSON.stringify({ generatedText }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in generate-with-gemini function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
