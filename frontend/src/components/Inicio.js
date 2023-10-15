import React from "react";
import { useNavigate } from "react-router-dom";

export default function Inicio(){
    const navigate = useNavigate();

    return (
        <button 
            className="absolute px-2 py-2 bg-primary top-2 left-2 z-10 text-white rounded-lg" 
            onClick={() => navigate('/')}>
                Início
            </button>
    );
}
