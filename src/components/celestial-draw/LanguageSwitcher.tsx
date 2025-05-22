"use client";
import { useLocalization, type Locale } from '@/hooks/useLocalization';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Globe } from 'lucide-react';

export function LanguageSwitcher() {
  const { locale, setLocale, t } = useLocalization();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="w-full justify-start">
          <Globe className="mr-2 h-4 w-4" />
          {locale === 'en' ? t('english') : t('hungarian')}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56">
        <DropdownMenuRadioGroup value={locale} onValueChange={(value) => setLocale(value as Locale)}>
          <DropdownMenuRadioItem value="en">{t('english')}</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="hu">{t('hungarian')}</DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
