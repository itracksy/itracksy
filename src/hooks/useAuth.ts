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
    const storedUserId = localStorage.getItem("userId");
    if (storedUserId) {
      handleSignIn(storedUserId);
    } else {
      const newUserId = crypto.randomUUID();
      localStorage.setItem("userId", newUserId);
      handleSignIn(newUserId);
    }
  }, []);

  const handleSignIn = async (userId: string) => {
    try {
      await trpcClient.auth.signInAnonymously.mutate(userId);
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
