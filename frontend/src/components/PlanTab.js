import React, { useEffect, useState } from "react";

import sio from "../auth/socket";

export default function PlanTab() {
    const [inputValue, setInputValue] = useState("");
    const [observationName, setObservationName] = useState("");
    const [startTime, setStartTime] = useState("");
    const [isValid, setIsValid] = useState(true);
    const [ra, setRA] = useState("");
    const [dec, setDEC] = useState("");

    const [currentObservationStatus, setCurrentObservationStatus] = useState(null); // null for loading, true for OK, false for not OK
    const [futureObservationStatus, setFutureObservationStatus] = useState(null);


    useEffect(() => {
        sio.on("message", (message) => {
            console.log(message);
        });

        sio.on("coordchecked", (message) => {
            console.log(message)
            setCurrentObservationStatus(message.allowed);
        });

        sio.on("coordcheckedondate", (message) => {
            console.log(message)
            setFutureObservationStatus(message.allowed);   
        });

    }, []);


    const handleInputChange = (e) => {
        setInputValue(e.target.value);

        // Check if the input matches the pattern of two spaces
        if (e.target.value.split("  ").length === 2) {
            setIsValid(true);
            const [raValue, decValue] = e.target.value.split("  ");
            setRA(raValue);
            setDEC(decValue);

            sio.send("checkcoord", {ra: raValue, dec: decValue});

            if (startTime !== "" && startTime !== null){
                sio.send("checkcoordondate", {ra: raValue, dec: decValue, date: startTime});
            }
        } else {
            setIsValid(false);
        }
    };

    const handleDateChange = (value) => {
        setStartTime(value);
        sio.send("checkcoordondate", {ra: ra, dec: dec, date: value});
    }

    const observar = () => {
    
    }

    const salvarPlano = () => {
        console.log("salvarPlano")    
    }

    return (
        <div className="w-full max-w-lg mx-auto py-6">
            <div className="mb-4">
                <label className="block text-gray-700 font-medium mb-2">Nome da observação:</label>
                <input
                    type="text"
                    value={observationName}
                    onChange={(e) => setObservationName(e.target.value)}
                    className="w-full p-2 border rounded-md"
                    placeholder="Digite o nome..."
                />
            </div>
            
            <div className="mb-4">
                <label className="block text-gray-700 font-medium mb-2">Horário de observação:</label>
                <input
                    type="datetime-local"
                    value={startTime}
                    onChange={(e) => handleDateChange(e.target.value)}
                    className="w-full p-2 border rounded-md"
                />
            </div>

            <div className="mb-4">
                <label className="block text-gray-700 font-medium mb-2">Coordenadas (RA  DEC) (separados por dois espaços):</label>
                <input
                    type="text"
                    value={inputValue}
                    onChange={handleInputChange}
                    className={`w-full p-2 border ${
                        isValid ? "border-green-500" : "border-red-500"
                    } rounded-md`}
                    placeholder="Digite as coordenadas..."
                />
            </div>

            {!isValid && (
                <p className="text-red-500">Coordenadas não identificadas. RA e DEC devem estar separados por dois espaços.</p>
            )}

            <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="bg-white p-4 border rounded-md shadow-sm">
                    <p className="text-gray-700 font-medium">RA:</p>
                    <p className="text-gray-900 mt-2">{ra}</p>
                </div>

                <div className="bg-white p-4 border rounded-md shadow-sm">
                    <p className="text-gray-700 font-medium">DEC:</p>
                    <p className="text-gray-900 mt-2">{dec}</p>
                </div>

                <div className="bg-white p-4 border rounded-md shadow-sm relative">
                    <p className="text-gray-700 font-medium">Observação agora:</p>
                    <div className={`absolute top-0 right-0 mt-4 mr-4 w-6 h-6 rounded-full ${currentObservationStatus === null ? 'bg-yellow-400' : currentObservationStatus ? 'bg-green-500' : 'bg-red-500'}`}></div>
                </div>

                <div className="bg-white p-4 border rounded-md shadow-sm relative">
                    <p className="text-gray-700 font-medium">Observação no horário:</p>
                    <div className={`absolute top-0 right-0 mt-4 mr-4 w-6 h-6 rounded-full ${futureObservationStatus === null ? 'bg-yellow-400' : futureObservationStatus ? 'bg-green-500' : 'bg-red-500'}`}></div>
                </div>
            </div>

            <div className="text-center w-full grid grid-cols-2 gap-4 mt-4">
                <button onClick={() => observar()} className={`${currentObservationStatus === null ? 'bg-yellow-400' : currentObservationStatus ? 'bg-green-500' : 'bg-red-500'} w-full text-white px-3 py-2 rounded-md transition`}>Observar</button>
                <button onClick={() => salvarPlano()} className={`${currentObservationStatus === null ? 'bg-yellow-400' : futureObservationStatus ? 'bg-green-500' : 'bg-red-500'} w-full text-white px-3 py-2 rounded-md transition`}>Salvar Plano</button>
            </div>
        </div>
    );
}
