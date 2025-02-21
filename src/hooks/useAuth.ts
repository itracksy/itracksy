import { useEffect, useState } from "react";
import { trpcClient } from "@/utils/trpc";

export type User = {
  id: string;
};

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get or create anonymous user ID from local storage
    handleSignIn();
  }, []);

  const handleSignIn = async () => {
    try {
      const { userId } = await trpcClient.auth.signInAnonymously.mutate();
      setUser({ id: userId });
    } catch (error) {
      console.error("Error signing in:", error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      localStorage.removeItem("userId");
      setUser(null);
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return {
    user,
    loading,
    signOut,
  };
}
