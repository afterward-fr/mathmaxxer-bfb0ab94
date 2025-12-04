import { useEffect, useRef, useId } from "react";

interface MediumRectangleAdProps {
  className?: string;
}

const MediumRectangleAd = ({ className = "" }: MediumRectangleAdProps) => {
  const adContainerRef = useRef<HTMLDivElement>(null);
  const uniqueId = useId().replace(/:/g, '');
  const loadedRef = useRef(false);

  useEffect(() => {
    if (loadedRef.current || !adContainerRef.current) return;
    loadedRef.current = true;

    const container = adContainerRef.current;
    
    container.innerHTML = '';

    const optionsVarName = `atOptions_${uniqueId}`;
    
    const configScript = document.createElement('script');
    configScript.type = 'text/javascript';
    configScript.text = `
      window['${optionsVarName}'] = {
        'key' : 'c9f17600b2d7511fd74d329b27bcaefb',
        'format' : 'iframe',
        'height' : 250,
        'width' : 300,
        'params' : {}
      };
      atOptions = window['${optionsVarName}'];
    `;
    
    container.appendChild(configScript);

    const invokeScript = document.createElement('script');
    invokeScript.type = 'text/javascript';
    invokeScript.src = '//www.highperformanceformat.com/c9f17600b2d7511fd74d329b27bcaefb/invoke.js';
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
        className="max-w-[300px] min-h-[250px] flex items-center justify-center bg-muted/20 rounded"
      />
    </div>
  );
};

export default MediumRectangleAd;
