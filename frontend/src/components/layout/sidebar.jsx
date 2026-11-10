import { BsHouseDoor } from "react-icons/bs";
import { MdOutlinePeopleAlt } from "react-icons/md";
import { FaRegCalendarCheck } from "react-icons/fa";
import { FiActivity, FiSettings } from "react-icons/fi";
import logo from "../../assets/Logo de Movimento e Longevidade.png";
import { NavLink } from "react-router-dom";
import { useAuth } from '../../contexts/authContext';
import { localAuthBypass } from '../../lib/api';
import { useState } from 'react';

export function Sidebar() {
    const { user, logout } = useAuth();
    const [error, setError] = useState('');
    const [busy, setBusy] = useState(false);
    async function leave() {
        setBusy(true); setError('');
        try { await logout(); } catch (error) { setError(error.message); } finally { setBusy(false); }
    }
    return (
        <aside className="sidebar">
           <div className="sidebar-brand">
                <img src={logo} alt="Leonardo Asevedo — Movimento, Saúde e Longevidade" />
           </div>
           <nav className="sidebar-nav" aria-label="Navegação principal">
                <NavLink to="/" className="sidebar-link">
                    <BsHouseDoor />
                    <span>Início</span>
                </NavLink>
                <NavLink to="/clientes" className="sidebar-link">
                    <MdOutlinePeopleAlt />
                    <span>Alunos</span>
                </NavLink>
                <NavLink to="/agendamentos" className="sidebar-link">
                    <FaRegCalendarCheck />
                    <span>Agendamentos</span>
                </NavLink>
                <NavLink to="/treinos" className="sidebar-link">
                    <FiActivity />
                    <span>Modelos de treino</span>
                </NavLink>
                <NavLink to="/configuracoes" className="sidebar-link">
                    <FiSettings /><span>Configurações</span>
                </NavLink>
           </nav>
           <div className="sidebar-bottom">
                <div className="trainer-profile">
                    <div className="avatar avatar-trainer">{user?.name?.slice(0, 1)}</div>
                    <div><strong>{user?.name}</strong><span>Personal Trainer</span></div>
                </div>
                {!localAuthBypass && <><NavLink to="/alterar-senha" className="sidebar-link">Alterar senha</NavLink>
                <button onClick={leave} disabled={busy} className="button button-outline">Sair</button></>}
                {localAuthBypass && <p className="sidebar-link">Acesso local sem senha</p>}
                {error && <p role="alert">{error}</p>}
           </div>
        </aside>
    )
}
