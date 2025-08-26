import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { LogOut, Users, Clock, AlertCircle, Plus, History } from 'lucide-react';
import { toast } from 'sonner';
import { ThemeToggle } from '@/components/ThemeToggle';
import type { UserRole } from "./RoleSelector";

interface ParentEducatorDashboardProps {
  username: string;
  role: UserRole;
  onLogout: () => void;
}

interface ConnectedStudent {
  id: string;
  name: string;
  status: 'ok' | 'needs_help' | 'away';
  mood?: string;
  lastSeen: string;
  connectionCode?: string;
}

interface HelpRequest {
  id: string;
  studentName: string;
  timestamp: string;
  mood?: string;
  resolved: boolean;
}

// Mock data para demonstração - apenas uma criança conectada
const mockStudents: ConnectedStudent[] = [
  {
    id: '1',
    name: 'Meu Filho',
    status: 'ok',
    mood: 'Feliz',
    lastSeen: '2 minutos atrás',
    connectionCode: 'ABC123'
  }
];

const mockHelpHistory: HelpRequest[] = [
  {
    id: '1',
    studentName: 'Meu Filho',
    timestamp: '2024-01-15 14:30',
    mood: 'Preocupado',
    resolved: true
  },
  {
    id: '2', 
    studentName: 'Meu Filho',
    timestamp: '2024-01-15 10:15',
    mood: 'Confuso',
    resolved: true
  }
];

export function ParentEducatorDashboard({ username, role, onLogout }: ParentEducatorDashboardProps) {
  const [students, setStudents] = useState<ConnectedStudent[]>(mockStudents);
  const [connectionCode, setConnectionCode] = useState('');
  const [helpHistory, setHelpHistory] = useState<HelpRequest[]>(mockHelpHistory);
  const [showHistory, setShowHistory] = useState(false);

  const handleConnectStudent = () => {
    if (connectionCode.trim()) {
      toast.success(`Código ${connectionCode} usado!`, {
        description: "Filho conectado com sucesso",
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

  const studentsNeedingHelp = students.filter(s => s.status === 'needs_help');

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Dashboard {role === 'parent' ? 'dos Pais' : 'do Educador'}
            </h1>
            <p className="text-muted-foreground mt-2">
              Bem-vindo, {username}! Monitore e ajude seus filhos conectados.
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

        {/* Notificações de Pedidos de Ajuda */}
        {studentsNeedingHelp.length > 0 && (
          <Card className="shadow-soft border-warning bg-warning/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-warning animate-pulse" />
                <div>
                  <p className="font-semibold text-warning-foreground">
                    {studentsNeedingHelp.length} filho(s) precisam de ajuda!
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Verifique a lista abaixo e ofereça suporte.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="shadow-soft">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Filhos Conectados</p>
                  <p className="text-3xl font-bold text-foreground">{students.length}</p>
                </div>
                <Users className="w-8 h-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-soft">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Precisam de Ajuda</p>
                  <p className="text-3xl font-bold text-warning">
                    {studentsNeedingHelp.length}
                  </p>
                </div>
                <AlertCircle className="w-8 h-8 text-warning" />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-soft">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Online Agora</p>
                  <p className="text-3xl font-bold text-success">
                    {students.filter(s => s.status !== 'away').length}
                  </p>
                </div>
                <Clock className="w-8 h-8 text-success" />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-soft">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Histórico</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowHistory(!showHistory)}
                    className="p-0 h-auto font-bold text-2xl"
                  >
                    {helpHistory.length}
                  </Button>
                </div>
                <History className="w-8 h-8 text-accent" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Conectar Novo Estudante */}
        <Card className="shadow-soft mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Conectar Novo Filho
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <Input
                placeholder="Digite o código do seu filho (ex: ABCD123)"
                value={connectionCode}
                onChange={(e) => setConnectionCode(e.target.value.toUpperCase())}
                className="focus-ring"
              />
              <Button 
                onClick={handleConnectStudent}
                disabled={!connectionCode.trim()}
                className="transition-gentle"
              >
                Conectar
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Seu filho precisa gerar um código em sua tela para que você possa se conectar.
            </p>
          </CardContent>
        </Card>

        {/* Histórico de Pedidos de Ajuda */}
        {showHistory && (
          <Card className="shadow-soft mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="w-5 h-5" />
                Histórico de Pedidos de Ajuda
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {helpHistory.map((request) => (
                  <div key={request.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div>
                      <p className="font-medium">{request.studentName}</p>
                      <p className="text-sm text-muted-foreground">
                        {request.timestamp} {request.mood && `• Humor: ${request.mood}`}
                      </p>
                    </div>
                    <Badge variant={request.resolved ? "secondary" : "destructive"}>
                      {request.resolved ? "Resolvido" : "Pendente"}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Lista de Filhos */}
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Meus Filhos ({students.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {students.map((student) => (
                <div key={student.id} className="flex items-center justify-between p-4 rounded-lg border border-border bg-card transition-gentle hover:shadow-soft">
                  <div className="flex items-center gap-4">
                    <div className={`w-3 h-3 rounded-full ${
                      student.status === 'ok' ? 'bg-success' :
                      student.status === 'needs_help' ? 'bg-warning animate-pulse' :
                      'bg-muted'
                    }`} />
                    <div>
                      <h3 className="font-semibold text-foreground">{student.name}</h3>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        <span>{student.lastSeen}</span>
                        {student.mood && (
                          <>
                            <span>•</span>
                            <span>Humor: {student.mood}</span>
                          </>
                        )}
                        {student.connectionCode && (
                          <>
                            <span>•</span>
                            <span>Código: {student.connectionCode}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Badge variant={
                      student.status === 'ok' ? 'secondary' :
                      student.status === 'needs_help' ? 'destructive' :
                      'outline'
                    }>
                      {student.status === 'ok' ? 'OK' :
                       student.status === 'needs_help' ? 'Precisa de Ajuda' :
                       'Ausente'}
                    </Badge>
                    
                    {student.status === 'needs_help' && (
                      <Button
                        size="sm"
                        onClick={() => handleHelpStudent(student.id)}
                        className="transition-gentle"
                      >
                        Ajudar
                      </Button>
                    )}
                  </div>
                </div>
              ))}
              
              {students.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhum filho conectado ainda.</p>
                  <p className="text-sm">Use o código de conexão acima para conectar seu filho.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}