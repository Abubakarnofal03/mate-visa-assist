import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Bell, FileText, TrendingUp } from 'lucide-react';

interface DashboardData {
  visaProgress: number;
  pendingDocuments: number;
  recentSOPs: Array<{
    id: string;
    document_type: string;
    created_at: string;
  }>;
  completedDocuments: number;
  totalDocuments: number;
}

const Dashboard = () => {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData>({
    visaProgress: 0,
    pendingDocuments: 0,
    recentSOPs: [],
    completedDocuments: 0,
    totalDocuments: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user) return;

      try {
        // Fetch visa progress
        const { data: progressData } = await supabase
          .from('visa_progress')
          .select('*')
          .eq('user_id', user.id)
          .single();

        // Calculate progress percentage
        let progressCount = 0;
        if (progressData) {
          const fields = [
            'ielts_submitted',
            'university_offer_letter',
            'visa_form_filled',
            'financial_documents_ready',
            'medical_check_done'
          ];
          progressCount = fields.filter(field => progressData[field]).length;
        }
        const progressPercentage = (progressCount / 5) * 100;

        // Fetch documents
        const { data: documents } = await supabase
          .from('documents')
          .select('*')
          .eq('user_id', user.id);

        const completedDocs = documents?.filter(doc => doc.is_completed).length || 0;
        const totalDocs = documents?.length || 0;
        const pendingDocs = totalDocs - completedDocs;

        // Fetch recent SOPs
        const { data: recentSOPs } = await supabase
          .from('sop_documents')
          .select('id, document_type, created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(3);

        setData({
          visaProgress: progressPercentage,
          pendingDocuments: pendingDocs,
          recentSOPs: recentSOPs || [],
          completedDocuments: completedDocs,
          totalDocuments: totalDocs,
        });
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user]);

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse space-y-3">
                  <div className="h-4 bg-muted rounded w-1/2"></div>
                  <div className="h-8 bg-muted rounded"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-gradient-to-br from-background via-background to-secondary/5 min-h-screen">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back! Here's an overview of your visa application progress.
        </p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Visa Progress</CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{data.visaProgress.toFixed(0)}%</div>
            <Progress value={data.visaProgress} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-2">
              Complete all steps to finish your application
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-500/10 to-orange-500/5 border-orange-500/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Documents</CardTitle>
            <Bell className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{data.pendingDocuments}</div>
            <p className="text-xs text-muted-foreground mt-2">
              {data.completedDocuments} of {data.totalDocuments} documents completed
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent SOPs</CardTitle>
            <FileText className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{data.recentSOPs.length}</div>
            <p className="text-xs text-muted-foreground mt-2">
              Documents generated this month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notifications
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.pendingDocuments > 0 ? (
              <div className="flex items-center justify-between p-3 bg-orange-50 dark:bg-orange-950/20 rounded-lg border border-orange-200 dark:border-orange-800">
                <div>
                  <p className="font-medium text-orange-800 dark:text-orange-200">
                    Documents Pending
                  </p>
                  <p className="text-sm text-orange-600 dark:text-orange-300">
                    You have {data.pendingDocuments} documents waiting for upload
                  </p>
                </div>
                <Badge variant="outline" className="border-orange-300 text-orange-700">
                  {data.pendingDocuments}
                </Badge>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No pending notifications</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Recent SOPs & Cover Letters
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.recentSOPs.length > 0 ? (
              <div className="space-y-3">
                {data.recentSOPs.map((sop) => (
                  <div key={sop.id} className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
                    <div>
                      <p className="font-medium capitalize">{sop.document_type.replace('_', ' ')}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(sop.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge variant="secondary">
                      {sop.document_type === 'sop' ? 'SOP' : 'Cover Letter'}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No SOPs generated yet</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;