import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { FileText, Plus, Sparkles } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface SOPDocument {
  id: string;
  document_type: string;
  prompt_input: string;
  generated_text: string;
  country: string | null;
  university: string | null;
  created_at: string;
}

const SOP = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [documents, setDocuments] = useState<SOPDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [documentType, setDocumentType] = useState<'sop' | 'cover_letter'>('sop');
  
  // Form fields
  const [country, setCountry] = useState('');
  const [university, setUniversity] = useState('');
  const [promptInput, setPromptInput] = useState('');

  useEffect(() => {
    fetchDocuments();
  }, [user]);

  const fetchDocuments = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('sop_documents')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDocuments(data || []);
    } catch (error) {
      console.error('Error fetching SOP documents:', error);
      toast({
        title: "Error",
        description: "Failed to fetch documents",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const generateDocument = async () => {
    if (!promptInput.trim() || !user) {
      toast({
        title: "Error",
        description: "Please provide input for document generation",
        variant: "destructive",
      });
      return;
    }

    setGenerating(true);

    try {
      // This is a placeholder for AI generation
      // In a real implementation, you would call your AI service here
      const placeholderText = `This is a placeholder ${documentType === 'sop' ? 'Statement of Purpose' : 'Cover Letter'} generated based on your input:

Country: ${country || 'Not specified'}
University: ${university || 'Not specified'}

Your Input: ${promptInput}

Generated Content:
${documentType === 'sop' 
  ? `I am writing to express my strong interest in pursuing [Program Name] at ${university || 'your esteemed university'} in ${country || 'your country'}. With my academic background and professional experience, I am confident that this program will help me achieve my career goals.

Throughout my academic journey, I have developed a passion for [field of study]. My undergraduate studies in [field] have provided me with a solid foundation in [relevant skills/knowledge]. I have consistently maintained excellent academic performance, which demonstrates my commitment to learning and excellence.

My professional experience includes [relevant experience], where I gained valuable insights into [industry/field]. This experience has reinforced my decision to pursue advanced studies in this field and has given me a clear understanding of the challenges and opportunities that lie ahead.

I am particularly drawn to ${university || 'your university'} because of its reputation for excellence in [program/field]. The faculty's expertise in [specific areas] and the university's state-of-the-art facilities make it the ideal place for me to further my education and research interests.

Upon completion of my studies, I plan to return to my home country and contribute to [relevant field/industry]. I believe that the knowledge and skills I will gain from this program will enable me to make meaningful contributions to [specific goals/objectives].

I am confident that I have the academic ability, motivation, and commitment necessary to succeed in this program. I look forward to the opportunity to contribute to your academic community and to learn from the distinguished faculty and fellow students.

Thank you for considering my application.`
  : `Dear Hiring Manager,

I am writing to express my strong interest in the [Position Title] position at [Company Name] in ${country || 'your location'}. With my educational background from ${university || 'my university'} and relevant experience, I am excited about the opportunity to contribute to your team.

Based on your requirements: ${promptInput}

My qualifications include:
- [Relevant qualification 1]
- [Relevant qualification 2]
- [Relevant qualification 3]

I am particularly drawn to this opportunity because of [company/role specific reasons]. My experience in [relevant field] has prepared me well for the challenges of this position, and I am eager to bring my skills and enthusiasm to your organization.

I would welcome the opportunity to discuss how my background and passion for [field] can contribute to [Company Name]'s continued success. Thank you for your time and consideration.

Sincerely,
[Your Name]`}

---

Note: This is a placeholder generated document. In a production environment, this would be generated using AI services like OpenAI GPT or Google's Gemini API with the key: YOUR_GEMINI_API_KEY_HERE`;

      // Save to database
      const { error } = await supabase
        .from('sop_documents')
        .insert({
          user_id: user.id,
          document_type: documentType,
          prompt_input: promptInput,
          generated_text: placeholderText,
          country: country || null,
          university: university || null,
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: `${documentType === 'sop' ? 'SOP' : 'Cover Letter'} generated successfully`,
      });

      // Reset form and close dialog
      setCountry('');
      setUniversity('');
      setPromptInput('');
      setIsDialogOpen(false);
      fetchDocuments();
    } catch (error) {
      console.error('Error generating document:', error);
      toast({
        title: "Error",
        description: "Failed to generate document",
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="h-32 bg-muted rounded"></div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-24 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-gradient-to-br from-background via-background to-secondary/5 min-h-screen">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">SOPs & Cover Letters</h1>
          <p className="text-muted-foreground">
            Generate AI-powered statements and cover letters for your applications
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Generate New Document
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                Generate New Document
              </DialogTitle>
              <DialogDescription>
                Provide details to generate a personalized SOP or cover letter
              </DialogDescription>
            </DialogHeader>
            <Tabs defaultValue="sop" onValueChange={(value) => setDocumentType(value as 'sop' | 'cover_letter')}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="sop">Statement of Purpose</TabsTrigger>
                <TabsTrigger value="cover_letter">Cover Letter</TabsTrigger>
              </TabsList>
              <TabsContent value="sop" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="country">Country</Label>
                    <Input
                      id="country"
                      placeholder="e.g., Canada, Australia"
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="university">University</Label>
                    <Input
                      id="university"
                      placeholder="e.g., University of Toronto"
                      value={university}
                      onChange={(e) => setUniversity(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="prompt">Additional Details</Label>
                  <Textarea
                    id="prompt"
                    placeholder="Describe your background, goals, program of interest, and any specific points you'd like to include..."
                    value={promptInput}
                    onChange={(e) => setPromptInput(e.target.value)}
                    rows={6}
                  />
                </div>
              </TabsContent>
              <TabsContent value="cover_letter" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="country-cl">Country/Location</Label>
                    <Input
                      id="country-cl"
                      placeholder="e.g., Toronto, Canada"
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="company">Company/Organization</Label>
                    <Input
                      id="company"
                      placeholder="e.g., Tech Solutions Inc."
                      value={university}
                      onChange={(e) => setUniversity(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="prompt-cl">Job Description & Your Qualifications</Label>
                  <Textarea
                    id="prompt-cl"
                    placeholder="Describe the position you're applying for, your relevant experience, skills, and qualifications..."
                    value={promptInput}
                    onChange={(e) => setPromptInput(e.target.value)}
                    rows={6}
                  />
                </div>
              </TabsContent>
            </Tabs>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={generateDocument} disabled={generating}>
                {generating ? "Generating..." : "Generate Document"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Documents List */}
      <div className="space-y-4">
        {documents.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">No documents generated yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first SOP or cover letter using AI assistance
              </p>
              <Button onClick={() => setIsDialogOpen(true)} className="gap-2">
                <Sparkles className="h-4 w-4" />
                Generate Your First Document
              </Button>
            </CardContent>
          </Card>
        ) : (
          documents.map((doc) => (
            <Card key={doc.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    {doc.document_type === 'sop' ? 'Statement of Purpose' : 'Cover Letter'}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">
                      {doc.document_type === 'sop' ? 'SOP' : 'Cover Letter'}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {new Date(doc.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                {(doc.country || doc.university) && (
                  <div className="flex gap-2 text-sm text-muted-foreground">
                    {doc.country && <span>📍 {doc.country}</span>}
                    {doc.university && <span>🏫 {doc.university}</span>}
                  </div>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Your Input:</h4>
                  <p className="text-sm text-muted-foreground bg-secondary/50 p-3 rounded">
                    {doc.prompt_input}
                  </p>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Generated Document:</h4>
                  <div className="bg-background border rounded p-4 max-h-96 overflow-y-auto">
                    <pre className="whitespace-pre-wrap text-sm font-mono">
                      {doc.generated_text}
                    </pre>
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(doc.generated_text);
                      toast({
                        title: "Copied!",
                        description: "Document copied to clipboard",
                      });
                    }}
                  >
                    Copy to Clipboard
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default SOP;