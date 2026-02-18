"use client";

import { Wallet, LogOut, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useWallet } from "@/lib/wallet-context";
import Link from "next/link";

function truncateAddress(addr: string) {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

export function WalletButton() {
  const { user, isConnecting, isConnected, connectWallet, disconnectWallet } = useWallet();

  if (isConnecting) {
    return (
      <Button variant="outline" disabled data-testid="button-wallet-connecting">
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        Connecting...
      </Button>
    );
  }

  if (isConnected && user) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="gap-2" data-testid="button-wallet-menu">
            <Avatar className="w-6 h-6">
              <AvatarFallback className="text-[10px] bg-primary text-primary-foreground">
                {user.username.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium hidden sm:inline">
              {truncateAddress(user.walletAddress)}
            </span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <Link href={`/contributors/${user.id}`}>
            <DropdownMenuItem className="cursor-pointer" data-testid="link-my-profile">
              My Profile
            </DropdownMenuItem>
          </Link>
          <DropdownMenuItem
            onClick={disconnectWallet}
            className="cursor-pointer text-destructive"
            data-testid="button-disconnect-wallet"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Disconnect
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <Button onClick={connectWallet} data-testid="button-connect-wallet" className="gap-2">
      <Wallet className="w-4 h-4" />
      Connect Wallet
    </Button>
  );
}
