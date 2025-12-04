import { useEffect, useRef } from "react";

interface MediumRectangleAdProps {
  className?: string;
}

const MediumRectangleAd = ({ className = "" }: MediumRectangleAdProps) => {
  const adContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (adContainerRef.current) {
      const configScript = document.createElement('script');
      configScript.type = 'text/javascript';
      configScript.text = `
        atOptions = {
          'key' : 'c9f17600b2d7511fd74d329b27bcaefb',
          'format' : 'iframe',
          'height' : 250,
          'width' : 300,
          'params' : {}
        };
      `;
      
      const invokeScript = document.createElement('script');
      invokeScript.type = 'text/javascript';
      invokeScript.src = '//www.highperformanceformat.com/c9f17600b2d7511fd74d329b27bcaefb/invoke.js';
      
      adContainerRef.current.appendChild(configScript);
      adContainerRef.current.appendChild(invokeScript);
    }
  }, []);

  return (
    <div className={`w-full flex justify-center my-4 ${className}`}>
      <div ref={adContainerRef} className="max-w-[300px]" />
    </div>
  );
};

export default MediumRectangleAd;
