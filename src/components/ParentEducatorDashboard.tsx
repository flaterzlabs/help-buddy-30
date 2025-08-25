import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Bell, Users, Plus, LogOut, AlertTriangle, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import type { UserRole } from "./RoleSelector";

interface ParentEducatorDashboardProps {
  username: string;
  role: UserRole;
  onLogout: () => void;
}

interface ConnectedStudent {
  id: string;
  name: string;
  status: 'ok' | 'help-needed';
  mood?: string;
  lastSeen: string;
}

// Dados simulados
const mockStudents: ConnectedStudent[] = [
  {
    id: '1',
    name: 'Ana Maria',
    status: 'ok',
    mood: '😊 Feliz',
    lastSeen: '5 min atrás'
  },
  {
    id: '2',
    name: 'João Pedro',
    status: 'help-needed',
    mood: '😢 Triste',
    lastSeen: 'Agora'
  }
];

export function ParentEducatorDashboard({ username, role, onLogout }: ParentEducatorDashboardProps) {
  const [students, setStudents] = useState<ConnectedStudent[]>(mockStudents);
  const [connectionCode, setConnectionCode] = useState("");

  const handleConnectStudent = () => {
    if (connectionCode.trim()) {
      toast.success(`Código ${connectionCode} usado!`, {
        description: "Estudante conectado com sucesso",
        duration: 3000,
      });
      setConnectionCode("");
    }
  };

  const handleHelpStudent = (studentId: string) => {
    setStudents(prev => 
      prev.map(student => 
        student.id === studentId 
          ? { ...student, status: 'ok' as const }
          : student
      )
    );
    const student = students.find(s => s.id === studentId);
    toast.success(`Ajuda fornecida para ${student?.name}`, {
      description: "Status atualizado para OK",
      duration: 3000,
    });
  };

  const roleTitle = role === 'parent' ? 'Pai/Mãe' : 'Educador';
  const studentsNeedingHelp = students.filter(s => s.status === 'help-needed').length;

  return (
    <div className="min-h-screen bg-gradient-accent p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-accent-foreground">
              Dashboard - {roleTitle}
            </h1>
            <p className="text-accent-foreground/70 text-lg">
              Bem-vindo, {username}!
            </p>
          </div>
          <div className="flex items-center gap-4">
            {studentsNeedingHelp > 0 && (
              <Badge className="bg-destructive text-destructive-foreground animate-gentle-pulse">
                <Bell size={14} />
                {studentsNeedingHelp} pedindo ajuda
              </Badge>
            )}
            <Button variant="ghost" onClick={onLogout} size="sm">
              <LogOut size={16} />
              Sair
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Estatísticas */}
          <Card className="shadow-large">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users size={20} />
                Resumo
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span>Estudantes conectados:</span>
                <Badge variant="secondary">{students.length}</Badge>
              </div>
              <div className="flex justify-between">
                <span>Pedindo ajuda:</span>
                <Badge className={studentsNeedingHelp > 0 ? "bg-destructive" : "bg-success"}>
                  {studentsNeedingHelp}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span>Tudo bem:</span>
                <Badge className="bg-success">
                  {students.length - studentsNeedingHelp}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Conectar Novo Estudante */}
          <Card className="shadow-large">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus size={20} />
                Conectar Estudante
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Input
                  placeholder="Código do estudante"
                  value={connectionCode}
                  onChange={(e) => setConnectionCode(e.target.value)}
                  className="focus-ring"
                />
              </div>
              <Button 
                onClick={handleConnectStudent}
                className="w-full"
                disabled={!connectionCode.trim()}
              >
                Conectar
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                O estudante deve fornecer o código gerado no app
              </p>
            </CardContent>
          </Card>

          {/* Notificações */}
          <Card className="shadow-large">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell size={20} />
                Notificações
              </CardTitle>
            </CardHeader>
            <CardContent>
              {studentsNeedingHelp === 0 ? (
                <div className="text-center py-4">
                  <CheckCircle className="mx-auto mb-2 text-success" size={24} />
                  <p className="text-sm text-muted-foreground">
                    Nenhum pedido de ajuda ativo
                  </p>
                </div>
              ) : (
                <div className="text-center py-4">
                  <AlertTriangle className="mx-auto mb-2 text-destructive animate-gentle-pulse" size={24} />
                  <p className="text-sm font-semibold">
                    {studentsNeedingHelp} estudante(s) precisam de ajuda!
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Lista de Estudantes */}
        <Card className="shadow-large">
          <CardHeader>
            <CardTitle>Estudantes Conectados</CardTitle>
          </CardHeader>
          <CardContent>
            {students.length === 0 ? (
              <div className="text-center py-8">
                <Users className="mx-auto mb-4 text-muted-foreground" size={48} />
                <p className="text-muted-foreground">
                  Nenhum estudante conectado ainda
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Use o código de conexão para vincular estudantes
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {students.map((student) => (
                  <div 
                    key={student.id}
                    className={`p-4 rounded-xl border-2 ${
                      student.status === 'help-needed' 
                        ? 'border-destructive bg-destructive/5 shadow-medium' 
                        : 'border-border bg-card'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`w-3 h-3 rounded-full ${
                          student.status === 'help-needed' ? 'bg-destructive' : 'bg-success'
                        } animate-gentle-pulse`} />
                        <div>
                          <h3 className="font-semibold">{student.name}</h3>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span>{student.mood}</span>
                            <span>•</span>
                            <span>{student.lastSeen}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge 
                          className={student.status === 'help-needed' ? 'bg-destructive' : 'bg-success'}
                        >
                          {student.status === 'help-needed' ? 'Precisa de ajuda' : 'OK'}
                        </Badge>
                        {student.status === 'help-needed' && (
                          <Button
                            size="sm"
                            onClick={() => handleHelpStudent(student.id)}
                          >
                            Ajudar
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}