import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ThriveSprite } from "@/components/ThriveSprite";
import { useCustomAuth } from "@/hooks/useCustomAuth";
import { User, LogIn, UserPlus, Heart, Eye, EyeOff } from "lucide-react";

type UserRole = 'student' | 'parent' | 'educator';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("student");
  const [loading, setLoading] = useState(false);
  const [showAvatarSelection, setShowAvatarSelection] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState<string>("");
  const [showPassword, setShowPassword] = useState(false);

  const { login, register } = useCustomAuth();
  const navigate = useNavigate();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const result = await login(username, password);

        if (result.success) {
          toast.success("Login realizado com sucesso! 🎉");
          navigate("/");
        } else {
          toast.error(result.error || "Erro no login");
        }
      } else {
        if (role === 'student' && !selectedAvatar) {
          setShowAvatarSelection(true);
          setLoading(false);
          return;
        }

        const result = await register(username, role, password, selectedAvatar);

        if (result.success) {
          toast.success("Conta criada com sucesso! 🎉");
          navigate("/");
        } else {
          toast.error(result.error || "Erro no cadastro");
        }
      }
    } catch (error: any) {
      console.error('Erro de autenticação:', error);
      toast.error("Erro no servidor");
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarSelect = (avatarUrl: string) => {
    setSelectedAvatar(avatarUrl);
    setShowAvatarSelection(false);
    setTimeout(() => {
      register(username, role, password, avatarUrl).then(result => {
        if (result.success) {
          toast.success("Conta criada com sucesso! 🎉");
          navigate("/");
        } else {
          toast.error(result.error || "Erro no cadastro");
        }
      });
    }, 500);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative">

      {/* Botão de tema no canto superior direito */}
      <div className="absolute top-8 right-8 z-10">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-lg space-y-6">

        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex justify-center">
          </div>

          <div className="flex-col items-center gap-4">
            {/* Adicionado 'mb-2' para espaçamento entre o título e o parágrafo */}
            <h1 className="text-6xl font-bold text-foreground mb-4">Help Buddy</h1>
            <p className="text-2xl text-muted-foreground">
              Conectando alunos, pais e educadores
            </p>
          </div>
        </div>

        {/* Seleção de Avatar para Estudantes */}
        {showAvatarSelection ? (
          <ThriveSprite onAvatarSelect={handleAvatarSelect} />
        ) : (
          /* Auth Form */
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle className="text-center text-3xl">
                {isLogin ? "Fazer Login" : "Criar Conta"}
              </CardTitle>
            </CardHeader>

            <CardContent>

              <Tabs value={isLogin ? "login" : "signup"} className="w-full">
                <TabsList className="grid h-auto w-full grid-cols-2">
                  <TabsTrigger
                    value="login"
                    onClick={() => setIsLogin(true)}
                    className="flex items-center gap-2"
                  >
                    <LogIn className="w-4 h-4" />

                    <p className="text-xl">Login</p>

                  </TabsTrigger>
                  <TabsTrigger
                    value="signup"
                    onClick={() => setIsLogin(false)}
                    className="flex items-center gap-2"
                  >
                    <UserPlus className="w-4 h-4" />
                    <p className="text-xl">Cadastro</p>

                  </TabsTrigger>
                </TabsList>

                <TabsContent value="login" className="space-y-4 mt-6">
                  <form onSubmit={handleAuth} className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="username" className="text-xl">Nome de usuário</Label>
                      <Input
                        id="username"
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="Seu nome de usuário"
                        className="placeholder:text-base"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password" className="text-xl">Senha</Label>
                      <div className="relative">
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Sua senha"
                          className="placeholder:text-base"
                          required
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                    <Button
                      type="submit"
                      className="w-full text-xl"
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
                        placeholder="Escolha um nome único"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-password">Senha</Label>
                      <div className="relative">
                        <Input
                          id="signup-password"
                          type={showPassword ? "text" : "password"}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Crie uma senha segura"
                          required
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
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
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={loading}
                    >
                      {loading ? "Criando conta..." : (role === 'student' ? "Escolher ThriveSprite" : "Criar conta")}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        )}

        <p className="text-center text-xs text-muted-foreground">
          Sistema seguro com autenticação por senha
        </p>
      </div>
    </div>
  );
}