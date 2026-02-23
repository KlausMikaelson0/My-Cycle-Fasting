import { ReactNode, createContext, useContext, useEffect, useMemo, useState } from "react";

import { fetchMe, login as loginRequest, register as registerRequest } from "../api/endpoints";
import { Language } from "../i18n";
import { UserProfile } from "../types/models";
import { STORAGE_TOKEN_KEY, STORAGE_USER_KEY } from "../utils/constants";
import { useLanguage } from "./LanguageContext";

interface AuthContextValue {
  user: UserProfile | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (payload: { email: string; password: string }) => Promise<void>;
  register: (payload: { email: string; password: string; language: Language }) => Promise<void>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
  updateUserLocally: (user: UserProfile) => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function readStoredUser(): UserProfile | null {
  const raw = localStorage.getItem(STORAGE_USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as UserProfile;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const { setLanguage } = useLanguage();
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(STORAGE_TOKEN_KEY));
  const [user, setUser] = useState<UserProfile | null>(() => readStoredUser());
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const persistAuth = (nextToken: string, nextUser: UserProfile) => {
    localStorage.setItem(STORAGE_TOKEN_KEY, nextToken);
    localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(nextUser));
    setToken(nextToken);
    setUser(nextUser);
    setLanguage(nextUser.language);
  };

  const clearAuth = () => {
    localStorage.removeItem(STORAGE_TOKEN_KEY);
    localStorage.removeItem(STORAGE_USER_KEY);
    setToken(null);
    setUser(null);
  };

  useEffect(() => {
    const bootstrap = async () => {
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const profile = await fetchMe();
        setUser(profile);
        localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(profile));
        setLanguage(profile.language);
      } catch {
        clearAuth();
      } finally {
        setIsLoading(false);
      }
    };

    void bootstrap();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = async (payload: { email: string; password: string }) => {
    const response = await loginRequest(payload);
    persistAuth(response.token, response.user);
  };

  const register = async (payload: { email: string; password: string; language: Language }) => {
    const response = await registerRequest(payload);
    persistAuth(response.token, response.user);
  };

  const logout = () => {
    clearAuth();
  };

  const refreshProfile = async () => {
    const profile = await fetchMe();
    setUser(profile);
    localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(profile));
    setLanguage(profile.language);
  };

  const updateUserLocally = (nextUser: UserProfile) => {
    setUser(nextUser);
    localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(nextUser));
    setLanguage(nextUser.language);
  };

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      isAuthenticated: Boolean(token && user),
      isLoading,
      login,
      register,
      logout,
      refreshProfile,
      updateUserLocally,
    }),
    [isLoading, token, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
