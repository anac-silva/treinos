import { BsHouseDoor } from "react-icons/bs";
import { MdOutlinePeopleAlt } from "react-icons/md";
import { FaRegCalendarCheck } from "react-icons/fa";
import { FiSettings } from "react-icons/fi";
import logo from "../../assets/logo-removebg-preview.png";
import { NavLink } from "react-router-dom";

export function Sidebar() {
    return (
        <aside className="sidebar">
           <div className="sidebar-brand">
                <img src={logo} alt="Leonardo Personal Trainer" />
           </div>
           <nav className="sidebar-nav" aria-label="Navegação principal">
                <NavLink to="/" className="sidebar-link">
                    <BsHouseDoor />
                    <span>Início</span>
                </NavLink>
                <NavLink to="/clientes" className="sidebar-link">
                    <MdOutlinePeopleAlt />
                    <span>Clientes</span>
                </NavLink>
                <NavLink to="/agendamentos" className="sidebar-link">
                    <FaRegCalendarCheck />
                    <span>Agendamentos</span>
                </NavLink>
           </nav>
           <div className="sidebar-bottom">
                <div className="sidebar-link"><FiSettings /><span>Configurações</span></div>
                <div className="trainer-profile">
                    <div className="avatar avatar-trainer">L</div>
                    <div><strong>Leonardo</strong><span>Personal Trainer</span></div>
                </div>
           </div>
        </aside>
    )
}