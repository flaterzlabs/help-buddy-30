import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { LogOut, Users, Clock, AlertCircle, Plus, History } from 'lucide-react';
import { toast } from 'sonner';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useAuth } from '@/hooks/useAuth';
import { useSupabaseData } from '@/hooks/useSupabaseData';
import type { UserRole } from "./RoleSelector";

interface ParentEducatorDashboardProps {
  username: string;
  role: UserRole;
  onLogout: () => void;
}

export function ParentEducatorDashboard({ username, role, onLogout }: ParentEducatorDashboardProps) {
  const [connectionCode, setConnectionCode] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const { profile } = useAuth();
  const { connections, helpRequests, moodLogs, connectToStudent, loading } = useSupabaseData(profile?.user_id);

  const handleConnectStudent = async () => {
    if (connectionCode.trim()) {
      const success = await connectToStudent(connectionCode.trim());
      if (success) {
        setConnectionCode("");
      }
    }
  };

  // Filtrar pedidos de ajuda ativos dos alunos conectados
  const activeHelpRequests = helpRequests.filter(req => 
    req.is_active && connections.some(conn => conn.student_id === req.student_id)
  );

  // Contar alunos online (assumindo que são online se tiveram atividade recente)
  const onlineStudents = connections.length;

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
              Bem-vindo, {username}! Monitore e ajude seus {role === 'educator' ? 'alunos' : 'filhos'} conectados.
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
        {activeHelpRequests.length > 0 && (
          <Card className="shadow-soft border-warning bg-warning/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-warning animate-pulse" />
                <div>
                  <p className="font-semibold text-warning-foreground">
                    {activeHelpRequests.length} {role === 'educator' ? 'aluno(s)' : 'filho(s)'} precisam de ajuda!
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
                  <p className="text-sm text-muted-foreground">{role === 'educator' ? 'Alunos' : 'Filhos'} Conectados</p>
                  <p className="text-3xl font-bold text-foreground">{connections.length}</p>
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
                    {activeHelpRequests.length}
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
                    {onlineStudents}
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
                    {helpRequests.length}
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
              Conectar Novo {role === 'educator' ? 'Aluno' : 'Filho'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <Input
                placeholder={`Digite o código do seu ${role === 'educator' ? 'aluno' : 'filho'} (ex: ABCD123)`}
                value={connectionCode}
                onChange={(e) => setConnectionCode(e.target.value.toUpperCase())}
                className="focus-ring"
              />
              <Button 
                onClick={handleConnectStudent}
                disabled={!connectionCode.trim() || loading}
                className="transition-gentle"
              >
                {loading ? "Conectando..." : "Conectar"}
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Seu {role === 'educator' ? 'aluno' : 'filho'} precisa gerar um código em sua tela para que você possa se conectar.
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
                {helpRequests.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <History className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhum pedido de ajuda ainda.</p>
                  </div>
                ) : (
                  helpRequests.map((request) => {
                    const connection = connections.find(conn => conn.student_id === request.student_id);
                    const studentName = connection?.student_profile?.username || 'Aluno desconhecido';
                    
                    return (
                      <div key={request.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                        <div>
                          <p className="font-medium">{studentName}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(request.created_at).toLocaleString('pt-BR')}
                          </p>
                        </div>
                        <Badge variant={request.is_active ? "destructive" : "secondary"}>
                          {request.is_active ? "Ativo" : "Resolvido"}
                        </Badge>
                      </div>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Lista de Alunos/Filhos */}
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Meus {role === 'educator' ? 'Alunos' : 'Filhos'} ({connections.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {connections.map((connection) => {
                const studentName = connection.student_profile?.username || 'Nome não encontrado';
                const studentCode = connection.student_profile?.connection_code || '';
                const hasActiveHelp = activeHelpRequests.some(req => req.student_id === connection.student_id);
                const latestMood = moodLogs.find(log => log.student_id === connection.student_id);
                
                return (
                  <div key={connection.id} className="flex items-center justify-between p-4 rounded-lg border border-border bg-card transition-gentle hover:shadow-soft">
                    <div className="flex items-center gap-4">
                      <div className={`w-3 h-3 rounded-full ${
                        hasActiveHelp ? 'bg-warning animate-pulse' : 'bg-success'
                      }`} />
                      <div>
                        <h3 className="font-semibold text-foreground">{studentName}</h3>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          <span>Conectado desde {new Date(connection.created_at).toLocaleDateString('pt-BR')}</span>
                          {latestMood && (
                            <>
                              <span>•</span>
                              <span>Humor: {latestMood.mood}</span>
                            </>
                          )}
                          {studentCode && (
                            <>
                              <span>•</span>
                              <span>Código: {studentCode}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <Badge variant={hasActiveHelp ? 'destructive' : 'secondary'}>
                        {hasActiveHelp ? 'Precisa de Ajuda' : 'OK'}
                      </Badge>
                    </div>
                  </div>
                );
              })}
              
              {connections.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhum {role === 'educator' ? 'aluno' : 'filho'} conectado ainda.</p>
                  <p className="text-sm">Use o código de conexão acima para conectar seu {role === 'educator' ? 'aluno' : 'filho'}.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}