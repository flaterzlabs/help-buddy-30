import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { RefreshCw } from "lucide-react";

interface StudentAvatarProps {
  username: string;
  size?: number;
}

export function StudentAvatar({ username, size = 120 }: StudentAvatarProps) {
  const [seed, setSeed] = useState(() => {
    const saved = localStorage.getItem(`avatar-seed-${username}`);
    return saved || Math.random().toString(36).substring(7);
  });

  const refreshAvatar = () => {
    const newSeed = Math.random().toString(36).substring(7);
    setSeed(newSeed);
    localStorage.setItem(`avatar-seed-${username}`, newSeed);
  };

  const avatarUrl = `https://api.dicebear.com/7.x/fun-emoji/svg?seed=${seed}&size=${size}`;

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative">
        <img 
          src={avatarUrl} 
          alt={`Avatar de ${username}`}
          className="rounded-full shadow-soft border-4 border-primary/20"
          width={size}
          height={size}
        />
        <Button
          variant="outline"
          size="icon"
          onClick={refreshAvatar}
          className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full bg-background shadow-medium"
          title="Mudar avatar"
        >
          <RefreshCw className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}