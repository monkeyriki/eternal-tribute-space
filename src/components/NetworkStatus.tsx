import { useEffect, useRef } from "react";
import { toast } from "sonner";

const OFFLINE_TOAST_ID = "network-offline";

const NetworkStatus = () => {
  const wasOffline = useRef(false);

  useEffect(() => {
    const handleOffline = () => {
      wasOffline.current = true;
      toast.error("You are offline. Please check your internet connection.", {
        id: OFFLINE_TOAST_ID,
        duration: Number.POSITIVE_INFINITY,
      });
    };

    const handleOnline = () => {
      if (wasOffline.current) {
        toast.dismiss(OFFLINE_TOAST_ID);
        toast.success("You are back online!");
        wasOffline.current = false;
      }
    };

    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);

    if (!navigator.onLine) handleOffline();

    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
    };
  }, []);

  return null;
};

export default NetworkStatus;
