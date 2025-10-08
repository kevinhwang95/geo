import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Globe } from 'lucide-react';

const GlobalLanguageSwitcher: React.FC = () => {
  const { i18n, t } = useTranslation();

  const languages = [
    { code: 'en', name: t('language.english'), flag: '🇺🇸' },
    { code: 'th', name: t('language.thai'), flag: '🇹🇭' },
  ];

  const changeLanguage = (languageCode: string) => {
    i18n.changeLanguage(languageCode);
  };

  const currentLanguage = languages.find(lang => lang.code === i18n.language) || languages[0];

  return (
    <div className="fixed top-4 right-4 z-50 max-w-[calc(100vw-2rem)]">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="outline" 
            size="sm" 
            className="flex items-center gap-1 sm:gap-2 bg-white/90 backdrop-blur-sm shadow-lg border-white/50 hover:bg-white hover:shadow-xl transition-all duration-200 max-w-full"
          >
            <Globe className="h-4 w-4 flex-shrink-0" />
            <span className="text-lg flex-shrink-0">{currentLanguage.flag}</span>
            <span className="hidden sm:inline font-medium truncate">{currentLanguage.name}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48 shadow-xl max-w-[calc(100vw-2rem)]">
          {languages.map((language) => (
            <DropdownMenuItem
              key={language.code}
              onClick={() => changeLanguage(language.code)}
              className={`flex items-center gap-3 cursor-pointer p-3 ${
                i18n.language === language.code ? 'bg-accent' : ''
              }`}
            >
              <span className="text-lg flex-shrink-0">{language.flag}</span>
              <span className="font-medium truncate">{language.name}</span>
              {i18n.language === language.code && (
                <span className="ml-auto text-xs text-muted-foreground flex-shrink-0">✓</span>
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default GlobalLanguageSwitcher;
