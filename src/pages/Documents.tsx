import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Upload, FileText, Check, X } from 'lucide-react';

interface Document {
  id: string;
  document_name: string;
  document_type: string;
  file_url: string | null;
  file_name: string | null;
  is_completed: boolean;
  uploaded_at: string;
}

const documentTypes = [
  'IELTS Certificate',
  'TOEFL Certificate',
  'Degree Certificate',
  'Transcript',
  'University Offer Letter',
  'Statement of Purpose',
  'Passport',
  'Financial Statement',
  'Bank Statement',
  'Sponsorship Letter',
  'Photos',
  'Medical Certificate',
  'Police Clearance',
  'Work Experience Letter',
  'Academic References',
  'English Proficiency Waiver',
  'Visa Application Form',
  'Travel Insurance',
];

const Documents = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedType, setSelectedType] = useState('');
  const [customName, setCustomName] = useState('');

  useEffect(() => {
    fetchDocuments();
  }, [user]);

  const fetchDocuments = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('user_id', user.id)
        .order('uploaded_at', { ascending: false });

      if (error) throw error;
      setDocuments(data || []);
    } catch (error) {
      console.error('Error fetching documents:', error);
      toast({
        title: "Error",
        description: "Failed to fetch documents",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    if (!selectedType) {
      toast({
        title: "Error",
        description: "Please select a document type",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);

    try {
      // Upload file to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('documents')
        .getPublicUrl(fileName);

      // Save document record
      const { error: dbError } = await supabase
        .from('documents')
        .insert({
          user_id: user.id,
          document_name: customName || selectedType,
          document_type: selectedType,
          file_url: publicUrl,
          file_name: file.name,
        });

      if (dbError) throw dbError;

      toast({
        title: "Success",
        description: "Document uploaded successfully",
      });

      // Reset form and refresh documents
      setSelectedType('');
      setCustomName('');
      event.target.value = '';
      fetchDocuments();
    } catch (error) {
      console.error('Error uploading document:', error);
      toast({
        title: "Error",
        description: "Failed to upload document",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const toggleCompletion = async (documentId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('documents')
        .update({ is_completed: !currentStatus })
        .eq('id', documentId);

      if (error) throw error;

      // Update local state
      setDocuments(docs => 
        docs.map(doc => 
          doc.id === documentId 
            ? { ...doc, is_completed: !currentStatus }
            : doc
        )
      );

      toast({
        title: "Success",
        description: `Document marked as ${!currentStatus ? 'completed' : 'pending'}`,
      });
    } catch (error) {
      console.error('Error updating document:', error);
      toast({
        title: "Error",
        description: "Failed to update document status",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="grid gap-4">
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
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Documents</h1>
        <p className="text-muted-foreground">
          Upload and manage your visa-related documents
        </p>
      </div>

      {/* Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload New Document
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="documentType">Document Type</Label>
              <select
                id="documentType"
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full p-2 border border-input rounded-md bg-background"
              >
                <option value="">Select document type...</option>
                {documentTypes.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="customName">Custom Name (Optional)</Label>
              <Input
                id="customName"
                type="text"
                placeholder="Enter custom document name"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="file">Choose File</Label>
            <Input
              id="file"
              type="file"
              onChange={handleFileUpload}
              disabled={uploading}
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
            />
            <p className="text-xs text-muted-foreground">
              Supported formats: PDF, DOC, DOCX, JPG, PNG (Max 10MB)
            </p>
          </div>
          {uploading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
              Uploading document...
            </div>
          )}
        </CardContent>
      </Card>

      {/* Documents List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Your Documents ({documents.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {documents.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No documents uploaded yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-4 border rounded-lg bg-card hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-full ${doc.is_completed ? 'bg-green-100 dark:bg-green-900' : 'bg-orange-100 dark:bg-orange-900'}`}>
                      {doc.is_completed ? (
                        <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
                      ) : (
                        <X className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-medium">{doc.document_name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {doc.file_name} • Uploaded {new Date(doc.uploaded_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <Badge variant={doc.is_completed ? "secondary" : "outline"}>
                      {doc.document_type}
                    </Badge>
                    <div className="flex items-center gap-2">
                      <Label htmlFor={`switch-${doc.id}`} className="text-sm">
                        {doc.is_completed ? 'Completed' : 'Pending'}
                      </Label>
                      <Switch
                        id={`switch-${doc.id}`}
                        checked={doc.is_completed}
                        onCheckedChange={() => toggleCompletion(doc.id, doc.is_completed)}
                      />
                    </div>
                    {doc.file_url && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(doc.file_url!, '_blank')}
                      >
                        View
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Documents;