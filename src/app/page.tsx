
"use client";

import { useState, useEffect, useCallback } from 'react';
import { SidebarProvider, Sidebar, SidebarInset, SidebarTrigger, SidebarHeader, SidebarContent, SidebarFooter } from '@/components/ui/sidebar';
import { ControlPanel } from '@/components/celestial-draw/ControlPanel';
import { ParticleCanvas } from '@/components/celestial-draw/ParticleCanvas';
import { LoadingSpinner } from '@/components/celestial-draw/LoadingSpinner';
import { useLocalization } from '@/hooks/useLocalization';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PanelLeft } from 'lucide-react';

export default function CelestialDrawPage() {
  const { t } = useLocalization();
  const [isLoading, setIsLoading] = useState(true);
  const [maxNumber, setMaxNumber] = useState(90);
  const [numToDraw, setNumToDraw] = useState(5);
  const [drawnNumbers, setDrawnNumbers] = useState<number[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  
  // Ensure context is ready
  const [isLocalizationReady, setIsLocalizationReady] = useState(false);
  useEffect(() => {
    if (t && typeof t === 'function') {
      setIsLocalizationReady(true);
    }
  }, [t]);


  const handleDrawStart = () => {
    setDrawnNumbers([]);
    setIsDrawing(true); 
    // ParticleCanvas will pick up isDrawingActive=true and start its animation
  };

  const handleNumbersDrawn = useCallback((numbers: number[]) => {
    setDrawnNumbers(numbers);
    setIsDrawing(false);
  },[]);

  const handleSceneLoaded = useCallback(() => {
    setIsLoading(false);
  },[]);

  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  if (!isLocalizationReady) {
     // Or a more specific loader for localization
    return <LoadingSpinner text="Loading Celestial Interface..." />;
  }

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="min-h-screen flex flex-col bg-background text-foreground">
        <Sidebar collapsible="icon" variant="sidebar" className="border-r border-sidebar-border shadow-lg">
          <SidebarHeader className="p-4 border-b border-sidebar-border">
            <h1 className="text-2xl font-bold text-primary whitespace-nowrap overflow-hidden text-ellipsis">
              {t('celestialDraw')}
            </h1>
          </SidebarHeader>
          <SidebarContent>
            <ControlPanel
              maxNumber={maxNumber}
              setMaxNumber={setMaxNumber}
              numToDraw={numToDraw}
              setNumToDraw={setNumToDraw}
              onStartDraw={handleDrawStart}
              isDrawing={isDrawing}
              isLoadingScene={isLoading}
            />
          </SidebarContent>
          <SidebarFooter className="p-4 mt-auto border-t border-sidebar-border">
            <p className="text-xs text-muted-foreground text-center">
              &copy; {new Date().getFullYear()} Celestial Draw
            </p>
          </SidebarFooter>
        </Sidebar>

        <SidebarInset>
          <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-md p-2 md:p-4 flex items-center justify-between md:justify-end h-16 border-b">
            <div className="md:hidden">
              <SidebarTrigger aria-label={t('sidebarToggle')}>
                <PanelLeft />
              </SidebarTrigger>
            </div>
            {/* Placeholder for potential top-right actions like user profile, theme toggle */}
          </header>
          <main className="flex-1 relative p-4 md:p-6 overflow-auto">
            {isLoading && <LoadingSpinner text={t('loading')} />}
            <div 
              className={`transition-opacity duration-1000 ${isLoading ? 'opacity-0' : 'opacity-100'} w-full h-[calc(80vh-64px)] min-h-[400px] md:min-h-[500px] rounded-xl overflow-hidden shadow-2xl border border-border`}
              style={{ height: 'calc(max(400px, 100vh - 200px - 64px))' }} // Dynamic height considering header and results card
            >
              <ParticleCanvas
                maxNumber={maxNumber}
                numToDraw={numToDraw}
                onNumbersDrawn={handleNumbersDrawn}
                onSceneLoaded={handleSceneLoaded}
                isDrawingActive={isDrawing}
              />
            </div>
            {drawnNumbers.length > 0 && !isDrawing && (
              <Card className="mt-6 max-w-lg mx-auto shadow-xl bg-card/90 backdrop-blur-sm border-accent">
                <CardHeader>
                  <CardTitle className="text-center text-2xl font-semibold text-accent">{t('luckyNumbers')}</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-wrap justify-center gap-3 p-6">
                  {drawnNumbers.map((num, index) => (
                    <div 
                      key={index} 
                      className="text-3xl font-bold w-16 h-16 flex items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transform transition-all duration-300 ease-out hover:scale-110"
                      style={{ animation: `fadeInUp 0.5s ${index * 0.1}s ease-out forwards`, opacity: 0 }}
                      >
                      {num}
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </main>
        </SidebarInset>
      </div>
      <style jsx global>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </SidebarProvider>
  );
}
