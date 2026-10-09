import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Jobs from "./pages/Jobs";
import JobDetails from "./pages/JobDetails";
import MyApplications from "./pages/MyApplications";
import RecruiterDashboard from "./pages/RecruiterDashboard";
import Applicants from "./pages/Applicants";
import Navbar from "./components/Navbar";
import { AuthProvider } from "./context/AuthContext";
import { RoleRoute } from "./components/RoleRoute";
import "./App.css";

export default function App() {
    return <AuthProvider><BrowserRouter><Navbar /><main className="site-main"><Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/jobs" element={<Jobs />} />
        <Route path="/jobs/:id" element={<JobDetails />} />
        <Route path="/my-applications" element={<RoleRoute roles={["jobseeker"]}><MyApplications /></RoleRoute>} />
        <Route path="/recruiter" element={<RoleRoute roles={["recruiter", "admin"]}><RecruiterDashboard /></RoleRoute>} />
        <Route path="/applicants" element={<RoleRoute roles={["recruiter", "admin"]}><Applicants /></RoleRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
    </Routes></main><footer className="footer"><div className="container footer-inner"><span>JobTracker</span><span>Find your next opportunity. Keep every application in view.</span></div></footer></BrowserRouter></AuthProvider>;
}
