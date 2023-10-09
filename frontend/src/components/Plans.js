import React, { useEffect, useState } from "react";
import axios from "axios";
import { getCookie } from "../auth/cookies";
import { usePlanContext } from "./PlanContext";

import sio from "../auth/socket";

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

    const handleDelete = (plan_id) => {
        axios.post("/api/delete_plan/", { plan_id: plan_id }, {headers: {'X-CSRFToken': getCookie('csrftoken')}})
            .then((response) => {
                if (response.data.status === "success"){
                    setShouldRefetch(true);
                }else{
                    setShouldRefetch(true);
                }
            })
            .catch((error) => {
                console.log(error);
            });
    };

    function updatePlanInState(idToUpdate, state) {
        setPlans(prevPlans => prevPlans.map(plan => {
            if (plan.id === idToUpdate) {
                return {
                    ...plan,
                    canObserveNow: state
                };
            }
            return plan;
        }));
    }

    const handleCheckObservation = (plan_id) => {
        axios.post("/api/check_if_plan_ok/", { plan_id: plan_id, now:true }, {headers: {'X-CSRFToken': getCookie('csrftoken')}})
            .then((response) => {
                if (response.data.status === "success"){
                    updatePlanInState(plan_id, true);
                }else{
                    updatePlanInState(plan_id, false);
                }
                
            })
            .catch((error) => {
                console.log(error);
            });
    };

    const observar = (plan_id) => {
        console.log(plan_id)
        // TODO: check if the observation is possible
    }

    return (
        <div className="w-full max-w-lg mx-auto py-6 px-4 h-[1000px] overflow-y-scroll">
            <h1 className="font-bold text-2xl mb-4">Planos</h1>

            {plans.toReversed().map(plan => (
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
                        <button onClick={() => handleCheckObservation(plan.id)} className="bg-primary w-full mx-1 hover:bg-blue-600 text-white p-2 rounded">Checar possibilidade</button>
                    </div>
                    <div className="mt-4 text-center flex items-center justify-center">
                        <div className={`w-6 h-6 inline-block rounded-full ${plan.canObserveNow === undefined ? 'bg-yellow-400' : plan.canObserveNow ? 'bg-green-500' : 'bg-red-500'}`}></div>
                        <span className="ml-2">{plan.canObserveNow === undefined ? 'A checar' : plan.canObserveNow ? 'Pode ser observado agora' : 'Não pode ser observado agora'}</span>
                    </div>

                    {plan.canObserveNow && (
                        <button onClick={() => observar(plan.id)} className="bg-primary w-full px-2 py-2 text-white mt-4 rounded-md">Observar</button>
                    )}

                </div>
            ))}
        </div>
    );
}