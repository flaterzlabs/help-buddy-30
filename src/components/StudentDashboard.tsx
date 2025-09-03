import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { HandHeart, Smile, Frown, Meh, Zap, LogOut, Copy } from "lucide-react";
import { toast } from "sonner";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useCustomAuth } from "@/hooks/useCustomAuth";
import { useSupabaseData } from "@/hooks/useSupabaseData";
import { supabase } from "@/integrations/supabase/client";

interface StudentDashboardProps {
  username: string;
  onLogout: () => void;
}

type MoodType = "happy" | "sad" | "calm" | "excited" | "focused";

const moods = [
  { value: "happy" as MoodType, icon: Smile, label: "Feliz" },
  { value: "calm" as MoodType, icon: Meh, label: "Calmo" },
  { value: "excited" as MoodType, icon: Zap, label: "Animado" },
  { value: "sad" as MoodType, icon: Frown, label: "Triste" },
  { value: "focused" as MoodType, icon: Zap, label: "Focado" },
];

const avatarStyles = [
  "adventurer", "adventurer-neutral", "avataaars", "avataaars-neutral",
  "big-ears", "big-ears-neutral", "big-smile", "bottts", "bottts-neutral",
  "croodles", "croodles-neutral", "fun-emoji", "identicon", "lorelei",
  "lorelei-neutral", "micah", "miniavs",
  "open-peeps", "personas", "pixel-art", "pixel-art-neutral", "rings",
  "shapes", "thumbs"
];

