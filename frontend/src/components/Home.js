import { useNavigate } from "react-router-dom"

export default function Home(){

    const navigate = useNavigate();
    return (
        <div className="py-6">
            <h2 className="text-center text-2xl font-semibold">Argus - Telescópio nas Escolas</h2>

            <button onClick={() => navigate("/observation")}>Observar!</button>
        </div>
    )
} 