import { useEffect, useRef, useId } from "react";

interface SmallBannerAdProps {
  className?: string;
}

const SmallBannerAd = ({ className = "" }: SmallBannerAdProps) => {
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
        'key' : 'b7694a3b09982e9f6642e7084429e167',
        'format' : 'iframe',
        'height' : 60,
        'width' : 468,
        'params' : {}
      };
      atOptions = window['${optionsVarName}'];
    `;
    
    container.appendChild(configScript);

    const invokeScript = document.createElement('script');
    invokeScript.type = 'text/javascript';
    invokeScript.src = '//www.highperformanceformat.com/b7694a3b09982e9f6642e7084429e167/invoke.js';
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
        className="max-w-[468px] min-h-[60px] flex items-center justify-center bg-muted/20 rounded"
      />
    </div>
  );
};

export default SmallBannerAd;
