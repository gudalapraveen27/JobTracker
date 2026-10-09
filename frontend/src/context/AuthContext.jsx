import { useMemo, useState } from "react";

import AuthContext from "./contextValue";
export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => { try { return JSON.parse(localStorage.getItem("user") || "null"); } catch { return null; } });
  const login = (token, nextUser) => { localStorage.setItem("token", token); localStorage.setItem("user", JSON.stringify(nextUser)); setUser(nextUser); };
  const logout = () => { localStorage.removeItem("token"); localStorage.removeItem("user"); setUser(null); };
  const value = useMemo(() => ({ user, login, logout }), [user]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
