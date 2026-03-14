import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import NProgress from "nprogress";
import "nprogress/nprogress.css";

NProgress.configure({ showSpinner: false, minimum: 0.15 });

// Start progress when an in-app link is clicked; finish when location changes (Bug #8: visible when switching Human/Pet).
const RouteChangeProgress = () => {
  const location = useLocation();

  useEffect(() => {
    NProgress.done();
  }, [location.pathname, location.search, location.hash]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const anchor = target.closest("a");
      if (!anchor || anchor.target === "_blank" || !anchor.getAttribute("href")?.startsWith("/")) return;
      NProgress.start();
    };
    document.addEventListener("click", handleClick, true);
    return () => document.removeEventListener("click", handleClick, true);
  }, []);

  return null;
};

export default RouteChangeProgress;
