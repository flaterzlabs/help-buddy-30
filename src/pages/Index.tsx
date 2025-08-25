import { useState } from "react";
import { LoginForm } from "@/components/LoginForm";
import { RoleSelector, type UserRole } from "@/components/RoleSelector";
import { StudentDashboard } from "@/components/StudentDashboard";
import { ParentEducatorDashboard } from "@/components/ParentEducatorDashboard";

type AppState = 'login' | 'roleSelector' | 'dashboard';

interface User {
  username: string;
  role: UserRole;
}

const Index = () => {
  const [appState, setAppState] = useState<AppState>('login');
  const [user, setUser] = useState<User | null>(null);

  const handleLogin = (username: string) => {
    // Por enquanto, simular login como estudante
    setUser({ username, role: 'student' });
    setAppState('dashboard');
  };

  const handleRoleSelect = (role: UserRole) => {
    const username = prompt(`Digite seu nome para criar conta como ${
      role === 'student' ? 'Estudante' : 
      role === 'parent' ? 'Pai/Mãe' : 'Educador'
    }:`);
    
    if (username?.trim()) {
      setUser({ username: username.trim(), role });
      setAppState('dashboard');
    }
  };

  const handleLogout = () => {
    setUser(null);
    setAppState('login');
  };

  const handleShowRoleSelector = () => {
    setAppState('roleSelector');
  };

  const handleBackToLogin = () => {
    setAppState('login');
  };

  // Renderizar baseado no estado da aplicação
  switch (appState) {
    case 'roleSelector':
      return (
        <RoleSelector 
          onRoleSelect={handleRoleSelect}
          onBack={handleBackToLogin}
        />
      );
    
    case 'dashboard':
      if (!user) return null;
      
      if (user.role === 'student') {
        return (
          <StudentDashboard
            username={user.username}
            onLogout={handleLogout}
          />
        );
      } else {
        return (
          <ParentEducatorDashboard
            username={user.username}
            role={user.role}
            onLogout={handleLogout}
          />
        );
      }
    
    case 'login':
    default:
      return (
        <LoginForm 
          onLogin={handleLogin}
          onShowRoleSelector={handleShowRoleSelector}
        />
      );
  }
};

export default Index;
