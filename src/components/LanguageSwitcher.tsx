import { Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLanguage, languageNames, languageFlags, type Language } from "@/hooks/useLanguage";
import { cn } from "@/lib/utils";

const LanguageSwitcher = () => {
  const { language, setLanguage } = useLanguage();

  const languages: Language[] = ["en", "fr", "es", "pt", "zh"];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="hover:bg-muted/50" aria-label="Change language">
          <Globe className="h-5 w-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang}
            onClick={() => setLanguage(lang)}
            className={cn(
              "cursor-pointer gap-3",
              language === lang && "bg-primary/10 text-primary font-medium"
            )}
          >
            <span className="text-lg">{languageFlags[lang]}</span>
            <span>{languageNames[lang]}</span>
            {language === lang && (
              <span className="ml-auto text-xs text-primary">✓</span>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default LanguageSwitcher;
