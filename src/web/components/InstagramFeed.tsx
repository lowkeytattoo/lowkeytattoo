import { useEffect, useRef } from "react";

const InstagramFeed = () => {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          observer.disconnect();
          // Only inject the script if it hasn't been loaded yet
          if (!document.querySelector('script[src*="elfsightcdn.com/platform.js"]')) {
            const script = document.createElement("script");
            script.src = "https://elfsightcdn.com/platform.js";
            script.async = true;
            document.body.appendChild(script);
          } else if (window.eapps) {
            // Script already present — re-init any pending widgets
            window.eapps?.AppsManager?.initAll?.();
          }
        }
      },
      { rootMargin: "200px" }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} className="pt-8 pb-14 md:pt-10 md:pb-20 border-t border-border">
      <div className="max-w-7xl mx-auto px-6">
        <div className="relative">
          <div
            className="elfsight-app-755d111e-72eb-4329-b649-a7b85c5a9c00"
            data-elfsight-app-lazy
          />
          <div className="absolute bottom-0 left-0 right-0 h-12 bg-background pointer-events-none" />
        </div>
      </div>
    </section>
  );
};

export default InstagramFeed;
