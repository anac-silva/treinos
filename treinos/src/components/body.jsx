import { Sidebar } from "./layout/sidebar"
import Home from "../pages/home/home"
import { Routes, Route } from "react-router-dom";
import Clientes from "../pages/clientes/clientes";
import Agendamentos from "../pages/agendamentos/agendamentos";
import VisaoGeralCliente from "../pages/detalhesClientes/visaoGeral";
import NovoCliente from "../pages/novosClientes/novoCliente";

function Body() {
    return (
        <div className="app-layout">
            <Sidebar/>

            <Routes>
                <Route path="/" element={<Home />}/>
                <Route path="/clientes" element={<Clientes />}/>
                <Route path="/agendamentos" element={<Agendamentos />}/>   
                <Route path="/clientes/visaogeral" element={<VisaoGeralCliente />}/> 
                <Route path="/agendamentos/novoagendamento" />
                <Route path="/clientes/novocliente" element={<NovoCliente />}/>
            </Routes>
        </div>
    )
}

export default Body;