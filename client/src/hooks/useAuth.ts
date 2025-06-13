import { useQuery } from "@tanstack/react-query";

export function useAuth() {
  // This hook is now deprecated. Wallet auth is handled in App.tsx and landing.tsx.
  const { data: user, isLoading } = useQuery({
    queryKey: ["/api/auth/user"],
    retry: false,
  });

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
  };
}
