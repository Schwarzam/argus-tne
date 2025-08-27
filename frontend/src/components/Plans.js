import React, { useEffect, useState } from "react";
import axios from "axios";
import { getCookie } from "../auth/cookies";
import { usePlanContext } from "./PlanContext";

import sio from "../auth/socket";
import { toast } from "react-toastify";

export default function Plans({ onPlansUpdate }) {
    const [plans, setPlans] = useState([]);
    const [editingPlan, setEditingPlan] = useState(null);
    const [showEditModal, setShowEditModal] = useState(false);
    const [availableFilters, setAvailableFilters] = useState([]);
    const [editingFilters, setEditingFilters] = useState([]);
    const { shouldRefetch, setShouldRefetch } = usePlanContext();

    // Debug effect to monitor editingFilters changes
    useEffect(() => {
        console.log('editingFilters state changed:', editingFilters);
    }, [editingFilters]);


    const fetch_plans = () => {
        axios.get("/api/fetch_plans/")
            .then((response) => {
                // Filter out executed plans - they belong in Results, not Plans
                const nonExecutedPlans = response.data.filter(plan => !plan.executed);
                setPlans(nonExecutedPlans);
                console.log('Filtered plans (non-executed only):', nonExecutedPlans);
                
                // Notify parent component about plans update
                if (onPlansUpdate) {
                    onPlansUpdate(nonExecutedPlans);
                }
                
                if (shouldRefetch) setShouldRefetch(false);
            })
            .catch((error) => {
                console.log(error);
            });
    }

    useEffect(() => {
        fetch_plans();
        
        // Load available filters from backend
        axios.get('/api/appinfo/')
            .then((response) => {
                if (response.data.FILTROS) {
                    setAvailableFilters(response.data.FILTROS);
                }
            })
            .catch((error) => {
                console.log('Error loading filters:', error);
            });
    }, [shouldRefetch]);

    
    useEffect(() => {
        const interval = setInterval(() => {
            fetch_plans();
        }, 25000);   
        return () => clearInterval(interval);
    }, [])

    const toggleEditingFilter = (filter) => {
        const filterStr = String(filter).trim();
        console.log('Toggling filter:', filterStr, 'Current filters:', editingFilters);
        setEditingFilters(prevFilters => {
            const normalizedPrevFilters = prevFilters.map(f => String(f).trim());
            const isCurrentlySelected = normalizedPrevFilters.some(f => f === filterStr);
            
            const newFilters = isCurrentlySelected
                ? prevFilters.filter(f => String(f).trim() !== filterStr)
                : [...prevFilters, filterStr];
                
            console.log('Was selected:', isCurrentlySelected, 'New filters:', newFilters);
            return newFilters;
        });
    };

    const handleDelete = (plan) => {
        if (window.confirm(`Tem certeza que deseja deletar o plano "${plan.name}"?`)) {
            axios.post("/api/delete_plan/", { plan_id: plan.id }, {headers: {'X-CSRFToken': getCookie('csrftoken')}})
                .then((response) => {
                    if (response.data.status === "success"){
                        setShouldRefetch(true);
                        toast.success("Plano deletado com sucesso!")
                    }else{
                        toast.error("Erro ao apagar plano.")
                    }
                })
                .catch((error) => {
                    console.log(error);
                    toast.error("Erro ao deletar plano.");
                });
        }
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

    const handleEditPlan = (plan) => {
        console.log('Editing plan:', plan);
        
        // Initialize editing filters first
        const planFilters = Array.isArray(plan.filters) ? 
            plan.filters.map(f => String(f).trim()) : 
            plan.filters.split(',').map(f => String(f).trim());
        console.log('Plan filters to edit:', planFilters, planFilters.map(f => typeof f));
        
        // Set all state at once to avoid timing issues
        setEditingPlan({...plan});
        setEditingFilters(planFilters);
        
        // Use setTimeout to ensure state is updated before showing modal
        setTimeout(() => {
            setShowEditModal(true);
        }, 0);
    };

    const savePlanChanges = () => {
        if (!editingPlan) return;

        // Validate required fields before proceeding
        if (!editingPlan.name || !editingPlan.ra || !editingPlan.dec || !editingPlan.start_time) {
            toast.error("Por favor, preencha todos os campos obrigatórios.");
            return;
        }

        // Format the date properly for backend (YYYY-MM-DDTHH:MM format)
        let formattedDate = editingPlan.start_time;
        try {
            if (editingPlan.start_time.length > 16) {
                formattedDate = editingPlan.start_time.slice(0, 16);
            }
            // Validate date format
            const testDate = new Date(formattedDate + ':00');
            if (isNaN(testDate.getTime())) {
                throw new Error("Invalid date");
            }
        } catch (error) {
            toast.error("Formato de data inválido. Use YYYY-MM-DDTHH:MM");
            return;
        }

        // Validate filters
        if (editingFilters.length === 0) {
            toast.error("Por favor, selecione pelo menos um filtro.");
            return;
        }

        // Prepare the new plan data first
        const planData = {
            name: editingPlan.name,
            ra: editingPlan.ra,
            dec: editingPlan.dec,
            filters: editingFilters,
            framemode: editingPlan.reduction || editingPlan.framemode,
            exptime: editingPlan.exptime,
            date: formattedDate
        };

        // Only include object_name if it exists and is not null/empty
        if (editingPlan.object_name && editingPlan.object_name.trim()) {
            planData.object_name = editingPlan.object_name;
        }

        const originalPlanId = editingPlan.id;
        
        // FIRST: Try to create the new plan to validate it works
        axios.post("/api/create_plan/", planData, {headers: {'X-CSRFToken': getCookie('csrftoken')}})
            .then((createResponse) => {
                if (createResponse.data.status === "success") {
                    // SUCCESS: Now delete the original plan
                    return axios.post("/api/delete_plan/", { plan_id: originalPlanId }, {headers: {'X-CSRFToken': getCookie('csrftoken')}});
                } else {
                    throw new Error(createResponse.data.message || "Erro ao criar nova versão do plano");
                }
            })
            .then((deleteResponse) => {
                if (deleteResponse.data.status === "success") {
                    toast.success("Plano atualizado com sucesso!");
                    setShouldRefetch(true);
                    setShowEditModal(false);
                    setEditingPlan(null);
                    setEditingFilters([]);
                } else {
                    // If delete fails, we now have a duplicate, but that's better than losing the plan
                    toast.warning("Plano atualizado, mas a versão antiga ainda existe. Você pode deletá-la manualmente.");
                    setShouldRefetch(true);
                    setShowEditModal(false);
                    setEditingPlan(null);
                    setEditingFilters([]);
                }
            })
            .catch((error) => {
                console.log(error);
                const errorMessage = error.response?.data?.message || error.message || "Erro desconhecido";
                toast.error("Erro ao atualizar plano: " + errorMessage);
                // Don't close modal on error so user can fix the data
            });
    };

    return (
        <div className="w-full max-w-lg mx-auto py-6 px-4">
            <div className="flex justify-between items-center mb-4">
                <h1 className="font-bold text-2xl">Planos de Observação</h1>
                <span className="text-sm text-gray-500">{plans.length} planos</span>
            </div>

            <div className="h-[1000px] overflow-y-scroll space-y-3">
                {plans.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                        <p>Nenhum plano criado ainda</p>
                        <p className="text-sm mt-2">Clique no Aladin para criar seu primeiro plano!</p>
                    </div>
                ) : (
                    plans
                        .sort((a, b) => b.id - a.id) // Sort by newest first
                        .map(plan => (
                        <div key={plan.id} className="shadow-md rounded-lg border-l-4 bg-white border-blue-500">
                            
                            {/* Plan Header */}
                            <div className="p-4 border-b bg-gray-50">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h2 className="text-lg font-semibold text-gray-800">{plan.name}</h2>
                                        <p className="text-sm text-gray-500 mt-1">
                                            {plan.object_name ? 
                                                `Objeto: ${plan.object_name}` : 
                                                `RA ${Number((plan.ra).toFixed(3))}° DEC ${Number((plan.dec).toFixed(3))}°`
                                            }
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className={`w-3 h-3 rounded-full ${plan.canObserveNow === undefined ? 'bg-yellow-400' : plan.canObserveNow ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                        <span className="text-xs text-gray-600">
                                            {plan.canObserveNow === undefined ? 'Verificando' : plan.canObserveNow ? 'Observável' : 'Não observável'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Plan Details */}
                            <div className="p-4">
                                <div className="grid grid-cols-2 gap-3 text-sm mb-4">
                                    <div>
                                        <span className="font-medium text-gray-600">Filtros:</span>
                                        <div className="mt-1">
                                            {plan.filters.split(',').map(filter => (
                                                <span key={filter} className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs mr-1">
                                                    {filter.trim()}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <span className="font-medium text-gray-600">Frame:</span>
                                        <p className="text-gray-800">{plan.reduction}</p>
                                    </div>
                                    <div>
                                        <span className="font-medium text-gray-600">Exposição:</span>
                                        <p className="text-gray-800">{plan.exptime}s</p>
                                    </div>
                                    <div>
                                        <span className="font-medium text-gray-600">Hora:</span>
                                        <p className="text-gray-800 text-xs">{new Date(plan.start_time).toLocaleString()}</p>
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex gap-2">
                                    <button 
                                        onClick={() => handleCheckObservation(plan.id)} 
                                        className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded text-sm flex-1"
                                    >
                                        ✓ Verificar
                                    </button>
                                    
                                    <button 
                                        onClick={() => handleEditPlan(plan)} 
                                        className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-2 rounded text-sm"
                                    >
                                        ✏️
                                    </button>
                                    
                                    {plan.canObserveNow && (
                                        <button 
                                            onClick={() => observar(plan.id)} 
                                            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded text-sm font-medium"
                                        >
                                            🔭 Observar Agora
                                        </button>
                                    )}
                                    
                                    <button 
                                        onClick={() => handleDelete(plan)} 
                                        className="bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded text-sm"
                                    >
                                        🗑️
                                    </button>
                                </div>
                            </div>

                        </div>
                    ))
                )}
            </div>
            
            {/* Edit Plan Modal */}
            {showEditModal && editingPlan && editingFilters && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
                        <h3 className="text-lg font-semibold mb-4">Editar Plano: {editingPlan.name}</h3>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Nome:</label>
                                <input
                                    type="text"
                                    value={editingPlan.name}
                                    onChange={(e) => setEditingPlan({...editingPlan, name: e.target.value})}
                                    className="w-full p-2 border rounded"
                                />
                            </div>
                            
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm font-medium mb-1">RA (graus):</label>
                                    <input
                                        type="number"
                                        step="0.000001"
                                        value={editingPlan.ra}
                                        onChange={(e) => setEditingPlan({...editingPlan, ra: parseFloat(e.target.value)})}
                                        className="w-full p-2 border rounded text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">DEC (graus):</label>
                                    <input
                                        type="number"
                                        step="0.000001"
                                        value={editingPlan.dec}
                                        onChange={(e) => setEditingPlan({...editingPlan, dec: parseFloat(e.target.value)})}
                                        className="w-full p-2 border rounded text-sm"
                                    />
                                </div>
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium mb-2">Filtros:</label>
                                <p className="text-xs text-gray-500 mb-2">Debug - Available: [{availableFilters.join(', ')}] | Selected: [{editingFilters.join(', ')}]</p>
                                <div className="flex flex-wrap gap-2">
                                    {availableFilters.map(filter => {
                                        const filterStr = String(filter).trim();
                                        const isSelected = editingFilters.some(selectedFilter => 
                                            String(selectedFilter).trim() === filterStr
                                        );
                                        console.log(`Filter "${filterStr}" selected:`, isSelected);
                                        console.log('Checking against:', editingFilters.map(f => `"${String(f).trim()}"`));
                                        return (
                                            <button
                                                key={filter}
                                                type="button"
                                                className={`px-3 py-2 rounded text-sm font-medium transition-colors ${
                                                    isSelected
                                                    ? 'bg-blue-500 text-white' 
                                                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                                }`}
                                                onClick={() => toggleEditingFilter(filter)}
                                            >
                                                {filter} {isSelected ? '✓' : ''}
                                            </button>
                                        );
                                    })}
                                </div>
                                {editingFilters.length > 0 && (
                                    <p className="text-xs text-gray-600 mt-1">
                                        Selecionados: {editingFilters.join(', ')}
                                    </p>
                                )}
                            </div>
                            
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Exposição (s):</label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        value={editingPlan.exptime}
                                        onChange={(e) => setEditingPlan({...editingPlan, exptime: parseFloat(e.target.value)})}
                                        className="w-full p-2 border rounded"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Frame:</label>
                                    <select
                                        value={editingPlan.reduction || editingPlan.framemode || ''}
                                        onChange={(e) => setEditingPlan({...editingPlan, reduction: e.target.value, framemode: e.target.value})}
                                        className="w-full p-2 border rounded"
                                    >
                                        <option value="">Selecione</option>
                                        <option value="Light">Light</option>
                                        <option value="Dark">Dark</option>
                                        <option value="Bias">Bias</option>
                                        <option value="Flat-Field">Flat-Field</option>
                                    </select>
                                </div>
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium mb-1">Horário:</label>
                                <input
                                    type="datetime-local"
                                    value={editingPlan.start_time ? new Date(editingPlan.start_time).toISOString().slice(0, 16) : ''}
                                    onChange={(e) => setEditingPlan({...editingPlan, start_time: e.target.value})}
                                    className="w-full p-2 border rounded"
                                />
                            </div>
                        </div>
                        
                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={savePlanChanges}
                                className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded"
                            >
                                💾 Salvar Alterações
                            </button>
                            <button
                                onClick={() => {
                                    setShowEditModal(false);
                                    setEditingPlan(null);
                                    setEditingFilters([]);
                                }}
                                className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded"
                            >
                                Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            )}
            
        </div>
    );
}