import { useEffect, useRef, useId } from "react";

interface BannerAdProps {
  className?: string;
}

const BannerAd = ({ className = "" }: BannerAdProps) => {
  const adContainerRef = useRef<HTMLDivElement>(null);
  const uniqueId = useId().replace(/:/g, '');
  const loadedRef = useRef(false);

  useEffect(() => {
    if (loadedRef.current || !adContainerRef.current) return;
    loadedRef.current = true;

    const container = adContainerRef.current;
    
    // Clear any existing content
    container.innerHTML = '';

    // Create a unique variable name for this instance
    const optionsVarName = `atOptions_${uniqueId}`;
    
    const configScript = document.createElement('script');
    configScript.type = 'text/javascript';
    configScript.text = `
      window['${optionsVarName}'] = {
        'key' : 'f71397735acd894e4d7a6e526bcf394e',
        'format' : 'iframe',
        'height' : 90,
        'width' : 728,
        'params' : {}
      };
      atOptions = window['${optionsVarName}'];
    `;
    
    container.appendChild(configScript);

    const invokeScript = document.createElement('script');
    invokeScript.type = 'text/javascript';
    invokeScript.src = '//www.highperformanceformat.com/f71397735acd894e4d7a6e526bcf394e/invoke.js';
    invokeScript.async = true;
    
    container.appendChild(invokeScript);

    return () => {
      if (container) {
        container.innerHTML = '';
      }
    };
  }, [uniqueId]);

  return (
    <div className={`w-full flex justify-center my-4 ${className}`}>
      <div 
        ref={adContainerRef} 
        className="max-w-[728px] w-full min-h-[90px] flex items-center justify-center bg-muted/20 rounded"
      />
    </div>
  );
};

export default BannerAd;
