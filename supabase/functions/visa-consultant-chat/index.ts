import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const groqApiKey = "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";
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { message, conversationId, userId } = await req.json();

    console.log('Chat request received:', { message, conversationId, userId });

    if (!message || !userId) {
      throw new Error('Missing required fields: message and userId');
    }

    // Get user context from database
    const [visaProgressResult, documentsResult, profileResult, sopResult] = await Promise.all([
      supabase.from('visa_progress').select('*').eq('user_id', userId).single(),
      supabase.from('documents').select('*').eq('user_id', userId),
      supabase.from('profiles').select('*').eq('user_id', userId).single(),
      supabase.from('sop_documents').select('*').eq('user_id', userId)
    ]);

    const visaProgress = visaProgressResult.data;
    const documents = documentsResult.data || [];
    const profile = profileResult.data;
    const sopDocuments = sopResult.data || [];

    // Build context for AI
    const contextData = {
      visaProgress,
      documents: documents.map(doc => ({ type: doc.document_type, completed: doc.is_completed })),
      profile: profile ? { 
        name: profile.full_name,
        residenceCountry: profile.residence_country 
      } : null,
      sopDocuments: sopDocuments.map(sop => ({
        type: sop.document_type,
        country: sop.country,
        university: sop.university,
        promptInput: sop.prompt_input?.substring(0, 200) // First 200 chars for context
      }))
    };

    // Calculate progress stats
    const progressStats = visaProgress ? {
      ielts: visaProgress.ielts_submitted,
      university: visaProgress.university_offer_letter,
      financial: visaProgress.financial_documents_ready,
      medical: visaProgress.medical_check_done,
      passport: visaProgress.passport_ready,
      photos: visaProgress.photos_submitted,
      degree: visaProgress.degree_transcript_verified,
      police: visaProgress.police_clearance_obtained,
      sop: visaProgress.sop_completed,
      visaForm: visaProgress.visa_form_filled,
      interview: visaProgress.visa_interview_scheduled
    } : {};

    const completedSteps = Object.values(progressStats).filter(Boolean).length;
    const totalSteps = 11;
    const progressPercentage = Math.round((completedSteps / totalSteps) * 100);

    // Create AI prompt with context
    const sopInfo = sopDocuments.length > 0 
      ? sopDocuments.map(sop => `${sop.type} for ${sop.country}${sop.university ? ` - ${sop.university}` : ''}`).join(', ')
      : 'None created yet';

    const consultantPrompt = `You are an expert visa consultant AI assistant specializing in helping students with visa applications for studying abroad. You have deep knowledge about visa processes for major study destinations including Canada, Australia, UK, US, and other countries.

CURRENT USER CONTEXT:
- User: ${profile?.full_name || 'Student'}
- Residence Country: ${profile?.residence_country || 'Not specified'}
- Visa Progress: ${progressPercentage}% complete (${completedSteps}/${totalSteps} steps)
- Completed Steps: ${Object.entries(progressStats).filter(([_, completed]) => completed).map(([step, _]) => step).join(', ') || 'None'}
- Pending Steps: ${Object.entries(progressStats).filter(([_, completed]) => !completed).map(([step, _]) => step).join(', ') || 'All complete'}
- Uploaded Documents: ${documents.filter(doc => doc.is_completed).map(doc => doc.document_type).join(', ') || 'None'}
- SOPs Created: ${sopInfo}
${sopDocuments.length > 0 ? `- Application Details: ${sopDocuments.map(sop => `Applying to ${sop.country}${sop.university ? ` (${sop.university})` : ''}`).join(', ')}` : ''}

GUIDELINES:
1. Provide specific, actionable advice based on the user's current progress and residence country
2. Reference their completed and pending steps when relevant
3. Offer step-by-step guidance for visa application processes
4. Include country-specific requirements based on their residence country and destination
5. Suggest next immediate actions based on their current status
6. Provide document checklists and timeline estimates when appropriate
7. Be encouraging and supportive while being accurate and professional
8. If asked about specific documents, explain requirements and formats
9. Address common visa application concerns and troubleshooting
10. Consider embassy/consulate locations and procedures specific to their residence country
11. Format your response with proper markdown: use **bold** for headings, bullet points for lists
12. Structure your response with clear sections using ### for headings

KNOWLEDGE BASE:
- IELTS/TOEFL requirements and score guidelines
- University application and offer letter processes
- Financial documentation requirements (bank statements, sponsorship letters)
- Medical examination procedures and approved panel physicians
- Police clearance certificate processes by country
- Statement of Purpose writing guidelines
- Visa application form completion tips
- Interview preparation (for countries that require interviews)
- Document authentication and apostille processes
- Timeline planning and deadline management

User Question: ${message}

Provide helpful, specific advice as a professional visa consultant. Reference their current progress when relevant and suggest concrete next steps.`;

    // Call Groq API
    console.log('Calling Groq API for visa consultation...');
    const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${groqApiKey}`,
      },
      body: JSON.stringify({
        model: "llama3-8b-8192",
        messages: [
          {
            role: "user",
            content: consultantPrompt
          }
        ],
        temperature: 0.7,
        max_tokens: 1024,
      }),
    });

    let aiResponse = '';

    if (!groqResponse.ok) {
      const errorText = await groqResponse.text();
      console.error('Groq API error:', {
        status: groqResponse.status,
        statusText: groqResponse.statusText,
        errorText
      });
      
      aiResponse = `I apologize, but I'm temporarily unable to provide detailed consultation. However, based on your current progress (${progressPercentage}% complete), here are some general next steps:

${completedSteps < totalSteps ? `
Pending items to focus on:
${Object.entries(progressStats).filter(([_, completed]) => !completed).map(([step, _]) => `• ${step.replace(/([A-Z])/g, ' $1').toLowerCase()}`).slice(0, 3).join('\n')}

Please try your question again in a moment, or feel free to ask about specific visa requirements.` : 'Congratulations! You have completed all major visa application steps. Consider reviewing all documents and preparing for any potential visa interview.'}`;
    } else {
      console.log('Groq API call successful');
      const groqData = await groqResponse.json();
      aiResponse = groqData.choices?.[0]?.message?.content || 'I apologize, but I was unable to generate a response. Please try again.';
    }

    // Create or get conversation
    let activeConversationId = conversationId;
    
    if (!conversationId) {
      const conversationTitle = message.length > 50 ? message.substring(0, 47) + '...' : message;
      const { data: newConversation, error: convError } = await supabase
        .from('chat_conversations')
        .insert({
          user_id: userId,
          title: conversationTitle
        })
        .select()
        .single();

      if (convError) {
        console.error('Error creating conversation:', convError);
        throw new Error('Failed to create conversation');
      }

      activeConversationId = newConversation.id;
    }

    // Save message and response
    const { error: messageError } = await supabase
      .from('chat_messages')
      .insert({
        conversation_id: activeConversationId,
        user_id: userId,
        message,
        response: aiResponse,
        context_data: contextData
      });

    if (messageError) {
      console.error('Error saving message:', messageError);
      throw new Error('Failed to save message');
    }

    // Update conversation timestamp
    await supabase
      .from('chat_conversations')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', activeConversationId);

    return new Response(
      JSON.stringify({
        success: true,
        response: aiResponse,
        conversationId: activeConversationId,
        contextUsed: {
          progressPercentage,
          completedSteps,
          totalSteps
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in visa-consultant-chat function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: 'Check function logs for more information'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});