import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { FileText, Plus, Upload, Star, Trash2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface Resume {
  id: string;
  title: string;
  file_url: string;
  parsed_content: string | null;
  ai_suggestions: string | null;
  ai_rating: number | null;
  created_at: string;
}

const Resume = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');

  useEffect(() => {
    fetchResumes();
  }, [user]);

  const fetchResumes = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('resumes')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setResumes(data || []);
    } catch (error) {
      console.error('Error fetching resumes:', error);
      toast({
        title: "Error",
        description: "Failed to fetch resumes",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        toast({
          title: "Error",
          description: "Please select a PDF file",
          variant: "destructive",
        });
        return;
      }
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        toast({
          title: "Error",
          description: "File size must be less than 10MB",
          variant: "destructive",
        });
        return;
      }
      setSelectedFile(file);
    }
  };

  const uploadResume = async () => {
    if (!selectedFile || !title.trim() || !user) {
      toast({
        title: "Error",
        description: "Please provide a title and select a PDF file",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);

    try {
      console.log('Starting resume upload...', { title, fileName: selectedFile.name, userId: user.id });
      
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('title', title);
      formData.append('userId', user.id);

      console.log('Calling parse-resume function...');
      const { data, error } = await supabase.functions.invoke('parse-resume', {
        body: formData,
      });

      console.log('Function response:', { data, error });

      if (error) {
        console.error('Function invocation error:', error);
        throw new Error(error.message || 'Failed to invoke parse-resume function');
      }

      if (!data?.success) {
        console.error('Function returned error:', data);
        throw new Error(data?.error || 'Failed to process resume');
      }

      toast({
        title: "Success",
        description: "Resume uploaded and analyzed successfully",
      });

      setTitle('');
      setSelectedFile(null);
      setIsDialogOpen(false);
      fetchResumes();
    } catch (error) {
      console.error('Error uploading resume:', error);
      toast({
        title: "Error",
        description: "Failed to upload and analyze resume",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const deleteResume = async (resumeId: string, fileUrl: string) => {
    try {
      // Delete file from storage
      const { error: storageError } = await supabase.storage
        .from('resumes')
        .remove([fileUrl]);

      if (storageError) {
        console.error('Storage deletion error:', storageError);
      }

      // Delete from database
      const { error: dbError } = await supabase
        .from('resumes')
        .delete()
        .eq('id', resumeId);

      if (dbError) throw dbError;

      toast({
        title: "Success",
        description: "Resume deleted successfully",
      });

      fetchResumes();
    } catch (error) {
      console.error('Error deleting resume:', error);
      toast({
        title: "Error",
        description: "Failed to delete resume",
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
    <div className="p-6 space-y-6 bg-gradient-to-br from-background via-background to-secondary/5 min-h-screen">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Resume Manager</h1>
          <p className="text-muted-foreground">
            Upload and analyze your resumes with AI-powered suggestions
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Upload Resume
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Upload New Resume
              </DialogTitle>
              <DialogDescription>
                Upload a PDF resume for AI analysis and suggestions
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Resume Title</Label>
                <Input
                  id="title"
                  placeholder="e.g., Software Engineer Resume 2024"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="file">PDF File</Label>
                <Input
                  id="file"
                  type="file"
                  accept=".pdf"
                  onChange={handleFileSelect}
                />
                {selectedFile && (
                  <p className="text-sm text-muted-foreground">
                    Selected: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                  </p>
                )}
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={uploadResume} disabled={uploading}>
                {uploading ? "Processing..." : "Upload & Analyze"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Resumes List */}
      <div className="space-y-4">
        {resumes.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">No resumes uploaded yet</h3>
              <p className="text-muted-foreground mb-4">
                Upload your first resume to get AI-powered analysis and suggestions
              </p>
              <Button onClick={() => setIsDialogOpen(true)} className="gap-2">
                <Upload className="h-4 w-4" />
                Upload Your First Resume
              </Button>
            </CardContent>
          </Card>
        ) : (
          resumes.map((resume) => (
            <Card key={resume.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    {resume.title}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    {resume.ai_rating && (
                      <Badge variant="secondary" className="gap-1">
                        <Star className="h-3 w-3" />
                        {resume.ai_rating}/10
                      </Badge>
                    )}
                    <span className="text-sm text-muted-foreground">
                      {new Date(resume.created_at).toLocaleDateString()}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteResume(resume.id, resume.file_url)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {resume.parsed_content && (
                  <div>
                    <h4 className="font-medium mb-2">Extracted Content (Preview):</h4>
                    <p className="text-sm text-muted-foreground bg-secondary/50 p-3 rounded max-h-32 overflow-y-auto">
                      {resume.parsed_content.substring(0, 500)}
                      {resume.parsed_content.length > 500 && '...'}
                    </p>
                  </div>
                )}
                {resume.ai_suggestions && (
                  <div>
                    <h4 className="font-medium mb-2">AI Analysis & Suggestions:</h4>
                    <div 
                      className="bg-background border rounded p-4 max-h-96 overflow-y-auto prose prose-slate max-w-none"
                      dangerouslySetInnerHTML={{ 
                        __html: resume.ai_suggestions 
                      }}
                    />
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

export default Resume;