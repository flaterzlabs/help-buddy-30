import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RefreshCw, Heart } from "lucide-react";
import { toast } from "sonner";

interface ThriveSpriteProps {
  onAvatarSelect: (avatarUrl: string) => void;
  initialAvatar?: string;
}

export function ThriveSprite({ onAvatarSelect, initialAvatar }: ThriveSpriteProps) {
  const [currentAvatar, setCurrentAvatar] = useState(initialAvatar || '');
  const [avatarOptions, setAvatarOptions] = useState<string[]>([]);
  const [selectedOption, setSelectedOption] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);

  // Diferentes estilos de avatares para crianças
  const avatarStyles = [
    'fun-emoji',
    'adventurer',
    'big-smile', 
    'bottts',
    'croodles-neutral'
  ];

  const generateAvatarOptions = () => {
    setIsGenerating(true);
    const newOptions = avatarStyles.map(style => {
      const seed = Math.random().toString(36).substring(7);
      return `https://api.dicebear.com/7.x/${style}/svg?seed=${seed}&size=120&backgroundColor=transparent`;
    });
    setAvatarOptions(newOptions);
    
    // Selecionar o primeiro automaticamente se não houver seleção
    if (!selectedOption && newOptions.length > 0) {
      setSelectedOption(newOptions[0]);
    }
    
    setIsGenerating(false);
  };

  useEffect(() => {
    if (initialAvatar) {
      setCurrentAvatar(initialAvatar);
      setSelectedOption(initialAvatar);
    } else {
      generateAvatarOptions();
    }
  }, [initialAvatar]);

  const handleRegenerateOptions = () => {
    generateAvatarOptions();
    toast.success("Novos ThriveSprites gerados! ✨");
  };

  const handleSelectAvatar = (avatarUrl: string) => {
    setSelectedOption(avatarUrl);
  };

  const handleConfirmSelection = () => {
    if (selectedOption) {
      setCurrentAvatar(selectedOption);
      onAvatarSelect(selectedOption);
      toast.success("Seu ThriveSprite foi escolhido! 🎉");
    }
  };

  return (
    <Card className="shadow-soft border-2 border-primary/20">
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center gap-2 text-2xl">
          <Heart className="w-6 h-6 text-primary animate-gentle-pulse" />
          Escolha seu ThriveSprite
        </CardTitle>
        <p className="text-muted-foreground">
          Seu amigo virtual que te acompanha na jornada!
        </p>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Avatar selecionado atual */}
        {currentAvatar && (
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-3">Seu ThriveSprite atual:</p>
            <div className="inline-block p-4 bg-gradient-primary rounded-full">
              <img 
                src={currentAvatar} 
                alt="ThriveSprite atual"
                className="w-24 h-24 rounded-full"
              />
            </div>
          </div>
        )}

        {/* Opções de avatares */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Escolha um novo ThriveSprite:</h3>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRegenerateOptions}
              disabled={isGenerating}
              className="gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
              Gerar Novos
            </Button>
          </div>

          {avatarOptions.length > 0 ? (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {avatarOptions.map((avatarUrl, index) => (
                  <div 
                    key={index}
                    className={`relative cursor-pointer transition-all duration-200 hover:scale-105 ${
                      selectedOption === avatarUrl 
                        ? 'ring-4 ring-primary ring-offset-2 rounded-full' 
                        : ''
                    }`}
                    onClick={() => handleSelectAvatar(avatarUrl)}
                  >
                    <div className="p-3 bg-gradient-secondary rounded-full">
                      <img 
                        src={avatarUrl} 
                        alt={`ThriveSprite opção ${index + 1}`}
                        className="w-20 h-20 rounded-full"
                      />
                    </div>
                    {selectedOption === avatarUrl && (
                      <div className="absolute -top-2 -right-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                        <Heart className="w-3 h-3 text-primary-foreground fill-current" />
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {selectedOption && (
                <Button
                  onClick={handleConfirmSelection}
                  className="w-full"
                  size="lg"
                >
                  Escolher este ThriveSprite
                </Button>
              )}
            </>
          ) : (
            <div className="text-center py-8">
              <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-muted-foreground">Gerando ThriveSprites mágicos...</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}