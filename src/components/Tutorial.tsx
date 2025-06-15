import { useEffect, useState } from 'react';
import { useTutorial } from '@/hooks/useTutorial';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { X, ArrowLeft, ArrowRight, Sparkles, Target, FileText, Calendar, User, Briefcase, LayoutDashboard, MessageCircle } from 'lucide-react';

const Tutorial = () => {
  const { isActive, currentStep, steps, nextStep, prevStep, skipTutorial } = useTutorial();
  const [targetElement, setTargetElement] = useState<HTMLElement | null>(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  const currentStepData = steps[currentStep];
  const progress = ((currentStep + 1) / steps.length) * 100;

  useEffect(() => {
    if (isActive && currentStepData?.target) {
      const element = document.querySelector(currentStepData.target) as HTMLElement;
      if (element) {
        setTargetElement(element);
        
        // Calculate position for tutorial card
        const rect = element.getBoundingClientRect();
        const isMobile = window.innerWidth < 768;
        const cardWidth = isMobile ? Math.min(350, window.innerWidth - 20) : 400;
        const cardHeight = isMobile ? 280 : 300;
        
        let top = rect.bottom + 20;
        let left = rect.left + (rect.width / 2) - (cardWidth / 2);
        
        // Mobile-specific positioning
        if (isMobile) {
          left = 10; // Always 10px from left on mobile
          if (top + cardHeight > window.innerHeight - 20) {
            top = Math.max(rect.top - cardHeight - 20, 10);
          }
        } else {
          // Desktop positioning
          if (left + cardWidth > window.innerWidth) {
            left = window.innerWidth - cardWidth - 20;
          }
          if (left < 20) {
            left = 20;
          }
          if (top + cardHeight > window.innerHeight) {
            top = rect.top - cardHeight - 20;
          }
        }
        
        setPosition({ top, left });
        
        // Highlight the target element
        element.style.position = 'relative';
        element.style.zIndex = '50';
        element.style.boxShadow = '0 0 0 4px rgba(59, 130, 246, 0.5)';
        element.style.borderRadius = '8px';
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }

    return () => {
      if (targetElement) {
        targetElement.style.position = '';
        targetElement.style.zIndex = '';
        targetElement.style.boxShadow = '';
        targetElement.style.borderRadius = '';
      }
    };
  }, [isActive, currentStep, currentStepData?.target, targetElement]);

  const getStepIcon = (stepId: string) => {
    switch (stepId) {
      case 'welcome':
      case 'complete':
        return <Sparkles className="h-6 w-6 text-primary" />;
      case 'dashboard':
        return <LayoutDashboard className="h-6 w-6 text-blue-500" />;
      case 'visa-progress':
        return <Target className="h-6 w-6 text-green-500" />;
      case 'documents':
        return <FileText className="h-6 w-6 text-orange-500" />;
      case 'visa-consultant':
        return <MessageCircle className="h-6 w-6 text-cyan-500" />;
      case 'sop':
        return <FileText className="h-6 w-6 text-purple-500" />;
      case 'resume':
        return <Briefcase className="h-6 w-6 text-indigo-500" />;
      case 'profile':
        return <User className="h-6 w-6 text-pink-500" />;
      default:
        return <Sparkles className="h-6 w-6 text-primary" />;
    }
  };

  if (!isActive) return null;

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/60 z-40 animate-fade-in" />
      
      {/* Tutorial Card */}
      <Card 
        className="fixed z-50 w-96 max-w-[calc(100vw-40px)] animate-scale-in shadow-2xl border-2 border-primary/20"
        style={{
          top: currentStepData?.target ? position.top : '50%',
          left: currentStepData?.target ? position.left : '50%',
          transform: currentStepData?.target ? 'none' : 'translate(-50%, -50%)',
        }}
      >
        <CardHeader className="relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {getStepIcon(currentStepData.id)}
              <div>
                <CardTitle className="text-lg">{currentStepData.title}</CardTitle>
                <Badge variant="secondary" className="mt-1">
                  Step {currentStep + 1} of {steps.length}
                </Badge>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={skipTutorial}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="mt-4">
            <Progress value={progress} className="h-2" />
            <p className="text-xs text-muted-foreground mt-1">
              {Math.round(progress)}% complete
            </p>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground leading-relaxed">
            {currentStepData.description}
          </p>

          <div className="flex items-center justify-between pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={prevStep}
              disabled={currentStep === 0}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Previous
            </Button>

            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={skipTutorial}
                className="text-muted-foreground"
              >
                Skip Tour
              </Button>
              
              <Button
                onClick={nextStep}
                size="sm"
                className="flex items-center gap-2"
              >
                {currentStep === steps.length - 1 ? (
                  <>
                    Get Started
                    <Sparkles className="h-4 w-4" />
                  </>
                ) : (
                  <>
                    Next
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
};

export default Tutorial;