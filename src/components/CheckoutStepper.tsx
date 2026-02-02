import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface Step {
  id: number;
  label: string;
  description?: string;
}

interface CheckoutStepperProps {
  steps: Step[];
  currentStep: number;
  onStepClick?: (step: number) => void;
}

const CheckoutStepper = ({ steps, currentStep, onStepClick }: CheckoutStepperProps) => {
  return (
    <div className="w-full">
      {/* Desktop stepper */}
      <div className="hidden sm:flex items-center justify-between">
        {steps.map((step, index) => {
          const isCompleted = currentStep > step.id;
          const isCurrent = currentStep === step.id;
          const isClickable = step.id < currentStep;

          return (
            <div key={step.id} className="flex items-center flex-1">
              <div className="flex flex-col items-center">
                <button
                  onClick={() => isClickable && onStepClick?.(step.id)}
                  disabled={!isClickable}
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all duration-300",
                    isCompleted && "bg-primary text-primary-foreground cursor-pointer hover:bg-primary/90",
                    isCurrent && "bg-primary text-primary-foreground ring-4 ring-primary/20",
                    !isCompleted && !isCurrent && "bg-muted text-muted-foreground",
                    isClickable && "cursor-pointer"
                  )}
                >
                  {isCompleted ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    step.id
                  )}
                </button>
                <div className="mt-2 text-center">
                  <p className={cn(
                    "text-sm font-medium",
                    (isCompleted || isCurrent) ? "text-foreground" : "text-muted-foreground"
                  )}>
                    {step.label}
                  </p>
                  {step.description && (
                    <p className="text-xs text-muted-foreground hidden lg:block">
                      {step.description}
                    </p>
                  )}
                </div>
              </div>
              
              {/* Connector line */}
              {index < steps.length - 1 && (
                <div className="flex-1 mx-4">
                  <div className="h-1 bg-muted rounded-full overflow-hidden">
                    <div 
                      className={cn(
                        "h-full bg-primary transition-all duration-500 ease-out",
                        isCompleted ? "w-full" : "w-0"
                      )}
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Mobile stepper */}
      <div className="sm:hidden">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-medium text-muted-foreground">
            Step {currentStep} of {steps.length}
          </span>
          <span className="text-sm font-semibold text-primary">
            {steps.find(s => s.id === currentStep)?.label}
          </span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div 
            className="h-full bg-primary transition-all duration-300 ease-out"
            style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
          />
        </div>
        <div className="flex justify-between mt-2">
          {steps.map((step) => (
            <button
              key={step.id}
              onClick={() => step.id < currentStep && onStepClick?.(step.id)}
              disabled={step.id >= currentStep}
              className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-all",
                currentStep > step.id && "bg-primary text-primary-foreground cursor-pointer",
                currentStep === step.id && "bg-primary text-primary-foreground ring-2 ring-primary/30",
                currentStep < step.id && "bg-muted text-muted-foreground"
              )}
            >
              {currentStep > step.id ? <Check className="h-4 w-4" /> : step.id}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CheckoutStepper;
