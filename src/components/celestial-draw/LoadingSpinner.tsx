"use client";
import type { SVGProps } from 'react';
import { cn } from "@/lib/utils";

export function LoadingSpinner({ text, className, ...props }: SVGProps<SVGSVGElement> & { text?: string }) {
  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center z-50">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="48"
        height="48"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={cn("animate-spin text-primary", className)}
        {...props}
      >
        <path d="M21 12a9 9 0 1 1-6.219-8.56" />
      </svg>
      {text && <p className="mt-4 text-lg text-foreground">{text}</p>}
    </div>
  );
}
