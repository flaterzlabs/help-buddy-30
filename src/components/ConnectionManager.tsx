import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, UserPlus, Trash2, Heart } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useCustomAuth } from "@/hooks/useCustomAuth";

interface Connection {
  id: string;
  student_id: string;
  parent_educator_id: string;
  created_at: string;
  student?: {
    username: string;
    avatar_url?: string;
  };
  parent_educator?: {
    username: string;
    avatar_url?: string;
  };
}

export function ConnectionManager() {
  const { user } = useCustomAuth();
  const [connections, setConnections] = useState<Connection[]>([]);
  const [newConnectionUsername, setNewConnectionUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user) {
      loadConnections();
    }
  }, [user]);

  const loadConnections = async () => {
    if (!user) return;

    try {
        let query = supabase
          .from('connections')
          .select(`
            id,
            student_id,
            parent_educator_id,
            created_at,
            student:users!student_id (username, avatar_url),
            parent_educator:users!parent_educator_id (username, avatar_url)
          `);

      if (user.role === 'student') {
        query = query.eq('student_id', user.id);
      } else {
        query = query.eq('parent_educator_id', user.id);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Erro ao carregar conexões:', error);
        return;
      }

      setConnections(data || []);
    } catch (error) {
      console.error('Erro ao carregar conexões:', error);
    }
  };

  const addConnection = async () => {
    if (!user || !newConnectionUsername.trim()) {
      toast.error('Digite um nome de usuário');
      return;
    }

    setIsLoading(true);

    try {
      // Buscar usuário pelo username
      const { data: targetUser, error: userError } = await supabase
        .from('users')
        .select('id, username, role')
        .eq('username', newConnectionUsername.trim())
        .single();

      if (userError || !targetUser) {
        toast.error('Usuário não encontrado');
        setIsLoading(false);
        return;
      }

      // Verificar se a conexão já existe
      const { data: existingConnection } = await supabase
        .from('connections')
        .select('id')
        .eq('student_id', user.role === 'student' ? user.id : targetUser.id)
        .eq('parent_educator_id', user.role === 'student' ? targetUser.id : user.id)
        .single();

      if (existingConnection) {
        toast.error('Conexão já existe');
        setIsLoading(false);
        return;
      }

      // Validar tipos de usuário
      if (user.role === 'student' && !['parent', 'educator'].includes(targetUser.role)) {
        toast.error('Estudantes só podem se conectar com pais ou educadores');
        setIsLoading(false);
        return;
      }

      if (['parent', 'educator'].includes(user.role) && targetUser.role !== 'student') {
        toast.error('Pais e educadores só podem se conectar com estudantes');
        setIsLoading(false);
        return;
      }

      // Criar conexão
      const { error: connectionError } = await supabase
        .from('connections')
        .insert({
          student_id: user.role === 'student' ? user.id : targetUser.id,
          parent_educator_id: user.role === 'student' ? targetUser.id : user.id
        });

      if (connectionError) {
        console.error('Erro ao criar conexão:', connectionError);
        toast.error('Erro ao criar conexão');
        setIsLoading(false);
        return;
      }

      toast.success(`Conectado com ${targetUser.username}! 🎉`);
      setNewConnectionUsername('');
      loadConnections();
    } catch (error) {
      console.error('Erro ao adicionar conexão:', error);
      toast.error('Erro no servidor');
    } finally {
      setIsLoading(false);
    }
  };

  const removeConnection = async (connectionId: string) => {
    try {
      const { error } = await supabase
        .from('connections')
        .delete()
        .eq('id', connectionId);

      if (error) {
        console.error('Erro ao remover conexão:', error);
        toast.error('Erro ao remover conexão');
        return;
      }

      toast.success('Conexão removida');
      loadConnections();
    } catch (error) {
      console.error('Erro ao remover conexão:', error);
      toast.error('Erro no servidor');
    }
  };

  if (!user) return null;

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'student': return 'bg-buddy-excited text-buddy-excited-foreground';
      case 'parent': return 'bg-buddy-happy text-buddy-happy-foreground';
      case 'educator': return 'bg-buddy-calm text-buddy-calm-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'student': return 'Aluno';
      case 'parent': return 'Responsável';
      case 'educator': return 'Educador';
      default: return role;
    }
  };

  return (
    <Card className="shadow-soft">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5 text-primary" />
          Conexões
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Adicionar nova conexão */}
        <div className="space-y-3">
          <h3 className="text-lg font-medium">
            {user.role === 'student' 
              ? 'Conectar com responsável ou educador:' 
              : 'Conectar com aluno:'}
          </h3>
          <div className="flex gap-2">
            <Input
              placeholder="Nome de usuário"
              value={newConnectionUsername}
              onChange={(e) => setNewConnectionUsername(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addConnection()}
            />
            <Button
              onClick={addConnection}
              disabled={isLoading || !newConnectionUsername.trim()}
              className="gap-2"
            >
              <UserPlus className="w-4 h-4" />
              Conectar
            </Button>
          </div>
        </div>

        {/* Lista de conexões */}
        <div className="space-y-3">
          <h3 className="text-lg font-medium">Suas conexões:</h3>
          
          {connections.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Heart className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Nenhuma conexão ainda.</p>
              <p className="text-sm">
                {user.role === 'student' 
                  ? 'Peça para seu responsável ou educador te adicionar!' 
                  : 'Conecte-se com seus alunos para acompanhá-los.'}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {connections.map((connection) => {
                const connectedUser = user.role === 'student' 
                  ? connection.parent_educator 
                  : connection.student;
                
                const connectedRole = user.role === 'student'
                  ? 'parent' // ou 'educator', mas não temos essa info aqui
                  : 'student';

                return (
                  <div 
                    key={connection.id}
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      {connectedUser?.avatar_url && (
                        <img 
                          src={connectedUser.avatar_url}
                          alt={`Avatar de ${connectedUser.username}`}
                          className="w-10 h-10 rounded-full"
                        />
                      )}
                      <div>
                        <p className="font-medium">{connectedUser?.username}</p>
                        <Badge 
                          variant="secondary" 
                          className={`text-xs ${getRoleColor(connectedRole)}`}
                        >
                          {getRoleLabel(connectedRole)}
                        </Badge>
                      </div>
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeConnection(connection.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}