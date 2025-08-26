import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { ThemeToggle } from "@/components/ThemeToggle";
import { User, LogIn, UserPlus, Heart } from "lucide-react";

type UserRole = 'student' | 'parent' | 'educator';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [role, setRole] = useState<UserRole>("student");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Verificar se usuário já está logado
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate("/");
      }
    };
    checkUser();
  }, [navigate]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;
        
        toast.success("Login realizado com sucesso! 🎉");
        navigate("/");
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: {
              username,
              role,
            }
          }
        });

        if (error) throw error;

        if (data.user) {
          // Criar profile do usuário
          const connectionCode = role === 'student' ? 
            await generateConnectionCode() : null;

          const { error: profileError } = await supabase
            .from('profiles')
            .insert({
              user_id: data.user.id,
              username,
              role,
              connection_code: connectionCode
            });

          if (profileError) throw profileError;

          toast.success("Conta criada com sucesso! 🎉", {
            description: "Faça login para continuar"
          });
          setIsLogin(true);
        }
      }
    } catch (error: any) {
      console.error('Erro de autenticação:', error);
      
      if (error.message?.includes('User already registered')) {
        toast.error("Este email já está cadastrado", {
          description: "Tente fazer login ou use outro email"
        });
      } else if (error.message?.includes('Invalid login credentials')) {
        toast.error("Email ou senha incorretos", {
          description: "Verifique suas credenciais e tente novamente"
        });
      } else {
        toast.error("Erro na autenticação", {
          description: error.message || "Tente novamente"
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const generateConnectionCode = async (): Promise<string> => {
    const { data, error } = await supabase.rpc('generate_connection_code');
    if (error) throw error;
    return data;
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
              <Heart className="w-8 h-8 text-primary" />
            </div>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Help Buddy</h1>
            <p className="text-muted-foreground">
              Conectando alunos, pais e educadores
            </p>
          </div>
          <div className="flex justify-center">
            <ThemeToggle />
          </div>
        </div>

        {/* Auth Form */}
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle className="text-center">
              {isLogin ? "Fazer Login" : "Criar Conta"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={isLogin ? "login" : "signup"} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger 
                  value="login" 
                  onClick={() => setIsLogin(true)}
                  className="flex items-center gap-2"
                >
                  <LogIn className="w-4 h-4" />
                  Login
                </TabsTrigger>
                <TabsTrigger 
                  value="signup" 
                  onClick={() => setIsLogin(false)}
                  className="flex items-center gap-2"
                >
                  <UserPlus className="w-4 h-4" />
                  Cadastro
                </TabsTrigger>
              </TabsList>

              <TabsContent value="login" className="space-y-4 mt-6">
                <form onSubmit={handleAuth} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="seu@email.com"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Senha</Label>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={loading}
                  >
                    {loading ? "Entrando..." : "Entrar"}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup" className="space-y-4 mt-6">
                <form onSubmit={handleAuth} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-username">Nome de usuário</Label>
                    <Input
                      id="signup-username"
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Seu nome"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="role">Você é:</Label>
                    <Select value={role} onValueChange={(value: UserRole) => setRole(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="student">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4" />
                            Aluno
                          </div>
                        </SelectItem>
                        <SelectItem value="parent">
                          <div className="flex items-center gap-2">
                            <Heart className="w-4 h-4" />
                            Pai/Mãe
                          </div>
                        </SelectItem>
                        <SelectItem value="educator">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4" />
                            Educador
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="seu@email.com"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Senha</Label>
                    <Input
                      id="signup-password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      minLength={6}
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={loading}
                  >
                    {loading ? "Criando conta..." : "Criar conta"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground">
          Ao continuar, você concorda com nossos termos de uso
        </p>
      </div>
    </div>
  );
}