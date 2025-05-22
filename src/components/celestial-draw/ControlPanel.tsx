"use client";
import { useLocalization } from '@/hooks/useLocalization';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LanguageSwitcher } from './LanguageSwitcher';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { Info } from 'lucide-react';

interface ControlPanelProps {
  maxNumber: number;
  setMaxNumber: (value: number) => void;
  numToDraw: number;
  setNumToDraw: (value: number) => void;
  onStartDraw: () => void;
  isDrawing: boolean;
}

export function ControlPanel({
  maxNumber,
  setMaxNumber,
  numToDraw,
  setNumToDraw,
  onStartDraw,
  isDrawing,
}: ControlPanelProps) {
  const { t } = useLocalization();

  return (
    <TooltipProvider>
      <div className="p-4 space-y-6">
        <div>
          <div className="flex items-center justify-between mb-1">
            <Label htmlFor="maxNumber">{t('maxNumber')}</Label>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-4 w-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent>
                <p>{t('maxNumberTooltip')}</p>
              </TooltipContent>
            </Tooltip>
          </div>
          <Input
            id="maxNumber"
            type="number"
            value={maxNumber}
            onChange={(e) => setMaxNumber(Math.max(10, parseInt(e.target.value, 10) || 10))}
            min="10"
            max="1000" // Practical limit for performance without InstancedMesh
            className="bg-input"
            disabled={isDrawing}
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <Label htmlFor="numToDraw">{t('numbersToDraw')}</Label>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-4 w-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent>
                <p>{t('numbersToDrawTooltip')}</p>
              </TooltipContent>
            </Tooltip>
          </div>
          <Input
            id="numToDraw"
            type="number"
            value={numToDraw}
            onChange={(e) => {
              const val = parseInt(e.target.value, 10);
              setNumToDraw(Math.max(1, Math.min(10, val || 1)));
            }}
            min="1"
            max="10"
            className="bg-input"
            disabled={isDrawing}
          />
        </div>

        <Button onClick={onStartDraw} disabled={isDrawing} className="w-full bg-accent hover:bg-accent/90 text-accent-foreground">
          {isDrawing ? t('drawingInProgress') : t('startDraw')}
        </Button>

        <Separator />

        <div>
          <Label className="block mb-2">{t('language')}</Label>
          <LanguageSwitcher />
        </div>
      </div>
    </TooltipProvider>
  );
}
