import React, { useState } from "react";

export default function PlanTab() {
    const [inputValue, setInputValue] = useState("");
    const [observationName, setObservationName] = useState("");
    const [startTime, setStartTime] = useState("");
    const [isValid, setIsValid] = useState(true);
    const [ra, setRA] = useState("");
    const [dec, setDEC] = useState("");

    const handleInputChange = (e) => {
        setInputValue(e.target.value);

        // Check if the input matches the pattern of two spaces
        if (e.target.value.split("  ").length === 2) {
            setIsValid(true);
            const [raValue, decValue] = e.target.value.split("  ");
            setRA(raValue);
            setDEC(decValue);
        } else {
            setIsValid(false);
        }
    };

    return (
        <div className="w-full max-w-lg mx-auto">
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
                <label className="block text-gray-700 font-medium mb-2">Horário de início:</label>
                <input
                    type="datetime-local"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full p-2 border rounded-md"
                />
            </div>

            <div className="mb-4">
                <label className="block text-gray-700 font-medium mb-2">Coordenadas (RA  DEC) (separados por dois espaços.):</label>
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
            </div>
        </div>
    );
}
