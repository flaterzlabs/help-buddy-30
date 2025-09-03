import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Palette } from 'lucide-react';

type MoodType = 'happy' | 'calm' | 'excited' | 'sad' | 'focused';

interface BuddyConfig {
  color: string;
  shape: 'circle' | 'square' | 'heart';
  size: number;
}

interface BuddyAvatarProps {
  mood: MoodType;
  config?: BuddyConfig;
  onConfigChange?: (config: BuddyConfig) => void;
  showEditor?: boolean;
}

const defaultConfig: BuddyConfig = {
  color: 'hsl(var(--buddy-happy))',
  shape: 'circle',
  size: 120
};

const moodExpressions = {
  happy: { eyes: '●●', mouth: '‿', color: 'hsl(var(--buddy-happy))' },
  calm: { eyes: '◐◑', mouth: '—', color: 'hsl(var(--buddy-calm))' },
  excited: { eyes: '★★', mouth: 'o', color: 'hsl(var(--buddy-excited))' },
  sad: { eyes: '●●', mouth: '⌒', color: 'hsl(var(--muted))' },
  focused: { eyes: '◆◆', mouth: '—', color: 'hsl(var(--accent))' }
};

export function BuddyAvatar({ mood, config = defaultConfig, onConfigChange, showEditor = false }: BuddyAvatarProps) {
  const [isEditing, setIsEditing] = useState(false);
  const expression = moodExpressions[mood];
  
  const currentConfig = {
    ...defaultConfig,
    ...config,
    color: expression.color // Use mood-based color
  };

  const getBuddyPath = () => {
    switch (currentConfig.shape) {
      case 'square':
        return `M20 20 L${currentConfig.size - 20} 20 L${currentConfig.size - 20} ${currentConfig.size - 20} L20 ${currentConfig.size - 20} Z`;
      case 'heart':
        return `M${currentConfig.size/2} ${currentConfig.size * 0.8} C${currentConfig.size * 0.2} ${currentConfig.size * 0.5} ${currentConfig.size * 0.2} ${currentConfig.size * 0.2} ${currentConfig.size/2} ${currentConfig.size * 0.3} C${currentConfig.size * 0.8} ${currentConfig.size * 0.2} ${currentConfig.size * 0.8} ${currentConfig.size * 0.5} ${currentConfig.size/2} ${currentConfig.size * 0.8} Z`;
      default:
        return `M${currentConfig.size/2} ${currentConfig.size/2} m-${(currentConfig.size - 40)/2} 0 a${(currentConfig.size - 40)/2} ${(currentConfig.size - 40)/2} 0 1 0 ${currentConfig.size - 40} 0 a${(currentConfig.size - 40)/2} ${(currentConfig.size - 40)/2} 0 1 0 -${currentConfig.size - 40} 0`;
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <Card className="p-6 shadow-soft transition-gentle">
        <div className="relative">
          <svg 
            width={currentConfig.size} 
            height={currentConfig.size}
            className="animate-gentle-pulse"
          >
            <path 
              d={getBuddyPath()} 
              fill={currentConfig.color}
              className="transition-gentle"
            />
            
            {/* Eyes */}
            <text 
              x={currentConfig.size * 0.35} 
              y={currentConfig.size * 0.4} 
              fontSize="20" 
              className="fill-foreground"
            >
              {expression.eyes.charAt(0)}
            </text>
            <text 
              x={currentConfig.size * 0.65} 
              y={currentConfig.size * 0.4} 
              fontSize="20" 
              className="fill-foreground"
            >
              {expression.eyes.charAt(1)}
            </text>
            
            {/* Mouth */}
            <text 
              x={currentConfig.size * 0.5} 
              y={currentConfig.size * 0.65} 
              fontSize="24" 
              textAnchor="middle" 
              className="fill-foreground"
            >
              {expression.mouth}
            </text>
          </svg>
          
          {showEditor && (
            <Button
              size="sm"
              variant="outline"
              className="absolute -top-2 -right-2 h-8 w-8 p-0"
              onClick={() => setIsEditing(!isEditing)}
            >
              <Palette className="h-3 w-3" />
            </Button>
          )}
        </div>
      </Card>

      {isEditing && showEditor && (
        <Card className="p-4 w-full max-w-xs">
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium">Formato</label>
              <div className="flex gap-2 mt-1">
                {(['circle', 'square', 'heart'] as const).map((shape) => (
                  <Button
                    key={shape}
                    size="sm"
                    variant={currentConfig.shape === shape ? 'default' : 'outline'}
                    onClick={() => onConfigChange?.({ ...currentConfig, shape })}
                  >
                    {shape === 'circle' ? '●' : shape === 'square' ? '■' : '♥'}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}