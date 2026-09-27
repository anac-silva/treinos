import { IoPeopleCircleOutline } from "react-icons/io5";
import { FaCalendarAlt } from "react-icons/fa";
import { IoToday } from "react-icons/io5";
import { FaArrowRightLong } from "react-icons/fa6";

function Home() {
  return (
    <div className="w-screen">
      <div className="flex m-6">
        <div>
          <h1 className="text-texto-principal font-semibold text-4xl">Olá, Leonardo!</h1>
          <p className="text-gray-500">Disciplina hoje, resultados sempre.</p>
        </div>
        <div>
          data
        </div>
      </div>

      <div className="flex justify-around my-6" >

        <div className="bg-gray-200 shadow-md h-[100px] w-[220px] p-3 rounded-lg">
          <div className="flex justify-between" >
            <h2 className="text-3xl font-bold text-detalhes-secundaria">32</h2>
            <IoPeopleCircleOutline />
          </div>
          <p>Clientes ativos</p>
        </div>

        <div className="bg-gray-200 shadow-md h-[100px] w-[220px] p-3 rounded-lg">
          <div className="flex justify-between" >
            <h2 className="text-3xl font-bold text-detalhes-secundaria">18</h2>
            <FaCalendarAlt />
          </div>
          <p>Agendamentos da semana</p>
        </div>

        <div className="bg-gray-200 shadow-md h-[100px] w-[220px] p-3 rounded-lg">
          <div className="flex justify-between" >
            <h2 className="text-3xl font-bold text-detalhes-secundaria">5</h2>
            <IoToday /> 
          </div>
          <p >Atendimentos de hoje</p>
        </div>

      </div>

      <div>
        <div className="flex">
          <h1>Agenda da semana</h1>
          <p>Ver agenda completa </p>
          <FaArrowRightLong />
        </div>
        <p>Hoje</p>
        <div >
          <div className="flex">
            <p>08:00</p>
            <p>Carlos Silva</p>
            <p>Avaliaçao física</p>
            <p>Concluído</p>
          </div>

          <div className="flex">
            <p>09:00</p>
            <p>Mariana Costa</p>
            <p>Treino inferiores</p>
            <p>Em andamento</p>
          </div>

          <div className="flex">
            <p>13:00</p>
            <p>Julio Pereira</p>
            <p>Treino Superiores</p>
            <p>Pendente</p>
          </div>
        </div>
        
      </div>
    </div>
  );
}

export default Home;