import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import PlanTab from "./PlanTab";
import AladinSky from "./AladinSky";
import Plans from "./Plans";
import info from "../auth/appinfo";

import TelescopeStatus from "./Telescope";

import { PlanContext } from "./PlanContext";

const ActionBox = ({ title, onAction }) => (
    <div 
      onClick={onAction} 
      className="w-64 p-6 text-xl font-semibold text-center text-white cursor-pointer bg-primary rounded-md shadow-md hover:bg-secondary"
    >
      {title}
    </div>
  );

export default function ObservationPage() {
    useEffect(() => {
        info.syncLoad();
        
        // Check for coordinates from sessionStorage (from Results page)
        const storedCoordinates = sessionStorage.getItem('selectedCoordinates');
        if (storedCoordinates) {
            const coords = JSON.parse(storedCoordinates);
            setSelectedCoordinate(coords);
            sessionStorage.removeItem('selectedCoordinates'); // Clean up
        }
    }, []);

    const [shouldRefetch, setShouldRefetch] = useState(false);
    const [selectedCoordinate, setSelectedCoordinate] = useState(null);
    const [telescopePosition, setTelescopePosition] = useState(null);
    const [observationPlans, setObservationPlans] = useState([]);
    const navigate = useNavigate();

    const handleCoordinateClick = (ra, dec) => {
        setSelectedCoordinate({ ra, dec });
    };

    const handlePlanCreated = (plan) => {
        // Update observation plans list
        setObservationPlans(prev => [...prev, plan]);
    };

    const handleTelescopeUpdate = (position) => {
        setTelescopePosition(position);
    };

    return (
        <PlanContext.Provider value={{ shouldRefetch, setShouldRefetch }}>
            <div className="w-[90%] m-auto py-6">
                
                <AladinSky 
                    onCoordinateClick={handleCoordinateClick}
                    telescopePosition={telescopePosition}
                    observationPlans={observationPlans}
                />
                
                <TelescopeStatus onPositionUpdate={handleTelescopeUpdate} />
                
                <div className="m-auto mb-6">
                    <div 
                        onClick={() => navigate("/results")}
                        className="m-auto w-64 p-6 text-xl font-semibold text-center text-white cursor-pointer bg-primary rounded-md shadow-md hover:bg-secondary"
                    >
                    Minhas observações
                    </div>
                </div>
                
                <div className="mt-6 flex">
                    <PlanTab 
                        coordinateFromAladin={selectedCoordinate} 
                        onPlanCreated={handlePlanCreated}
                    />
                    <div className="h-[1000px] bg-black w-[1px]"></div>
                    <Plans onPlansUpdate={setObservationPlans} />
                </div>
            </div>
        </PlanContext.Provider>
    );
}
