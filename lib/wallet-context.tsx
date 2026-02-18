"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import type { User } from "@/shared/schema";
import { apiRequest, queryClient } from "./queryClient";

type WalletContextType = {
  user: User | null;
  isConnecting: boolean;
  isConnected: boolean;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
};

const WalletContext = createContext<WalletContextType>({
  user: null,
  isConnecting: false,
  isConnected: false,
  connectWallet: async () => {},
  disconnectWallet: () => {},
});

function generateWalletAddress(): string {
  const chars = "0123456789abcdef";
  let addr = "0x";
  for (let i = 0; i < 40; i++) {
    addr += chars[Math.floor(Math.random() * chars.length)];
  }
  return addr;
}

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  const connectWallet = useCallback(async () => {
    setIsConnecting(true);
    try {
      await new Promise((r) => setTimeout(r, 800));
      const walletAddress = generateWalletAddress();
      const res = await apiRequest("POST", "/api/auth/connect", { walletAddress });
      const data = await res.json();
      setUser(data.user);
      localStorage.setItem("walletAddress", walletAddress);
      queryClient.invalidateQueries({ queryKey: ["/api/members"] });
      queryClient.invalidateQueries({ queryKey: ["/api/activities"] });
    } catch (e) {
      console.error("Wallet connection failed:", e);
    } finally {
      setIsConnecting(false);
    }
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem("walletAddress");
    if (stored) {
      fetch(`/api/auth/session`, { credentials: "include" })
        .then((r) => {
          if (r.ok) return r.json();
          throw new Error("No session");
        })
        .then((data) => {
          if (data.user) setUser(data.user);
          else localStorage.removeItem("walletAddress");
        })
        .catch(() => {
          localStorage.removeItem("walletAddress");
          if (!user && !isConnecting) {
            connectWallet();
          }
        });
    } else if (!user && !isConnecting) {
      connectWallet();
    }
  }, [connectWallet, user, isConnecting]);

  const disconnectWallet = useCallback(() => {
    setUser(null);
    localStorage.removeItem("walletAddress");
    fetch("/api/auth/disconnect", { method: "POST", credentials: "include" });
  }, []);

  return (
    <WalletContext.Provider
      value={{
        user,
        isConnecting,
        isConnected: !!user,
        connectWallet,
        disconnectWallet,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export const useWallet = () => useContext(WalletContext);
