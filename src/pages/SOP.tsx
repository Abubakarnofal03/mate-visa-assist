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
import { FileText, Plus, Sparkles, Download, Edit, Save, X, Trash2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx';
import { saveAs } from 'file-saver';
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

interface Resume {
  id: string;
  title: string;
  parsed_content: string | null;
}

const SOP = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [documents, setDocuments] = useState<SOPDocument[]>([]);
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [documentType, setDocumentType] = useState<'sop' | 'cover_letter'>('sop');
  
  // Form fields
  const [country, setCountry] = useState('');
  const [university, setUniversity] = useState('');
  const [promptInput, setPromptInput] = useState('');
  const [selectedResumeId, setSelectedResumeId] = useState<string>('none');
  
  // Editing state
  const [editingDocumentId, setEditingDocumentId] = useState<string | null>(null);
  const [editedContent, setEditedContent] = useState<string>('');

  useEffect(() => {
    fetchDocuments();
    fetchResumes();
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

  const fetchResumes = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('resumes')
        .select('id, title, parsed_content')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setResumes(data || []);
    } catch (error) {
      console.error('Error fetching resumes:', error);
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
      // Get selected resume data if any
      const selectedResume = selectedResumeId && selectedResumeId !== 'none' ? resumes.find(r => r.id === selectedResumeId) : null;
      const resumeData = selectedResume?.parsed_content || null;

      // Call Gemini API through Supabase Edge Function
      const { data, error: functionError } = await supabase.functions.invoke('generate-with-gemini', {
        body: {
          documentType,
          prompt: promptInput,
          country: country || null,
          university: university || null,
          resumeData: resumeData,
        },
      });

      if (functionError) {
        console.error('Edge function error:', functionError);
        throw new Error(functionError.message || 'Failed to generate document');
      }

      if (!data?.generatedText) {
        throw new Error('No content generated');
      }

      const generatedText = data.generatedText;

      // Save to database
      const { error: insertError } = await supabase
        .from('sop_documents')
        .insert({
          user_id: user.id,
          document_type: documentType,
          prompt_input: promptInput,
          generated_text: generatedText,
          country: country || null,
          university: university || null,
        });

      if (insertError) throw insertError;

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
  
  const downloadAsWord = async (document: SOPDocument) => {
    try {
      // Get current content (either edited or original)
      const content = editingDocumentId === document.id ? editedContent : document.generated_text;
      
      // Convert HTML to plain text for Word document
      const tempDiv = window.document.createElement('div');
      tempDiv.innerHTML = content;
      const plainText = tempDiv.textContent || tempDiv.innerText || '';
      
      // Create Word document
      const doc = new Document({
        sections: [{
          properties: {},
          children: [
            new Paragraph({
              text: document.document_type === 'sop' ? 'Statement of Purpose' : 'Cover Letter',
              heading: HeadingLevel.HEADING_1,
              alignment: 'center',
            }),
            new Paragraph({
              text: '',
            }),
            ...plainText.split('\n\n')
              .filter(paragraph => paragraph.trim())
              .map(paragraph => 
                new Paragraph({
                  children: [new TextRun(paragraph.trim())],
                  spacing: {
                    after: 200,
                  },
                })
              ),
          ],
        }],
      });

      // Generate and download the Word document
      const buffer = await Packer.toBlob(doc);
      const fileName = `${document.document_type === 'sop' ? 'Statement_of_Purpose' : 'Cover_Letter'}_${new Date().toISOString().split('T')[0]}.docx`;
      saveAs(buffer, fileName);

      toast({
        title: "Success",
        description: "Word document downloaded successfully",
      });
    } catch (error) {
      console.error('Error generating Word document:', error);
      toast({
        title: "Error",
        description: "Failed to generate Word document",
        variant: "destructive",
      });
    }
  };

  const startEditing = (document: SOPDocument) => {
    setEditingDocumentId(document.id);
    // Convert HTML to plain text for editing
    const tempDiv = window.document.createElement('div');
    tempDiv.innerHTML = document.generated_text;
    setEditedContent(tempDiv.textContent || tempDiv.innerText || '');
  };

  const saveChanges = async (documentId: string) => {
    try {
      const { error } = await supabase
        .from('sop_documents')
        .update({ generated_text: editedContent })
        .eq('id', documentId);

      if (error) throw error;

      // Update local state
      setDocuments(docs => 
        docs.map(doc => 
          doc.id === documentId 
            ? { ...doc, generated_text: editedContent }
            : doc
        )
      );

      setEditingDocumentId(null);
      setEditedContent('');

      toast({
        title: "Success",
        description: "Document updated successfully",
      });
    } catch (error) {
      console.error('Error saving changes:', error);
      toast({
        title: "Error",
        description: "Failed to save changes",
        variant: "destructive",
      });
    }
  };

  const cancelEditing = () => {
    setEditingDocumentId(null);
    setEditedContent('');
  };

  const deleteDocument = async (documentId: string, documentType: string) => {
    try {
      const { error } = await supabase
        .from('sop_documents')
        .delete()
        .eq('id', documentId);

      if (error) throw error;

      // Update local state
      setDocuments(docs => docs.filter(doc => doc.id !== documentId));

      toast({
        title: "Success",
        description: `${documentType === 'sop' ? 'SOP' : 'Cover Letter'} deleted successfully`,
      });
    } catch (error) {
      console.error('Error deleting document:', error);
      toast({
        title: "Error",
        description: "Failed to delete document",
        variant: "destructive",
      });
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
    <div className="p-4 sm:p-6 space-y-6 bg-gradient-to-br from-background via-background to-secondary/5 min-h-screen">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">SOPs & Cover Letters</h1>
          <p className="text-muted-foreground text-sm sm:text-base">
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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                {resumes.length > 0 && (
                  <div className="space-y-2">
                    <Label htmlFor="resume-select">Select Resume (Optional)</Label>
                    <Select value={selectedResumeId} onValueChange={setSelectedResumeId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a resume to include..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No resume selected</SelectItem>
                        {resumes.map((resume) => (
                          <SelectItem key={resume.id} value={resume.id}>
                            {resume.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                {resumes.length > 0 && (
                  <div className="space-y-2">
                    <Label htmlFor="resume-select-cl">Select Resume (Optional)</Label>
                    <Select value={selectedResumeId} onValueChange={setSelectedResumeId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a resume to include..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No resume selected</SelectItem>
                        {resumes.map((resume) => (
                          <SelectItem key={resume.id} value={resume.id}>
                            {resume.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
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
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 flex-shrink-0" />
                    <span className="truncate">{doc.document_type === 'sop' ? 'Statement of Purpose' : 'Cover Letter'}</span>
                  </CardTitle>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <Badge variant="secondary">
                      {doc.document_type === 'sop' ? 'SOP' : 'Cover Letter'}
                    </Badge>
                    <span className="text-sm text-muted-foreground whitespace-nowrap">
                      {new Date(doc.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                {(doc.country || doc.university) && (
                  <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                    {doc.country && <span className="break-all">📍 {doc.country}</span>}
                    {doc.university && <span className="break-all">🏫 {doc.university}</span>}
                  </div>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Your Input:</h4>
                  <p className="text-sm text-muted-foreground bg-secondary/50 p-3 rounded break-words">
                    {doc.prompt_input}
                  </p>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">Generated Document:</h4>
                    {editingDocumentId !== doc.id && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => startEditing(doc)}
                        className="gap-2"
                      >
                        <Edit className="h-4 w-4" />
                        Edit
                      </Button>
                    )}
                  </div>
                  
                  {editingDocumentId === doc.id ? (
                    <div className="space-y-2">
                      <Textarea
                        value={editedContent}
                        onChange={(e) => setEditedContent(e.target.value)}
                        className="min-h-[300px] font-mono text-sm"
                        placeholder="Edit your document content..."
                      />
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={cancelEditing}
                          className="gap-2"
                        >
                          <X className="h-4 w-4" />
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => saveChanges(doc.id)}
                          className="gap-2"
                        >
                          <Save className="h-4 w-4" />
                          Save Changes
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div 
                      id={`${doc.id}-content`}
                      className="bg-background border rounded p-3 sm:p-4 max-h-96 overflow-y-auto prose prose-slate max-w-none break-words"
                      dangerouslySetInnerHTML={{ 
                        __html: doc.generated_text || 'No content available' 
                      }}
                    />
                  )}
                </div>
                
                {editingDocumentId !== doc.id && (
                  <div className="flex flex-col sm:flex-row justify-between gap-3">
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => deleteDocument(doc.id, doc.document_type)}
                      className="flex items-center gap-2 sm:w-auto"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </Button>
                    <div className="flex flex-col sm:flex-row gap-2">
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
                        className="sm:w-auto"
                      >
                        <span className="sm:hidden">Copy</span>
                        <span className="hidden sm:inline">Copy to Clipboard</span>
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => downloadAsWord(doc)}
                        className="flex items-center gap-2 sm:w-auto"
                      >
                        <Download className="h-4 w-4" />
                        <span className="hidden sm:inline">Download Word</span>
                        <span className="sm:hidden">Download</span>
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default SOP;