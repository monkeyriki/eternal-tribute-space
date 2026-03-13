import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { isNetworkError, FRIENDLY_NETWORK_MESSAGE } from "@/lib/networkError";

/**
 * Subscribes to React Query cache and shows a friendly toast when a query fails due to network.
 */
const GlobalNetworkErrorHandler = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    const cache = queryClient.getQueryCache();
    const unsub = cache.subscribe((event) => {
      if (event.type === "updated") {
        const query = event.query;
        const state = query.state;
        if (state.status === "error" && state.error && isNetworkError(state.error)) {
          toast.error(FRIENDLY_NETWORK_MESSAGE);
        }
      }
    });
    return unsub;
  }, [queryClient]);

  return null;
};

export default GlobalNetworkErrorHandler;
