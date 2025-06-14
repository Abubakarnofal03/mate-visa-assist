import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, Circle, TrendingUp } from 'lucide-react';

interface VisaProgressData {
  id: string;
  ielts_submitted: boolean;
  university_offer_letter: boolean;
  visa_form_filled: boolean;
  financial_documents_ready: boolean;
  medical_check_done: boolean;
  passport_ready: boolean;
  photos_submitted: boolean;
  degree_transcript_verified: boolean;
  police_clearance_obtained: boolean;
  sop_completed: boolean;
  visa_interview_scheduled: boolean;
}

const progressSteps = [
  {
    key: 'ielts_submitted' as keyof VisaProgressData,
    title: 'IELTS Submitted',
    description: 'English language proficiency test results',
  },
  {
    key: 'degree_transcript_verified' as keyof VisaProgressData,
    title: 'Degree & Transcript Verified',
    description: 'Academic credentials verified and authenticated',
  },
  {
    key: 'university_offer_letter' as keyof VisaProgressData,
    title: 'University Offer Letter',
    description: 'Conditional or unconditional offer from university',
  },
  {
    key: 'sop_completed' as keyof VisaProgressData,
    title: 'Statement of Purpose Completed',
    description: 'Personal statement and motivation letter written',
  },
  {
    key: 'financial_documents_ready' as keyof VisaProgressData,
    title: 'Financial Documents Ready',
    description: 'Bank statements and financial proof documents',
  },
  {
    key: 'passport_ready' as keyof VisaProgressData,
    title: 'Passport Ready',
    description: 'Valid passport with sufficient validity period',
  },
  {
    key: 'photos_submitted' as keyof VisaProgressData,
    title: 'Photos Submitted',
    description: 'Passport-sized photographs as per visa requirements',
  },
  {
    key: 'medical_check_done' as keyof VisaProgressData,
    title: 'Medical Check Done',
    description: 'Health examination by approved panel physician',
  },
  {
    key: 'police_clearance_obtained' as keyof VisaProgressData,
    title: 'Police Clearance Obtained',
    description: 'Criminal background verification certificate',
  },
  {
    key: 'visa_form_filled' as keyof VisaProgressData,
    title: 'Visa Form Filled',
    description: 'Online visa application form completed',
  },
  {
    key: 'visa_interview_scheduled' as keyof VisaProgressData,
    title: 'Visa Interview Scheduled',
    description: 'Appointment booked for visa interview (if required)',
  },
];

const VisaProgress = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [progressData, setProgressData] = useState<VisaProgressData | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    fetchProgressData();
  }, [user]);

  const fetchProgressData = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('visa_progress')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      setProgressData(data);
    } catch (error) {
      console.error('Error fetching visa progress:', error);
      toast({
        title: "Error",
        description: "Failed to fetch visa progress data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateProgress = async (field: string, value: boolean) => {
    if (!progressData || !user) return;

    setUpdating(field);

    try {
      const { error } = await supabase
        .from('visa_progress')
        .update({ [field]: value })
        .eq('user_id', user.id);

      if (error) throw error;

      setProgressData(prev => prev ? { ...prev, [field]: value } : null);
      
      toast({
        title: "Progress Updated",
        description: `${progressSteps.find(step => step.key === field)?.title} marked as ${value ? 'completed' : 'pending'}`,
      });
    } catch (error) {
      console.error('Error updating progress:', error);
      toast({
        title: "Error",
        description: "Failed to update progress",
        variant: "destructive",
      });
    } finally {
      setUpdating(null);
    }
  };

  const calculateProgress = (): number => {
    if (!progressData) return 0;
    
    const completedSteps = progressSteps.filter(step => progressData[step.key]).length;
    return (completedSteps / progressSteps.length) * 100;
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="h-32 bg-muted rounded"></div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-20 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const progressPercentage = calculateProgress();
  const completedSteps = progressSteps.filter(step => progressData?.[step.key]).length;

  return (
    <div className="p-6 space-y-6 bg-gradient-to-br from-background via-background to-secondary/5 min-h-screen">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Visa Progress</h1>
        <p className="text-muted-foreground">
          Track your visa application progress step by step
        </p>
      </div>

      {/* Progress Overview */}
      <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Overall Progress
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-2xl font-bold text-primary">
              {progressPercentage.toFixed(0)}% Complete
            </span>
            <span className="text-sm text-muted-foreground">
              {completedSteps} of {progressSteps.length} steps completed
            </span>
          </div>
          <Progress value={progressPercentage} className="h-3" />
        </CardContent>
      </Card>

      {/* Progress Steps */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Application Steps</h2>
        <div className="space-y-4">
          {progressSteps.map((step, index) => {
            const isCompleted = Boolean(progressData?.[step.key]) || false;
            const isUpdating = updating === step.key;

            return (
              <Card key={step.key} className={`transition-all ${isCompleted ? 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800' : ''}`}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex-shrink-0">
                        {isCompleted ? (
                          <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
                        ) : (
                          <Circle className="h-6 w-6 text-muted-foreground" />
                        )}
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-medium text-muted-foreground">
                            Step {index + 1}
                          </span>
                          <span className={`text-lg font-semibold ${isCompleted ? 'text-green-700 dark:text-green-300' : ''}`}>
                            {step.title}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {step.description}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Label 
                        htmlFor={`switch-${step.key}`} 
                        className={`text-sm ${isCompleted ? 'text-green-700 dark:text-green-300' : ''}`}
                      >
                        {isCompleted ? 'Completed' : 'Pending'}
                      </Label>
                      <Switch
                        id={`switch-${step.key}`}
                        checked={isCompleted}
                        onCheckedChange={(checked: boolean) => updateProgress(step.key, checked)}
                        disabled={isUpdating}
                      />
                    </div>
                  </div>
                  {isUpdating && (
                    <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                      <div className="animate-spin rounded-full h-3 w-3 border-b border-primary"></div>
                      Updating...
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Completion Message */}
      {progressPercentage === 100 && (
        <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20">
          <CardContent className="p-6 text-center">
            <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-green-700 dark:text-green-300 mb-2">
              Congratulations! 🎉
            </h3>
            <p className="text-green-600 dark:text-green-400">
              You have completed all the visa application steps. Your application is ready for submission!
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default VisaProgress;