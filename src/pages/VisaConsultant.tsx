import VisaConsultantChat from '@/components/VisaConsultantChat';

const VisaConsultant = () => {
  return (
    <div className="space-y-4 sm:space-y-6 bg-gradient-to-br from-background via-background to-secondary/5 min-h-screen">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Visa Consultant</h1>
        <p className="text-muted-foreground">
          Get personalized guidance for your visa application process from our AI consultant
        </p>
      </div>

      <VisaConsultantChat />
    </div>
  );
};

export default VisaConsultant;