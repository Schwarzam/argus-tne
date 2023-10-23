import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import PlanTab from "./PlanTab";
import Stellarium from "./Stellarium";
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
    }, []);

    const [shouldRefetch, setShouldRefetch] = useState(false);
    const navigate = useNavigate();

    return (
        <PlanContext.Provider value={{ shouldRefetch, setShouldRefetch }}>
            <div className="w-[90%] m-auto py-6">
                
                
                <Stellarium />
                <TelescopeStatus />
                <div className="m-auto mb-6">
                    <div 
                        onClick={() => navigate("/results")}
                        className="m-auto w-64 p-6 text-xl font-semibold text-center text-white cursor-pointer bg-primary rounded-md shadow-md hover:bg-secondary"
                    >
                    Minhas observações
                    </div>
                </div>
                
                <div className="mt-6 flex">
                    <PlanTab />
                    <div className="h-[1000px] bg-black w-[1px]"></div>
                    <Plans />
                </div>
            </div>
        </PlanContext.Provider>
    );
}
