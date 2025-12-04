import { useEffect, useRef } from "react";

interface SmallBannerAdProps {
  className?: string;
}

const SmallBannerAd = ({ className = "" }: SmallBannerAdProps) => {
  const adContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (adContainerRef.current) {
      const configScript = document.createElement('script');
      configScript.type = 'text/javascript';
      configScript.text = `
        atOptions = {
          'key' : 'b7694a3b09982e9f6642e7084429e167',
          'format' : 'iframe',
          'height' : 60,
          'width' : 468,
          'params' : {}
        };
      `;
      
      const invokeScript = document.createElement('script');
      invokeScript.type = 'text/javascript';
      invokeScript.src = '//www.highperformanceformat.com/b7694a3b09982e9f6642e7084429e167/invoke.js';
      
      adContainerRef.current.appendChild(configScript);
      adContainerRef.current.appendChild(invokeScript);
    }
  }, []);

  return (
    <div className={`w-full flex justify-center my-4 ${className}`}>
      <div ref={adContainerRef} className="max-w-[468px]" />
    </div>
  );
};

export default SmallBannerAd;
