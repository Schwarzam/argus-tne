import React, { useEffect, useState } from "react";
import sio from "../auth/socket";
import axios from "axios";

import { usePlanContext } from "./PlanContext";

export default function Plans() {
    const [plans, setPlans] = useState([]);
    const { shouldRefetch, setShouldRefetch } = usePlanContext();

    useEffect(() => {
        axios.get("/api/fetch_plans/")
            .then((response) => {
                setPlans(response.data);
                if (shouldRefetch) setShouldRefetch(false);
            })
            .catch((error) => {
                console.log(error);
            });
    }, [shouldRefetch]);

    const handleDelete = (planId) => {
        // Call your API to delete the plan by its ID
        // And then refresh the list or remove the deleted plan from the state
    };

    const handleCheckObservation = (plan) => {
        // Implement your logic to check if observation can be done now
        // For example, using sio to send a message
    };

    return (
        <div className="w-full max-w-lg mx-auto py-6 px-4 outline outline-[1px] rounded-md">
            <h1 className="font-bold text-2xl mb-4">Planos</h1>

            {plans.map(plan => (
                <div key={plan.id} className="bg-white shadow rounded-lg p-6 mb-4">
                    <h2 className="text-2xl font-semibold mb-2">{plan.name}</h2>
                    <div className="grid grid-cols-2 gap-4">

                        <div className="bg-white p-4 border rounded-md shadow-sm">
                            <p className="text-gray-700 font-medium">RA:</p>
                            <p className="text-gray-900 mt-2">{plan.ra}</p>
                        </div>

                        <div className="bg-white p-4 border rounded-md shadow-sm">
                            <p className="text-gray-700 font-medium">DEC:</p>
                            <p className="text-gray-900 mt-2">{plan.dec}</p>
                        </div>
                        
                        <p><span className="font-medium">Filtros:</span> {plan.filters}</p>
                        <p><span className="font-medium">Redução:</span> {plan.reduction}</p>
                        <p><span className="font-medium">Tempo de exposição:</span> {plan.exptime} segundos</p>
                        <p><span className="font-medium">Hora:</span> {plan.start_time}</p>
                    </div>
                    <div className="flex justify-between mt-4">
                        <button onClick={() => handleDelete(plan.id)} className="bg-red-500 w-full mx-1 hover:bg-red-600 text-white p-2 rounded">Deletar</button>
                        <button onClick={() => handleCheckObservation(plan)} className="bg-blue-500 w-full mx-1 hover:bg-blue-600 text-white p-2 rounded">Checar possibilidade</button>
                    </div>
                    <div className="mt-4 text-center">
                        <div className={`w-6 h-6 inline-block rounded-full ${plan.canObserveNow ? 'bg-green-500' : 'bg-red-500'}`}></div>
                        <span className="ml-2">{plan.canObserveNow ? 'Pode ser observado agora' : 'Não pode ser observado agora'}</span>
                    </div>
                </div>
            ))}
        </div>
    );
}