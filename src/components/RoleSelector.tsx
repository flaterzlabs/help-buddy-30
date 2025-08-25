import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Users, GraduationCap, Heart, ArrowLeft } from "lucide-react";

export type UserRole = 'student' | 'parent' | 'educator';

interface RoleSelectorProps {
  onRoleSelect: (role: UserRole) => void;
  onBack: () => void;
}

const roles = [
  {
    id: 'student' as UserRole,
    title: 'Estudante',
    subtitle: 'Sou uma criança que precisa de ajuda',
    icon: GraduationCap,
    color: 'buddy-happy'
  },
  {
    id: 'parent' as UserRole,
    title: 'Pai/Mãe',
    subtitle: 'Quero cuidar do meu filho',
    icon: Heart,
    color: 'buddy-calm'
  },
  {
    id: 'educator' as UserRole,
    title: 'Educador',
    subtitle: 'Sou professor ou cuidador',
    icon: Users,
    color: 'buddy-excited'
  }
];

export function RoleSelector({ onRoleSelect, onBack }: RoleSelectorProps) {
  return (
    <div className="min-h-screen bg-gradient-primary flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold text-primary-foreground">
            Quem é você?
          </h1>
          <p className="text-primary-foreground/80 text-lg">
            Escolha seu perfil para começar
          </p>
        </div>

        <div className="space-y-4">
          {roles.map((role) => {
            const IconComponent = role.icon;
            return (
              <Card key={role.id} className="p-1 border-2 border-primary/20 shadow-medium">
                <Button
                  variant="role"
                  size="role"
                  onClick={() => onRoleSelect(role.id)}
                  className="w-full h-auto p-6 flex-col gap-3"
                >
                  <div className={`p-4 rounded-full buddy-${role.color.split('-')[1]} shadow-soft`}>
                    <IconComponent size={32} />
                  </div>
                  <div className="text-center">
                    <h3 className="text-xl font-semibold">{role.title}</h3>
                    <p className="text-sm opacity-75 mt-1">{role.subtitle}</p>
                  </div>
                </Button>
              </Card>
            );
          })}
        </div>

        <Button
          variant="ghost"
          onClick={onBack}
          className="w-full text-primary-foreground/80 hover:text-primary-foreground"
        >
          <ArrowLeft size={16} />
          Voltar
        </Button>
      </div>
    </div>
  );
}