import React, { useEffect, useState } from "react";

import sio from "../auth/socket";
import info from "../auth/appinfo";
import axios from "axios";

import { usePlanContext } from "./PlanContext";
import { getCookie } from "../auth/cookies";
import { toast } from "react-toastify";

export default function PlanTab() {
    const [inputValue, setInputValue] = useState("");
    const [observationName, setObservationName] = useState("");
    const [objectName, setObjectName] = useState(null);
    const [startTime, setStartTime] = useState("");
    const [isValid, setIsValid] = useState(true);
    const [ra, setRA] = useState(null);
    const [dec, setDEC] = useState(null);

    const [exptime, setExptime] = useState(0.1);

    const [availableFilters, setAvailableFilters] = useState([]);
    const [selectedFilters, setSelectedFilters] = useState([]);
    const [reductionTypes, setReductionTypes] = useState([]); // ["bias", "dark", "flat", "light"
    const [frameMode, setFrame] = useState("Flat-Field");

    const [currentObservationStatus, setCurrentObservationStatus] = useState(null); // null for loading, true for OK, false for not OK
    const [futureObservationStatus, setFutureObservationStatus] = useState(null);

    const [preList, setPreList] = useState([]);

    const { setShouldRefetch } = usePlanContext();

    const celestialObjects = [
        { label: "Mercury", value: "mercury" },
        { label: "Venus", value: "venus" },
        { label: "Moon", value: "moon" },
        { label: "Mars", value: "mars" },
        { label: "Jupiter", value: "jupiter barycenter" },
        { label: "Saturn", value: "saturn barycenter" },
        { label: "Uranus", value: "uranus barycenter" },
        { label: "Neptune", value: "neptune barycenter" },
    ];

    const toggleFilter = (filter) => {
        setSelectedFilters(prevFilters => {
            if (prevFilters.includes(filter)) {
                // Filter is currently selected, remove it from the array
                return prevFilters.filter(f => f !== filter);
            } else {
                // Filter is not selected, add it to the array
                return [...prevFilters, filter];
            }
        });
    };

    const fetch_pre_list = () => {
        axios.get("/api/get_observable_presaved_list/")
            .then((response) => {
                setPreList(response.data);
            })
            .catch((error) => {
                console.log(error);
            });
    }

    useEffect(() => {
        fetch_pre_list();
        const interval = setInterval(() => {
            fetch_pre_list();
        }, 300000);   
        return () => clearInterval(interval);
    }, [])

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

        async function getInfo(){
            const reductionTypes = await info.get('TIPOS_FRAME');
            const filters = await info.get('FILTROS');
            setReductionTypes(reductionTypes);
            setAvailableFilters(filters);
        }
        getInfo();
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

    const observar = (plan_id) => {
        axios.post("/api/execute_plan/", { plan_id }, {headers: {'X-CSRFToken': getCookie('csrftoken')}})
            .then((response) => {
                if (response.data.status === "success"){
                    toast.success("Observação iniciada com sucesso!")
                    // resetStates();
                    setShouldRefetch(true);
                }else{
                    toast.error(response.data.message)
                }
            })
            .catch((error) => {
                console.log(error);
            });
    }

    const resetStates = () => {
        setInputValue("");
        setObjectName(null);
        setObservationName("");
        setStartTime("");
        setIsValid(true);
        setRA("");
        setDEC("");
        setExptime(0.1);
        setSelectedFilters([]);
        setFrame("");
        setCurrentObservationStatus(null);
        setFutureObservationStatus(null);
    }

    const salvarPlano = (observarnow = false) => {
        console.log(ra, dec, objectName)
        console.log(((ra === null || dec === null) && (objectName === "")))
        if (selectedFilters.length === 0 || frameMode === "" || exptime === 0 || startTime === "" || startTime === null || observationName === "" || ((ra === null && dec === null) && (objectName === ""))) {
            toast.error("Preencha todos os campos");
            return;
        }

        // if (!futureObservationStatus) {
        //     toast.error("Plano nao aprovado.");
        //     return;
        // }

        // if (observarnow && !currentObservationStatus) {
        //     toast.error("Plano nao aprovado para observação agora.");
        //     return;
        // }

        const data = {
            name: observationName,
            ra: ra,
            dec: dec,
            filters: selectedFilters,
            framemode: frameMode,
            exptime: exptime,
            date: startTime
        };

        // Include object_name if selected
        if (objectName) {
            data.object_name = objectName;
        }

        axios.post("/api/create_plan/", data, { headers: { 'X-CSRFToken': getCookie('csrftoken') } })
            .then((response) => {
                if (response.data.status === "success") {
                    if (observarnow) {
                        observar(response.data.plan_id);
                    }

                    resetStates();
                    setShouldRefetch(true);
                    toast.success("Plano salvo com sucesso");
                } else {
                    toast.error(response.data.message);
                }
            })
            .catch((error) => {
                console.log(error);
            });
    };

    const setPlanFromPreList = (e) => {
        const plan = preList.find(plan => plan.Name === e.target.value);
        
        setObservationName(plan.Name);
        setRA(plan.RA);
        setDEC(plan.DEC);
        setInputValue(`${plan.RA}  ${plan.DEC}`);
        sio.send("checkcoord", {ra: plan.RA, dec: plan.DEC});
    }


    return (
        <div className="w-full max-w-lg mx-auto py-6 px-4 rounded-md">
            <h3 className="font-bold text-2xl mb-4">Planejamento de observação</h3>
            
            <div className="py-4 mb-4 w-full border border-red-400 rounded-md">
                <div className="pl-2">
                <p>Selecione um plano já pronto se preferir.</p>
                <select onChange={(e) => setPlanFromPreList(e)} className="py-2 px-4 border rounded-md">
                    {preList.map((plan) => (
                        <option key={plan.id} value={plan.id}>{plan.Name}</option>
                    ))}
                </select>
                </div>
            </div>

            <div className="mb-4">
                <label className="block text-gray-700 font-medium mb-2">Celestial Object (Optional):</label>
                <select
                    value={objectName}
                    onChange={(e) => {
                        setObjectName(e.target.value)
                        setInputValue("");
                        setRA(null);
                        setDEC(null);
                    }}
                    className="w-full p-2 border rounded-md"
                >
                    <option key={0} value={null}>
                        {null}
                    </option>
                    {celestialObjects.map((object) => (
                        <option key={object.value} value={object.label}>
                            {object.label}
                        </option>
                    ))}
                </select>
            </div>

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
                    className={`w-full p-2 border rounded-md`}
                    placeholder="Digite as coordenadas..."
                    disabled={!(objectName === null || objectName === "")}
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
                    <p className="text-sm">{currentObservationStatus === null ? 'Não aprovado' : currentObservationStatus ? 'Aprovado' : 'Não aprovado'}</p>
                </div>

                <div className="bg-white p-4 border rounded-md shadow-sm relative">
                    <p className="text-gray-700 font-medium">Observação no horário:</p>
                    <div className={`absolute top-0 right-0 mt-4 mr-4 w-6 h-6 rounded-full ${futureObservationStatus === null ? 'bg-yellow-400' : futureObservationStatus ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    <p className="text-sm">{futureObservationStatus === null ? 'Não aprovado' : futureObservationStatus ? 'Aprovado' : 'Não aprovado'}</p>
                </div>
            </div>

            <div className="my-4">
                <label className="block text-gray-700 font-medium mb-2">Tempo de exposição (segundos):</label>
                <input
                    type="number"
                    value={exptime}
                    onChange={(e) => setExptime(e.target.value)}
                    className="w-full p-2 border rounded-md"
                    placeholder="Digite o nome..."
                />
            </div>

            <div className="my-4">
                <label className="block text-gray-700 font-medium mb-2">Filtros a observar:</label>
                <div className="flex space-x-2">
                    {availableFilters.map(filter => (
                        <button
                            key={filter}
                            className={`p-2 ${selectedFilters.includes(filter) ? 'bg-quaternary text-white' : 'bg-gray-200'} rounded-md`}
                            onClick={() => toggleFilter(filter)}
                        >
                            {filter}
                        </button>
                    ))}
                </div>
            </div>

            <div className="my-4">
                <label className="block text-gray-700 font-medium mb-2">Tipo de frame:</label>
                <select 
                    value={frameMode} 
                    onChange={(e) => setFrame(e.target.value)} 
                    className="w-full p-2 border rounded-md"
                >
                    <option value="">Selecione</option>
                    {reductionTypes.map(type => (
                        <option key={type} value={type}>{type}</option>
                    ))}
                </select>
            </div>

            <div className="text-center w-full grid grid-cols-2 gap-4 mt-4">
                <button onClick={() => salvarPlano(true)} className={`${currentObservationStatus === null ? 'bg-yellow-400' : currentObservationStatus ? 'bg-green-500' : 'bg-red-500'} w-full text-white px-3 py-2 rounded-md transition`}>Salvar e Observar agora</button>
                <button onClick={() => salvarPlano()} className={`${currentObservationStatus === null ? 'bg-yellow-400' : futureObservationStatus ? 'bg-green-500' : 'bg-red-500'} w-full text-white px-3 py-2 rounded-md transition`}>Salvar Plano</button>
            </div>
        </div>
    );
}
