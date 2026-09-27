import { Sidebar } from "./layout/sidebar"
import Home from "../pages/home/home"

function Body() {
    return (
        <div className="flex h-screen bg-background justify-between"> 
            <Sidebar/>
            <Home/>
        </div>
    )
}

export default Body;