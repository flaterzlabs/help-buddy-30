import { useCustomAuth } from "@/hooks/useCustomAuth";
import { StudentDashboard } from "@/components/StudentDashboard";
import { ParentEducatorDashboard } from "@/components/ParentEducatorDashboard";

const Index = () => {
  const { user, logout } = useCustomAuth();

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto"></div>
          <p className="text-muted-foreground">Carregando perfil...</p>
        </div>
      </div>
    );
  }

  // Mostrar dashboard baseado no role
  if (user.role === 'student') {
    return (
      <StudentDashboard
        username={user.username}
        onLogout={logout}
      />
    );
  }

  return (
    <ParentEducatorDashboard
      username={user.username}
      role={user.role}
      onLogout={logout}
    />
  );
};

export default Index;
