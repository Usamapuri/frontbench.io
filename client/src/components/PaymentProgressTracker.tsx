import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, Clock, AlertCircle, CreditCard } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PaymentStep {
  id: string;
  label: string;
  icon: React.ReactNode;
  status: 'pending' | 'processing' | 'completed' | 'error';
  duration?: number;
}

interface PaymentProgressTrackerProps {
  isVisible: boolean;
  paymentAmount: number;
  onComplete?: () => void;
  onError?: (error: string) => void;
}

export function PaymentProgressTracker({ 
  isVisible, 
  paymentAmount, 
  onComplete, 
  onError 
}: PaymentProgressTrackerProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [steps, setSteps] = useState<PaymentStep[]>([
    {
      id: 'validation',
      label: 'Validating payment details',
      icon: <AlertCircle className="w-4 h-4" />,
      status: 'pending',
      duration: 1000
    },
    {
      id: 'processing',
      label: 'Processing payment',
      icon: <CreditCard className="w-4 h-4" />,
      status: 'pending',
      duration: 2000
    },
    {
      id: 'allocation',
      label: 'Allocating to invoice',
      icon: <Clock className="w-4 h-4" />,
      status: 'pending',
      duration: 1500
    },
    {
      id: 'completion',
      label: 'Payment completed',
      icon: <CheckCircle className="w-4 h-4" />,
      status: 'pending',
      duration: 500
    }
  ]);

  useEffect(() => {
    if (!isVisible) {
      // Reset state when hidden
      setCurrentStep(0);
      setProgress(0);
      setSteps(steps => steps.map(step => ({ ...step, status: 'pending' })));
      return;
    }

    let timeouts: NodeJS.Timeout[] = [];
    let currentStepIndex = 0;
    let currentProgress = 0;

    const processStep = (stepIndex: number) => {
      if (stepIndex >= steps.length) {
        onComplete?.();
        return;
      }

      // Mark current step as processing
      setSteps(prevSteps => 
        prevSteps.map((step, index) => ({
          ...step,
          status: index === stepIndex ? 'processing' : 
                 index < stepIndex ? 'completed' : 'pending'
        }))
      );
      
      setCurrentStep(stepIndex);

      const stepDuration = steps[stepIndex].duration || 1000;
      const progressIncrement = 100 / steps.length;
      
      // Animate progress for this step
      const progressTimeout = setTimeout(() => {
        currentProgress = (stepIndex + 1) * progressIncrement;
        setProgress(currentProgress);
        
        // Mark step as completed and move to next
        setSteps(prevSteps => 
          prevSteps.map((step, index) => ({
            ...step,
            status: index === stepIndex ? 'completed' : 
                   index < stepIndex ? 'completed' : 'pending'
          }))
        );

        // Process next step
        const nextTimeout = setTimeout(() => {
          processStep(stepIndex + 1);
        }, 200);
        
        timeouts.push(nextTimeout);
      }, stepDuration);

      timeouts.push(progressTimeout);
    };

    // Start processing
    processStep(0);

    return () => {
      timeouts.forEach(timeout => clearTimeout(timeout));
    };
  }, [isVisible, steps.length, onComplete]);

  if (!isVisible) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      data-testid="payment-progress-overlay"
    >
      <Card className="w-96 mx-4">
        <CardContent className="p-6">
          <div className="text-center mb-6">
            <h3 className="text-lg font-semibold mb-2">Processing Payment</h3>
            <p className="text-muted-foreground">
              Processing Rs. {paymentAmount.toLocaleString()} payment...
            </p>
          </div>

          {/* Progress Bar */}
          <div className="mb-6">
            <Progress 
              value={progress} 
              className="h-2 mb-2"
              data-testid="payment-progress-bar"
            />
            <p className="text-sm text-muted-foreground text-center">
              {Math.round(progress)}% Complete
            </p>
          </div>

          {/* Step List */}
          <div className="space-y-3">
            {steps.map((step, index) => (
              <div 
                key={step.id}
                className={cn(
                  "flex items-center gap-3 p-2 rounded-lg transition-all duration-300",
                  step.status === 'processing' && "bg-blue-50 dark:bg-blue-950",
                  step.status === 'completed' && "bg-green-50 dark:bg-green-950",
                  step.status === 'error' && "bg-red-50 dark:bg-red-950"
                )}
                data-testid={`payment-step-${step.id}`}
              >
                <div className={cn(
                  "flex items-center justify-center w-8 h-8 rounded-full transition-all duration-300",
                  step.status === 'pending' && "bg-gray-200 dark:bg-gray-700 text-gray-500",
                  step.status === 'processing' && "bg-blue-100 dark:bg-blue-900 text-blue-600 animate-pulse",
                  step.status === 'completed' && "bg-green-100 dark:bg-green-900 text-green-600",
                  step.status === 'error' && "bg-red-100 dark:bg-red-900 text-red-600"
                )}>
                  {step.status === 'processing' && (
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  )}
                  {step.status === 'completed' && (
                    <CheckCircle className="w-4 h-4" />
                  )}
                  {(step.status === 'pending' || step.status === 'error') && step.icon}
                </div>
                
                <span className={cn(
                  "text-sm transition-colors duration-300",
                  step.status === 'processing' && "text-blue-700 dark:text-blue-300 font-medium",
                  step.status === 'completed' && "text-green-700 dark:text-green-300",
                  step.status === 'error' && "text-red-700 dark:text-red-300",
                  step.status === 'pending' && "text-gray-600 dark:text-gray-400"
                )}>
                  {step.label}
                </span>
                
                {step.status === 'completed' && (
                  <div className="ml-auto">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-ping" />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Cancel option during first step only */}
          {currentStep === 0 && (
            <div className="mt-6 text-center">
              <button
                onClick={() => onError?.('Payment cancelled by user')}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                data-testid="cancel-payment-button"
              >
                Cancel Payment
              </button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}