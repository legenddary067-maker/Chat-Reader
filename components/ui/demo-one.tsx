import React from "react";
import { Hero195 } from "@/components/ui/hero-195";

interface DemoOneProps {
  onPasteSubmit: (text: string) => void;
  onFileUpload: (file: File) => void;
  onLoadSample: (sampleType: 'hackathon' | 'family') => void;
  errorText?: string;
}

const DemoOne = ({ onPasteSubmit, onFileUpload, onLoadSample, errorText }: DemoOneProps) => {
  return (
    <Hero195 
      onPasteSubmit={onPasteSubmit}
      onFileUpload={onFileUpload}
      onLoadSample={onLoadSample}
      errorText={errorText}
    />
  );
};

export { DemoOne };
