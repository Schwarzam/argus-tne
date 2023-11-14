import React, { useEffect, useState } from "react";
import axios from "axios";
import { getCookie } from "../auth/cookies";
import { usePlanContext } from "./PlanContext";

import sio from "../auth/socket";
import { toast } from "react-toastify";

export default function Plans() {
    const [plans, setPlans] = useState([]);
    const { shouldRefetch, setShouldRefetch } = usePlanContext();

    const fetch_plans = () => {
        axios.get("/api/fetch_plans/")
            .then((response) => {
                setPlans(response.data);
                if (shouldRefetch) setShouldRefetch(false);
            })
            .catch((error) => {
                console.log(error);
            });
    }

    useEffect(() => {
        fetch_plans()
    }, [shouldRefetch]);

    
    useEffect(() => {
        const interval = setInterval(() => {
            fetch_plans();
        }, 25000);   
        return () => clearInterval(interval);
    }, [])

    const handleDelete = (plan_id) => {
        axios.post("/api/delete_plan/", { plan_id: plan_id }, {headers: {'X-CSRFToken': getCookie('csrftoken')}})
            .then((response) => {
                if (response.data.status === "success"){
                    setShouldRefetch(true);
                    toast("Plano deletado com sucesso!")
                }else{
                    toast.error("Erro ao apagar plano.")
                    //setShouldRefetch(true);
                }
            })
            .catch((error) => {
                console.log(error);
            });
    };

    

    
    function updatePlanInState(idToUpdate, state) {
        setPlans(prevPlans => {
            // First, update the specific plan
            const updatedPlans = prevPlans.map(plan => {
                if (plan.id === idToUpdate) {
                    return {
                        ...plan,
                        canObserveNow: state
                    };
                }
                return plan;
            });

            // Then, reverse the order of the updated plans
            return [...updatedPlans].reverse();
        });
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

    return (
        <div className="w-full max-w-lg mx-auto py-6 px-4">
            <h1 className="font-bold text-2xl">Planos</h1>
            <p className="text-sm mb-4">use o scroll</p>

            <div className="h-[1000px] overflow-y-scroll">
                {plans.reverse().map(plan => (
                    <div key={plan.id} className="bg-white shadow rounded-lg p-6 mb-4">
                        <h2 className="text-2xl font-semibold mb-2">{plan.name}</h2>

                        <div className="bg-white p-4 border rounded-md shadow-sm">
                            <p className="text-gray-700 font-medium">RA  DEC:</p>
                            <div className="text-gray-900 mt-2">
                                {Number((plan.ra).toFixed(5))}
                                &nbsp;&nbsp;
                                {Number((plan.dec).toFixed(5))}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">

                            
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
            
        </div>
    );
}