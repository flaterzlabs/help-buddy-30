import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users } from "lucide-react";

interface LoginFormProps {
  onLogin: (username: string) => void;
  onShowRoleSelector: () => void;
}

export function LoginForm({ onLogin, onShowRoleSelector }: LoginFormProps) {
  const [username, setUsername] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim()) {
      onLogin(username.trim());
    }
  };

  return (
    <div className="min-h-screen bg-gradient-primary flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-6">
          <div className="mx-auto w-20 h-20 bg-gradient-warm rounded-full flex items-center justify-center shadow-large">
            <Users size={40} className="text-warning-foreground" />
          </div>
          <div>
            <h1 className="text-4xl font-bold text-primary-foreground mb-2">
              Help Buddy
            </h1>
            <p className="text-primary-foreground/80 text-lg">
              Seu amigo para pedir ajuda
            </p>
          </div>
        </div>

        <Card className="shadow-large border-2 border-primary/20">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-2xl">Entrar</CardTitle>
            <CardDescription className="text-buddy text-muted-foreground">
              Digite seu nome para começar
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Input
                  type="text"
                  placeholder="Seu nome"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="h-14 text-lg focus-ring border-2"
                  required
                />
              </div>
              
              <Button 
                type="submit" 
                variant="default"
                size="lg"
                className="w-full"
                disabled={!username.trim()}
              >
                Entrar
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground mb-4">
                Primeira vez aqui?
              </p>
              <Button
                variant="outline"
                onClick={onShowRoleSelector}
                className="w-full"
              >
                Criar conta
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="text-center text-primary-foreground/60 text-sm">
          <p>Feito com ❤️ para crianças especiais</p>
        </div>
      </div>
    </div>
  );
}