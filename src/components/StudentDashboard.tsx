import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { HandHeart, Smile, Frown, Meh, Zap, LogOut } from "lucide-react";
import { toast } from "sonner";
import defaultBuddy from "@/assets/default-buddy.png";

interface StudentDashboardProps {
  username: string;
  onLogout: () => void;
}

type MoodType = 'happy' | 'sad' | 'ok' | 'excited';

const moods = [
  { id: 'happy' as MoodType, icon: Smile, label: '😊 Feliz', color: 'buddy-happy' },
  { id: 'ok' as MoodType, icon: Meh, label: '😐 Normal', color: 'buddy-calm' },
  { id: 'excited' as MoodType, icon: Zap, label: '🤩 Animado', color: 'buddy-excited' },
  { id: 'sad' as MoodType, icon: Frown, label: '😢 Triste', color: 'destructive' }
];

export function StudentDashboard({ username, onLogout }: StudentDashboardProps) {
  const [selectedMood, setSelectedMood] = useState<MoodType | null>(null);
  const [helpRequested, setHelpRequested] = useState(false);

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
    const selectedMoodData = moods.find(m => m.id === mood);
    toast.success(`Humor registrado: ${selectedMoodData?.label}`, {
      description: "Obrigado por compartilhar como você está!",
      duration: 3000,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-secondary p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-secondary-foreground">
              Olá, {username}! 👋
            </h1>
            <p className="text-secondary-foreground/70 text-lg">
              Como posso te ajudar hoje?
            </p>
          </div>
          <Button variant="ghost" onClick={onLogout} size="sm">
            <LogOut size={16} />
            Sair
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Buddy Virtual */}
          <Card className="shadow-large border-2 border-secondary/30">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Seu Buddy</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center space-y-4">
              <div className="relative">
                <img 
                  src={defaultBuddy}
                  alt="Seu Buddy Virtual"
                  className="w-32 h-32 rounded-full shadow-medium animate-gentle-pulse"
                />
                {selectedMood && (
                  <Badge className={`absolute -bottom-2 -right-2 ${moods.find(m => m.id === selectedMood)?.color} text-xs`}>
                    {moods.find(m => m.id === selectedMood)?.label}
                  </Badge>
                )}
              </div>
              <div className="text-center space-y-2">
                <p className="text-lg font-semibold">Olá, amigo!</p>
                <p className="text-muted-foreground">
                  {selectedMood 
                    ? "Obrigado por me contar como está!" 
                    : "Como você está se sentindo hoje?"}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Botão de Ajuda Principal */}
          <Card className="shadow-large border-2 border-warning/30">
            <CardContent className="flex flex-col items-center justify-center h-full p-8">
              <Button
                variant="help"
                size="help"
                onClick={handleHelpRequest}
                disabled={helpRequested}
                className={helpRequested ? "opacity-50 cursor-not-allowed" : ""}
              >
                <HandHeart size={32} />
                {helpRequested ? "Ajuda enviada!" : "PEDIR AJUDA"}
              </Button>
              
              {helpRequested && (
                <div className="mt-4 text-center">
                  <p className="text-green-600 font-semibold">✓ Pedido enviado!</p>
                  <p className="text-sm text-muted-foreground">
                    Alguém virá te ajudar em breve
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Seletor de Humor */}
        <Card className="shadow-medium">
          <CardHeader>
            <CardTitle className="text-xl text-center">Como você está hoje?</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {moods.map((mood) => {
                const IconComponent = mood.icon;
                const isSelected = selectedMood === mood.id;
                return (
                  <Button
                    key={mood.id}
                    variant={isSelected ? "buddy" : "outline"}
                    size="lg"
                    onClick={() => handleMoodSelect(mood.id)}
                    className="flex flex-col gap-2 h-auto py-6"
                  >
                    <IconComponent size={24} />
                    <span className="text-sm">{mood.label}</span>
                  </Button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Status */}
        <Card className="bg-muted/50">
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