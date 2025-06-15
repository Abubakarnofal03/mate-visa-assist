import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useAuth } from './useAuth';

interface TutorialStep {
  id: string;
  title: string;
  description: string;
  target?: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  action?: () => void;
}

interface TutorialContextType {
  isActive: boolean;
  currentStep: number;
  steps: TutorialStep[];
  startTutorial: () => void;
  nextStep: () => void;
  prevStep: () => void;
  skipTutorial: () => void;
  completeTutorial: () => void;
}

const TutorialContext = createContext<TutorialContextType | undefined>(undefined);

const tutorialSteps: TutorialStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to VisaMate! 🎉',
    description: 'Your comprehensive companion for visa application success. We help you track your progress, organize documents, and generate professional SOPs and cover letters with AI assistance.',
  },
  {
    id: 'dashboard',
    title: 'Your Dashboard',
    description: 'Get a complete overview of your visa application progress, pending documents, and recent activities all in one place.',
    target: '[data-tutorial="dashboard"]',
  },
  {
    id: 'visa-progress',
    title: 'Track Your Visa Progress',
    description: 'Monitor each step of your visa application journey - from IELTS submission to medical checkups. Never miss an important milestone!',
    target: '[data-tutorial="visa-progress"]',
  },
  {
    id: 'documents',
    title: 'Document Management',
    description: 'Upload, organize, and track all your visa-related documents in one secure place. Get reminders for missing documents.',
    target: '[data-tutorial="documents"]',
  },
  {
    id: 'visa-consultant',
    title: 'AI Visa Consultant',
    description: 'Get personalized visa guidance and answers to your questions from our AI consultant. Available 24/7 to help with your queries.',
    target: '[data-tutorial="visa-consultant"]',
  },
  {
    id: 'sop',
    title: 'AI-Powered SOP Generation',
    description: 'Create compelling Statements of Purpose and cover letters using our advanced AI. Tailored to your profile and target universities.',
    target: '[data-tutorial="sop"]',
  },
  {
    id: 'resume',
    title: 'Resume Builder',
    description: 'Build and optimize your resume for visa applications and university admissions with our guided resume builder.',
    target: '[data-tutorial="resume"]',
  },
  {
    id: 'profile',
    title: 'Your Profile',
    description: 'Manage your personal information and preferences. Keep your profile updated for better AI recommendations.',
    target: '[data-tutorial="profile"]',
  },
  {
    id: 'complete',
    title: 'You\'re All Set! 🚀',
    description: 'You\'re ready to begin your visa application journey with VisaMate. Remember, we\'re here to help you every step of the way!',
  },
];

export const TutorialProvider = ({ children }: { children: ReactNode }) => {
  const { user, userProfile } = useAuth();
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [steps] = useState(tutorialSteps);

  useEffect(() => {
    // Start tutorial for new users regardless of profile completion
    if (user && userProfile !== null) {
      const hasSeenTutorial = localStorage.getItem(`tutorial-completed-${user.id}`);
      if (!hasSeenTutorial) {
        // Small delay to let the app load
        setTimeout(() => {
          setIsActive(true);
        }, 1000);
      }
    }
  }, [user, userProfile]);

  const startTutorial = () => {
    setCurrentStep(0);
    setIsActive(true);
  };

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      completeTutorial();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const skipTutorial = () => {
    completeTutorial();
  };

  const completeTutorial = () => {
    setIsActive(false);
    if (user) {
      localStorage.setItem(`tutorial-completed-${user.id}`, 'true');
      
      // After tutorial is complete, check if user needs to complete profile
      if (userProfile && !userProfile.residence_country) {
        window.location.href = '/profile';
      }
    }
  };

  const value = {
    isActive,
    currentStep,
    steps,
    startTutorial,
    nextStep,
    prevStep,
    skipTutorial,
    completeTutorial,
  };

  return <TutorialContext.Provider value={value}>{children}</TutorialContext.Provider>;
};

export const useTutorial = () => {
  const context = useContext(TutorialContext);
  if (context === undefined) {
    throw new Error('useTutorial must be used within a TutorialProvider');
  }
  return context;
};