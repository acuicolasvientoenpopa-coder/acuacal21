import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { createClient, type User } from "@supabase/supabase-js";
import type { Plan, Rol } from "@/core";

const SUPABASE_URL = "https://smvjffbeshxcfltjoolm.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_EQRvreJDv4d-wYZmaMY3Bg_x2D3kM_v";
const API_URL = "https://acuacal21-production.up.railway.app/api";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: true, autoRefreshToken: true },
});

type AuthContext = {
  user: User | null;
  token: string | null;
  loading: boolean;
  plan: Plan;
  rol: Rol;
  login: (email: string, password: string) => Promise<string | null>;
  register: (email: string, password: string, nombre: string) => Promise<string | null>;
  resetPassword: (email: string) => Promise<string | null>;
  logout: () => Promise<void>;
  supabase: typeof supabase;
  apiUrl: string;
};

const Ctx = createContext<AuthContext | null>(null);

function getPlanFromUser(u: User | null): Plan {
  return (u?.user_metadata?.plan as Plan) || "free";
}

function getRolFromUser(u: User | null): Rol {
  return (u?.user_metadata?.rol as Rol) || "productor";
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [plan, setPlan] = useState<Plan>("free");
  const [rol, setRol] = useState<Rol>("productor");

  useEffect(() => {
    const session = supabase.auth.getSession();
    session.then(({ data: { session } }) => {
      if (session) {
        setUser(session.user);
        setToken(session.access_token);
        setPlan(getPlanFromUser(session.user));
        setRol(getRolFromUser(session.user));
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setToken(session?.access_token ?? null);
      setPlan(getPlanFromUser(session?.user ?? null));
      setRol(getRolFromUser(session?.user ?? null));
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<string | null> => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return error?.message ?? null;
  }, []);

  const register = useCallback(async (email: string, password: string, nombre: string): Promise<string | null> => {
    const { data, error } = await supabase.auth.signUp({
      email, password,
      options: { data: { nombre, plan: "free", rol: "productor" } },
    });
    if (error) return error.message;
    if (!data.session) return "Revisá tu email para confirmar la cuenta";
    if (!data.user) return "Error al obtener usuario";

    const token = data.session.access_token;
    const res = await fetch(API_URL + "/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ userId: data.user.id, email, nombre }),
    });
    if (!res.ok) return "Error al crear perfil";
    return null;
  }, []);

  const resetPassword = useCallback(async (email: string): Promise<string | null> => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin + "/" });
    return error?.message ?? null;
  }, []);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setToken(null);
  }, []);

  return (
    <Ctx.Provider value={{ user, token, loading, plan, rol, login, register, resetPassword, logout, supabase, apiUrl: API_URL }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth debe usarse dentro de AuthProvider");
  return ctx;
}
