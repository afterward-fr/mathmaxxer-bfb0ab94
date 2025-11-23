import { useEffect, useRef } from "react";

interface BannerAdProps {
  className?: string;
}

const BannerAd = ({ className = "" }: BannerAdProps) => {
  const adContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (adContainerRef.current) {
      // Create and inject the ad configuration script
      const configScript = document.createElement('script');
      configScript.type = 'text/javascript';
      configScript.text = `
        atOptions = {
          'key' : 'f71397735acd894e4d7a6e526bcf394e',
          'format' : 'iframe',
          'height' : 90,
          'width' : 728,
          'params' : {}
        };
      `;
      
      // Create and inject the invoke script
      const invokeScript = document.createElement('script');
      invokeScript.type = 'text/javascript';
      invokeScript.src = '//www.highperformanceformat.com/f71397735acd894e4d7a6e526bcf394e/invoke.js';
      
      adContainerRef.current.appendChild(configScript);
      adContainerRef.current.appendChild(invokeScript);
    }
  }, []);

  return (
    <div className={`w-full flex justify-center my-4 ${className}`}>
      <div ref={adContainerRef} className="max-w-[728px] w-full" />
    </div>
  );
};

// Extend Window interface for TypeScript
declare global {
  interface Window {
    atOptions: any;
  }
}

export default BannerAd;
