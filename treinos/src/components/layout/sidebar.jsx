import { BsHouseDoor } from "react-icons/bs";
import { MdOutlinePeopleAlt } from "react-icons/md";
import { CgGym } from "react-icons/cg";
import { FaPenToSquare } from "react-icons/fa6";
import { FaRegCalendarCheck } from "react-icons/fa";
import logo from "../../assets/logo-removebg-preview.png";

export function Sidebar() {
    return (
        <aside className="flex w-64 flex-col bg-principal p-4 text-white">
           <div className="flex items-center justify-center">
                <img src={logo} alt="Logotipo" className="h-30 w-auto object-contain" />
           </div>
           <nav className="flex flex-col gap-3">
                <div className="flex items-center gap-3 rounded-lg px-8 py-2 hover:bg-linear-to-r hover:from-secundaria hover:to-detalhes-secundaria">
                    <BsHouseDoor className="text-lg" />
                    <h2 className="text-base font-medium">Início</h2>
                </div>

                <div className="flex items-center gap-3 rounded-lg px-8 py-2 hover:bg-linear-to-r hover:from-secundaria hover:to-detalhes-secundaria">
                    <MdOutlinePeopleAlt className="text-lg" />
                    <h2 className="text-base font-medium">Clientes</h2>
                </div>

                <div className="flex items-center gap-3 rounded-lg px-8 py-2 hover:bg-linear-to-r hover:from-secundaria hover:to-detalhes-secundaria">
                    <CgGym className="text-lg" />
                    <h2 className="text-base font-medium">Treinos</h2>
                </div>

                <div className="flex items-center gap-3 rounded-lg px-8 py-2 hover:bg-linear-to-r hover:from-secundaria hover:to-detalhes-secundaria">
                    <FaPenToSquare className="text-lg" />
                    <h2 className="text-base font-medium">Avaliações</h2>
                </div>

                <div className="flex items-center gap-3 rounded-lg px-8 py-2 hover:bg-linear-to-r hover:from-secundaria hover:to-detalhes-secundaria">
                    <FaRegCalendarCheck className="text-lg" />
                    <h2 className="text-base font-medium">Agendamentos</h2>
                </div>
           </nav>
        </aside>
    )
}