export function StudentDashboard({ username, onLogout }: StudentDashboardProps) {
  const [selectedMood, setSelectedMood] = useState<MoodType | null>(null);
  const { user } = useCustomAuth();
  const { logMood, createHelpRequest, helpRequests } = useSupabaseData(user?.id);

  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false); // Novo estado

  // 🔹 Busca avatar salvo no banco
  useEffect(() => {
    const fetchAvatar = async () => {
      if (!user?.id) return;
      const { data, error } = await supabase
        .from("users")
        .select("avatar_url")
        .eq("id", user.id)
        .single();

      if (error) {
        console.error("Erro ao buscar avatar:", error);
      } else {
        setAvatarUrl(data?.avatar_url ?? null);
      }
    };

    fetchAvatar();
  }, [user?.id]);

  const activeHelpRequest = helpRequests.find((req) => req.is_active);

  const handleHelpRequest = async () => {
    setIsSubmitting(true); // Inicia o estado de submissão
    try {
      await createHelpRequest();
      toast.custom(() => (
        <div className="bg-green-600 text-center text-white font-bold text-xl shadow-lg rounded-xl px-4 py-5">
          Pedido de ajuda enviado com sucesso!
        </div>
      ), {
        position: "top-center",
        duration: 4000,
      });
    } catch (error) {
      console.error("Erro ao enviar pedido de ajuda:", error);
      toast.error("Erro ao enviar o pedido de ajuda. Tente novamente.");
    } finally {
      setIsSubmitting(false); // Finaliza o estado de submissão
    }
  };

  const handleMoodSelect = async (mood: MoodType) => {
    setSelectedMood(mood);
    const moodName = moods.find((m) => m.value === mood)?.label || mood;
    await logMood(mood);
    toast.success(`Humor registrado: ${moodName}`, { duration: 3000 });
  };

  const copyConnectionCode = () => {
    if (user?.connection_code) {
      navigator.clipboard.writeText(user.connection_code);
      toast.success("Código copiado!", {
        description: "Compartilhe com seus pais ou professores",
        duration: 2000,
      });
    }
  };

  // 🔹 Gera e salva novo avatar
  const refreshAvatar = async () => {
    if (!user?.id) return;

    const randomStyle = avatarStyles[Math.floor(Math.random() * avatarStyles.length)];
    const newSeed = Math.random().toString(36).substring(7);
    const newUrl = `https://api.dicebear.com/7.x/${randomStyle}/svg?seed=${newSeed}`;

    // Atualiza o estado local para uma resposta instantânea
    setAvatarUrl(newUrl);

    // Salva a nova URL no banco de dados do usuário
    const { error } = await supabase
      .from("users")
      .update({ avatar_url: newUrl })
      .eq("id", user.id);

    if (error) {
      console.error("Erro ao salvar avatar:", error);
      toast.error("Não consegui salvar o avatar 😢");
    } else {
      toast.success("Avatar atualizado e salvo! 🎭");
    }
  };

  return (
    <div className="min-h-screen bg-background p-5">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold text-foreground">Olá, {username}! 👋</h1>
            <p className="text-xl text-muted-foreground mt-2">
              Como posso te ajudar hoje?
            </p>
          </div>
          <div className="flex gap-3">
            <ThemeToggle />
            <Button variant="outline" onClick={onLogout} className="text-base px-4 py-2">
              <LogOut className="w-6 h-6 mr-2" />
              <span>Sair</span>
            </Button>
          </div>
        </div>

        {/* Card do Avatar */}
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle className="text-center text-3xl">Seu Avatar 🎭</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <div className="flex flex-col items-center gap-5">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={`Avatar de ${username}`}
                  className="w-[120px] h-[120px] rounded-full"
                />
              ) : (
                <p className="text-lg text-muted-foreground">Carregando avatar...</p>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={refreshAvatar}
                className="flex items-center text-xl px-4 py-5 focus:outline-none focus:ring-0 focus:ring-offset-0 transform transition-transform duration-150 active:scale-90"
              >
                Trocar avatar
              </Button>
              <div className="space-y-2">
                {selectedMood ? (
                  <p className="text-xl text-muted-foreground">
                    "Vejo que você está se sentindo{" "}
                    <span className="font-semibold text-foreground">
                      {moods.find((m) => m.value === selectedMood)?.label.toLowerCase()}
                    </span>
                    . Estou aqui para te ajudar! 💙"
                  </p>
                ) : (
                  <p className="text-lg text-muted-foreground">
                    "Olá! Como você está se sentindo hoje? 😊"
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Botão de Ajuda */}
        <div className="flex justify-center items-center w-full">
          <Button
            variant="destructive"
            onClick={handleHelpRequest}
            disabled={!!activeHelpRequest || isSubmitting} // Desabilita durante o envio
            className={`flex items-center justify-center w-full max-w-[50%] h-24 text-3xl font-extrabold 
              focus:outline-none focus:ring-0 focus:ring-offset-0 
              transform transition-transform duration-150 active:scale-90
              ${activeHelpRequest || isSubmitting
                ? "opacity-50 cursor-not-allowed"
                : "bg-red-600 hover:bg-red-700 text-white shadow-[0_0_30px_rgba(220,38,38,0.75)]"}`}
          >
            <span className="mr-4 inline-flex w-[42px] h-[42px]">
              <HandHeart
                strokeWidth={2}
                className="!w-full !h-full"
                style={{ width: "100%", height: "100%" }}
              />
            </span>
            <span className="leading-none">
              {isSubmitting ? "Enviando..." : (activeHelpRequest ? "Ajuda enviada!" : "PEDIR AJUDA")}
            </span>
          </Button>
        </div>

        {/* Seletor de Humor */}
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle className="text-center text-2xl">Como você está hoje?</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-5 gap-4">
              {moods.map((mood) => {
                const IconComponent = mood.icon;
                const isSelected = selectedMood === mood.value;
                return (
                  <Button
                    key={mood.value}
                    variant={isSelected ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleMoodSelect(mood.value)}
                    className="flex flex-col gap-1 h-auto py-3 text-base"
                  >
                    <IconComponent size={24} />
                    <span>{mood.label}</span>
                  </Button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Código de Conexão */}
        <div className="flex items-center justify-between p-5 rounded-lg bg-card border border-border">
          <div className="flex items-center gap-3">
            <span className="text-lg text-muted-foreground">Código:</span>
            <span className="font-mono font-semibold text-2xl">
              {user?.connection_code || "Carregando..."}
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={copyConnectionCode}
              disabled={!user?.connection_code}
              className="w-10 h-10"
            >
              <Copy className="w-6 h-6" />
            </Button>
          </div>
          <p className="text-lg text-muted-foreground">
            Compartilhe com pais/professores
          </p>
        </div>

        {/* Status */}
        <Card className="shadow-soft">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-lg text-muted-foreground">
                Status: {activeHelpRequest ? "🚨 Pedido de ajuda ativo" : "✅ Tudo bem"}
              </span>
              <Badge variant="secondary" className="text-base px-3 py-1">
                <span>Conectado</span>
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}