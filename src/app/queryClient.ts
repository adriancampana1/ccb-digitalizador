import { QueryClient } from "@tanstack/react-query";
import { registerSessionCleanup } from "../features/auth/sessionStore";
export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: 1, staleTime: 60000 },
      mutations: { retry: false },
    },
  });
}
export const queryClient = createQueryClient();
registerSessionCleanup(() => {
  void queryClient.cancelQueries();
  queryClient.clear();
});
