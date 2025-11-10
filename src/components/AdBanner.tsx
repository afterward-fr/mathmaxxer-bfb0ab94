import { useEffect } from "react";

interface AdBannerProps {
  className?: string;
}

const AdBanner = ({ className = "" }: AdBannerProps) => {
  useEffect(() => {
    try {
      // Push ad after a short delay to ensure script is loaded
      const timer = setTimeout(() => {
        if (window.adsbygoogle) {
          (window.adsbygoogle = window.adsbygoogle || []).push({});
        }
      }, 100);

      return () => clearTimeout(timer);
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error("Ad initialization error:", error);
      }
    }
  }, []);

  return (
    <div className={`w-full flex justify-center my-4 ${className}`}>
      <ins
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client="ca-pub-4537661693233495"
        data-ad-slot="4896606636"
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
};

// Extend Window interface for TypeScript
declare global {
  interface Window {
    adsbygoogle: any;
  }
}

export default AdBanner;
