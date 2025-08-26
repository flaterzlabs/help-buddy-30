import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { HandHeart, Smile, Frown, Meh, Zap, LogOut, Copy } from "lucide-react";
import { toast } from "sonner";
import { StudentAvatar } from "@/components/StudentAvatar";
import { ThemeToggle } from "@/components/ThemeToggle";

interface StudentDashboardProps {
  username: string;
  onLogout: () => void;
}

type MoodType = 'happy' | 'sad' | 'calm' | 'excited' | 'focused';

const moods = [
  { value: 'happy' as MoodType, icon: Smile, label: 'Feliz', color: 'buddy-happy' },
  { value: 'calm' as MoodType, icon: Meh, label: 'Calmo', color: 'buddy-calm' },
  { value: 'excited' as MoodType, icon: Zap, label: 'Animado', color: 'buddy-excited' },
  { value: 'sad' as MoodType, icon: Frown, label: 'Triste', color: 'destructive' },
  { value: 'focused' as MoodType, icon: Zap, label: 'Focado', color: 'accent' }
];

export function StudentDashboard({ username, onLogout }: StudentDashboardProps) {
  const [selectedMood, setSelectedMood] = useState<MoodType | null>(null);
  const [helpRequested, setHelpRequested] = useState(false);
  const [connectionCode, setConnectionCode] = useState(() => {
    const saved = localStorage.getItem(`connection-code-${username}`);
    return saved || Math.random().toString(36).substring(2, 8).toUpperCase();
  });

  useEffect(() => {
    localStorage.setItem(`connection-code-${username}`, connectionCode);
  }, [connectionCode, username]);

  const handleHelpRequest = () => {
    setHelpRequested(true);
    toast.success("Pedido de ajuda enviado! 🚨", {
      description: "Alguém virá te ajudar em breve",
      duration: 4000,
    });
    
    // Simular reset depois de um tempo
    setTimeout(() => {
      setHelpRequested(false);
    }, 10000);
  };

  const handleMoodSelect = (mood: MoodType) => {
    setSelectedMood(mood);
    const moodName = moods.find(m => m.value === mood)?.label || mood;
    toast.success("Humor registrado! 😊", {
      description: `Você está se sentindo ${moodName.toLowerCase()}`,
      duration: 3000,
    });
  };

  const copyConnectionCode = () => {
    navigator.clipboard.writeText(connectionCode);
    toast.success("Código copiado!", {
      description: "Compartilhe com seus pais ou professores",
      duration: 2000,
    });
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Olá, {username}! 👋
            </h1>
            <p className="text-muted-foreground mt-1">
              Como posso te ajudar hoje?
            </p>
          </div>
          <div className="flex gap-2">
            <ThemeToggle />
            <Button 
              variant="outline" 
              onClick={onLogout}
              className="transition-gentle focus-ring"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sair
            </Button>
          </div>
        </div>

        {/* Avatar e Código de Conexão */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle className="text-center text-lg">
                Seu Avatar 🎭
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <div className="flex flex-col items-center gap-4">
                <StudentAvatar username={username} size={100} />
                
                <div className="space-y-2">
                  {selectedMood ? (
                    <p className="text-sm text-muted-foreground">
                      "Vejo que você está se sentindo{" "}
                      <span className="font-medium text-foreground">
                        {moods.find(m => m.value === selectedMood)?.label.toLowerCase()}
                      </span>
                      . Estou aqui para te ajudar! 💙"
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      "Olá! Como você está se sentindo hoje? 😊"
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle className="text-center text-lg">
                Seu Código de Conexão 🔗
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <div className="flex flex-col items-center gap-4">
                <div className="text-3xl font-bold text-primary bg-primary/10 px-6 py-3 rounded-lg border-2 border-primary/20">
                  {connectionCode}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={copyConnectionCode}
                  className="flex items-center gap-2"
                >
                  <Copy className="w-4 h-4" />
                  Copiar Código
                </Button>
                <p className="text-xs text-muted-foreground">
                  Compartilhe este código com seus pais ou professores para que eles possam se conectar com você
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Botão de Ajuda Principal */}
          <Card className="shadow-soft">
            <CardContent className="flex flex-col items-center justify-center h-full p-8">
              <Button
                variant="default"
                size="lg"
                onClick={handleHelpRequest}
                disabled={helpRequested}
                className={`w-full h-24 text-xl ${helpRequested ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                <HandHeart className="w-8 h-8 mr-3" />
                {helpRequested ? "Ajuda enviada!" : "PEDIR AJUDA"}
              </Button>
              
              {helpRequested && (
                <div className="mt-4 text-center">
                  <p className="text-success font-semibold">✓ Pedido enviado!</p>
                  <p className="text-sm text-muted-foreground">
                    Alguém virá te ajudar em breve
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Seletor de Humor */}
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle className="text-center text-lg">Como você está hoje?</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                {moods.map((mood) => {
                  const IconComponent = mood.icon;
                  const isSelected = selectedMood === mood.value;
                  return (
                    <Button
                      key={mood.value}
                      variant={isSelected ? "default" : "outline"}
                      size="lg"
                      onClick={() => handleMoodSelect(mood.value)}
                      className="flex flex-col gap-2 h-auto py-4"
                    >
                      <IconComponent size={20} />
                      <span className="text-sm">{mood.label}</span>
                    </Button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Status */}
        <Card className="shadow-soft">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Status: {helpRequested ? "🚨 Pedido de ajuda ativo" : "✅ Tudo bem"}
              </span>
              <Badge variant="secondary">
                Conectado
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}