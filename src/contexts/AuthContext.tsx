import React, { useEffect, useState, createContext, useContext } from 'react';
type User = {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'cashier' | 'waiter' | 'cook';
};
type AuthContextType = {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{
    success: boolean;
    user: User | null;
  }>;
  logout: () => void;
};
const AuthContext = createContext<AuthContextType | undefined>(undefined);
// Mapeo de emails a roles para determinar automáticamente el rol del usuario
const emailToRoleMap: Record<string, {
  role: 'admin' | 'cashier' | 'waiter' | 'cook';
  name: string;
}> = {
  'admin@gastrobar.com': {
    role: 'admin',
    name: 'Administrador'
  },
  'cajero@gastrobar.com': {
    role: 'cashier',
    name: 'Cajero Principal'
  },
  'mesero@gastrobar.com': {
    role: 'waiter',
    name: 'Mesero Principal'
  },
  'cocinero@gastrobar.com': {
    role: 'cook',
    name: 'Chef Principal'
  },
  'bartender@gastrobar.com': {
    role: 'cook',
    name: 'Bartender Principal'
  }
  // Añadir más emails según sea necesario
};
export const AuthProvider: React.FC<{
  children: React.ReactNode;
}> = ({
  children
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    // Check if user is already logged in
    const storedUser = localStorage.getItem('gastrobar_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);
  const login = async (email: string, password: string): Promise<{
    success: boolean;
    user: User | null;
  }> => {
    // Simulate API call
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 800));
    // Determine role based on email
    const userInfo = emailToRoleMap[email.toLowerCase()];
    let mockUser: User;
    if (!userInfo) {
      // Si el email no está en el mapeo, asignar rol de mesero por defecto
      mockUser = {
        id: '1',
        name: `Usuario (${email})`,
        email: email,
        role: 'waiter'
      };
    } else {
      // Si el email está en el mapeo, asignar el rol correspondiente
      mockUser = {
        id: '1',
        name: userInfo.name,
        email: email,
        role: userInfo.role
      };
    }
    setUser(mockUser);
    localStorage.setItem('gastrobar_user', JSON.stringify(mockUser));
    setIsLoading(false);
    return {
      success: true,
      user: mockUser
    };
  };
  const logout = () => {
    setUser(null);
    localStorage.removeItem('gastrobar_user');
  };
  return <AuthContext.Provider value={{
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout
  }}>
      {children}
    </AuthContext.Provider>;
};
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};