import { useContext } from "react";
import AuthContext from "./contextValue";
export default function useAuth() { return useContext(AuthContext); }
