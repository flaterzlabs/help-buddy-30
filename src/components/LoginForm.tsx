
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, AlertCircle } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";

interface LoginFormProps {
  onLogin: (username: string) => void;
  onShowRoleSelector: () => void;
}

export function LoginForm({ onLogin, onShowRoleSelector }: LoginFormProps) {
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim()) {
      setError("");
      setIsLoading(true);
      
      try {
        // Normalizar username antes de enviar
        const normalizedUsername = username.trim().toLowerCase();
        await onLogin(normalizedUsername);
      } catch (error) {
        setError("Erro inesperado no login");
        console.error('Erro no login:', error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-primary flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-6">
          <div className="flex justify-end mb-4">
            <ThemeToggle />
          </div>
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
                  placeholder="Seu nome (ex: joão)"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    setError(""); // Limpar erro ao digitar
                  }}
                  className="h-14 text-lg focus-ring border-2"
                  required
                  disabled={isLoading}
                />
                {error && (
                  <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 p-3 rounded-lg">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                )}
              </div>
              
              <Button 
                type="submit" 
                variant="default"
                size="lg"
                className="w-full"
                disabled={!username.trim() || isLoading}
              >
                {isLoading ? "Entrando..." : "Entrar"}
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
                disabled={isLoading}
              >
                Criar conta
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="text-center text-primary-foreground/60 text-sm">
          <p>Feito com ❤️ para crianças especiais</p>
          <p className="text-xs mt-1 opacity-75">
            Dica: Use sempre letras minúsculas no nome
          </p>
        </div>
      </div>
    </div>
  );
}
