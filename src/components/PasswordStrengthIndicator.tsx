import { useMemo } from "react";

interface PasswordStrengthIndicatorProps {
  password: string;
}

const PasswordStrengthIndicator = ({ password }: PasswordStrengthIndicatorProps) => {
  const strength = useMemo(() => {
    if (!password) return { level: 0, label: "", color: "" };

    let score = 0;

    // Length checks
    if (password.length >= 6) score += 1;
    if (password.length >= 8) score += 1;
    if (password.length >= 12) score += 1;

    // Character type checks
    if (/[a-z]/.test(password)) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^a-zA-Z0-9]/.test(password)) score += 1;

    if (score <= 2) {
      return { level: 1, label: "Weak Password", color: "bg-destructive" };
    } else if (score <= 4) {
      return { level: 2, label: "Medium Password", color: "bg-orange-500" };
    } else {
      return { level: 3, label: "Strong Password", color: "bg-green-500" };
    }
  }, [password]);

  if (!password) return null;

  return (
    <div className="mt-2 space-y-2">
      <div className="flex gap-1">
        {[1, 2, 3].map((level) => (
          <div
            key={level}
            className={`h-1.5 flex-1 rounded-full transition-colors ${
              level <= strength.level ? strength.color : "bg-muted"
            }`}
          />
        ))}
      </div>
      <p className={`text-xs font-medium ${
        strength.level === 1 ? "text-destructive" 
        : strength.level === 2 ? "text-orange-500" 
        : "text-green-500"
      }`}>
        {strength.label}
      </p>
    </div>
  );
};

export default PasswordStrengthIndicator;
