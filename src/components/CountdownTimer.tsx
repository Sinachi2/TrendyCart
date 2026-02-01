import { useState, useEffect, useCallback } from "react";
import { Clock } from "lucide-react";

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  total: number;
}

interface CountdownTimerProps {
  expiresAt: Date | string;
  onExpire?: () => void;
  variant?: "default" | "compact" | "badge";
  showIcon?: boolean;
  className?: string;
}

const CountdownTimer = ({
  expiresAt,
  onExpire,
  variant = "default",
  showIcon = true,
  className = "",
}: CountdownTimerProps) => {
  const calculateTimeLeft = useCallback((): TimeLeft => {
    const endTime = new Date(expiresAt).getTime();
    const now = Date.now();
    const total = endTime - now;

    if (total <= 0) {
      return { days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 };
    }

    return {
      days: Math.floor(total / (1000 * 60 * 60 * 24)),
      hours: Math.floor((total / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((total / 1000 / 60) % 60),
      seconds: Math.floor((total / 1000) % 60),
      total,
    };
  }, [expiresAt]);

  const [timeLeft, setTimeLeft] = useState<TimeLeft>(calculateTimeLeft());
  const [hasExpired, setHasExpired] = useState(false);

  useEffect(() => {
    if (hasExpired) return;

    const timer = setInterval(() => {
      const newTimeLeft = calculateTimeLeft();
      setTimeLeft(newTimeLeft);

      if (newTimeLeft.total <= 0 && !hasExpired) {
        setHasExpired(true);
        onExpire?.();
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [calculateTimeLeft, hasExpired, onExpire]);

  if (hasExpired || timeLeft.total <= 0) {
    return (
      <div className={`text-destructive font-medium ${className}`}>
        Deal Expired
      </div>
    );
  }

  const isUrgent = timeLeft.total < 1000 * 60 * 60; // Less than 1 hour
  const isVeryUrgent = timeLeft.total < 1000 * 60 * 30; // Less than 30 minutes

  const formatNumber = (num: number) => num.toString().padStart(2, "0");

  if (variant === "badge") {
    return (
      <div
        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
          isVeryUrgent
            ? "bg-destructive text-destructive-foreground animate-pulse"
            : isUrgent
            ? "bg-orange-500 text-white"
            : "bg-primary text-primary-foreground"
        } ${className}`}
      >
        {showIcon && <Clock className="h-3 w-3" />}
        {timeLeft.days > 0 && `${timeLeft.days}d `}
        {formatNumber(timeLeft.hours)}:{formatNumber(timeLeft.minutes)}:
        {formatNumber(timeLeft.seconds)}
      </div>
    );
  }

  if (variant === "compact") {
    return (
      <div
        className={`flex items-center gap-1 text-sm font-medium ${
          isVeryUrgent
            ? "text-destructive"
            : isUrgent
            ? "text-orange-500"
            : "text-primary"
        } ${className}`}
      >
        {showIcon && <Clock className="h-4 w-4" />}
        <span>
          {timeLeft.days > 0 && `${timeLeft.days}d `}
          {formatNumber(timeLeft.hours)}:{formatNumber(timeLeft.minutes)}:
          {formatNumber(timeLeft.seconds)}
        </span>
      </div>
    );
  }

  // Default variant - full display with boxes
  return (
    <div className={`${className}`}>
      <div className="flex items-center gap-2 mb-2">
        {showIcon && (
          <Clock
            className={`h-5 w-5 ${
              isVeryUrgent
                ? "text-destructive animate-pulse"
                : isUrgent
                ? "text-orange-500"
                : "text-primary"
            }`}
          />
        )}
        <span
          className={`text-sm font-medium ${
            isVeryUrgent
              ? "text-destructive"
              : isUrgent
              ? "text-orange-500"
              : "text-muted-foreground"
          }`}
        >
          {isVeryUrgent ? "Ending Soon!" : isUrgent ? "Almost Gone!" : "Ends in"}
        </span>
      </div>
      <div className="flex gap-2">
        {timeLeft.days > 0 && (
          <div
            className={`flex flex-col items-center justify-center px-3 py-2 rounded-lg ${
              isVeryUrgent
                ? "bg-destructive text-destructive-foreground"
                : isUrgent
                ? "bg-orange-500 text-white"
                : "bg-primary/10 text-primary"
            }`}
          >
            <span className="text-xl font-bold">{timeLeft.days}</span>
            <span className="text-xs uppercase">Days</span>
          </div>
        )}
        <div
          className={`flex flex-col items-center justify-center px-3 py-2 rounded-lg ${
            isVeryUrgent
              ? "bg-destructive text-destructive-foreground"
              : isUrgent
              ? "bg-orange-500 text-white"
              : "bg-primary/10 text-primary"
          }`}
        >
          <span className="text-xl font-bold">{formatNumber(timeLeft.hours)}</span>
          <span className="text-xs uppercase">Hrs</span>
        </div>
        <div
          className={`flex flex-col items-center justify-center px-3 py-2 rounded-lg ${
            isVeryUrgent
              ? "bg-destructive text-destructive-foreground"
              : isUrgent
              ? "bg-orange-500 text-white"
              : "bg-primary/10 text-primary"
          }`}
        >
          <span className="text-xl font-bold">{formatNumber(timeLeft.minutes)}</span>
          <span className="text-xs uppercase">Min</span>
        </div>
        <div
          className={`flex flex-col items-center justify-center px-3 py-2 rounded-lg ${
            isVeryUrgent
              ? "bg-destructive text-destructive-foreground animate-pulse"
              : isUrgent
              ? "bg-orange-500 text-white"
              : "bg-primary/10 text-primary"
          }`}
        >
          <span className="text-xl font-bold">{formatNumber(timeLeft.seconds)}</span>
          <span className="text-xs uppercase">Sec</span>
        </div>
      </div>
    </div>
  );
};

export default CountdownTimer;
