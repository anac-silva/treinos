import { Sidebar } from "./layout/sidebar"
import Home from "../pages/home/home"
import { Routes, Route } from "react-router-dom";
import Clientes from "../pages/clientes/clientes";
import Agendamentos from "../pages/agendamentos/agendamentos";
import VisaoGeralCliente from "../pages/detalhesClientes/visaoGeral";
import NovoCliente from "../pages/novosClientes/novoCliente";
import Configuracoes from "../pages/configuracoes/configuracoes";
import NovaAvaliacao from "../pages/detalhesClientes/novaAvaliacao";
import MedidasCliente from "../pages/detalhesClientes/medidasCliente";
import TreinosCliente from "../pages/detalhesClientes/treinosCliente";
import CatalogProvider from "../contexts/CatalogProvider";

function Body() {
    return (
        <CatalogProvider><div className="app-layout">
            <Sidebar/>

            <Routes>
                <Route path="/" element={<Home />}/>
                <Route path="/clientes" element={<Clientes />}/>
                <Route path="/agendamentos" element={<Agendamentos />}/>   
                <Route path="/clientes/visaogeral" element={<VisaoGeralCliente />}/> 
                <Route path="/agendamentos/novoagendamento" />
                <Route path="/clientes/novocliente" element={<NovoCliente />}/>
                <Route path="/configuracoes" element={<Configuracoes />}/>
                <Route path="/clientes/novaavaliacao" element={<NovaAvaliacao />}/>
                <Route path="/clientes/medidas" element={<MedidasCliente />}/>
                <Route path="/clientes/treinos" element={<TreinosCliente />}/>
            </Routes>
        </div></CatalogProvider>
    )
}

export default Body;
