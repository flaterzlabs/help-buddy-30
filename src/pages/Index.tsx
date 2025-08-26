import { useAuth } from "@/hooks/useAuth";
import { StudentDashboard } from "@/components/StudentDashboard";
import { ParentEducatorDashboard } from "@/components/ParentEducatorDashboard";

const Index = () => {
  const { profile, signOut } = useAuth();

  if (!profile) {
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
  if (profile.role === 'student') {
    return (
      <StudentDashboard
        username={profile.username}
        onLogout={signOut}
      />
    );
  }

  return (
    <ParentEducatorDashboard
      username={profile.username}
      role={profile.role}
      onLogout={signOut}
    />
  );
};

export default Index;
