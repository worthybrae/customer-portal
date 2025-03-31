// src/components/auth/UserProvider.tsx
import { useState, useEffect, createContext, useContext } from 'react';
import { useSession } from './AuthWrapper';
import { getUserCompany } from '@/services/companyService';
import { Company } from '@/types';

interface UserContextType {
  userCompany: Company | null;
  refreshUserCompany: () => Promise<void>;
  loading: boolean;
}

export const UserContext = createContext<UserContextType>({
  userCompany: null,
  refreshUserCompany: async () => {},
  loading: true,
});

export function useUser() {
  return useContext(UserContext);
}

interface UserProviderProps {
  children: React.ReactNode;
}

export function UserProvider({ children }: UserProviderProps) {
  const session = useSession();
  const [userCompany, setUserCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserCompany = async () => {
    if (!session?.user) {
      setUserCompany(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { company } = await getUserCompany(session.user.id);
      setUserCompany(company);
    } catch (error) {
      console.error('Error fetching user company:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch company data when session changes
  useEffect(() => {
    fetchUserCompany();
  }, [session]);

  const refreshUserCompany = async () => {
    await fetchUserCompany();
  };

  return (
    <UserContext.Provider
      value={{
        userCompany,
        refreshUserCompany,
        loading,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}