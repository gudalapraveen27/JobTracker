import { Link, useNavigate } from "react-router-dom";
import useAuth from "../context/useAuth";
export default function Navbar() {
  const { user, logout } = useAuth(); const navigate = useNavigate();
  const leave = () => { logout(); navigate("/login"); };
  return <header className="navbar"><div className="container nav-inner"><Link to="/" className="brand"><img className="brand-mark" src="/jobtracker-mark.svg" alt="" /> JobTracker</Link><nav aria-label="Main navigation">
    <Link to="/">Home</Link><Link to="/jobs">Jobs</Link>
    {user?.role === "jobseeker" && <Link to="/my-applications">My Applications</Link>}
    {["recruiter", "admin"].includes(user?.role) && <><Link to="/recruiter">Dashboard</Link><Link to="/applicants">Applicants</Link></>}
    {!user ? <><Link to="/login" className="nav-login">Login</Link><Link to="/register" className="button button-small">Get started</Link></> : <button className="nav-logout" onClick={leave}>Logout</button>}
  </nav></div></header>;
}
