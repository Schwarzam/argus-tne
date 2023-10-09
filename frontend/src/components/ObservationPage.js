import React, { useState, useEffect } from "react";

import PlanTab from "./PlanTab";
import Stellarium from "./Stellarium";
import Plans from "./Plans";

import { PlanContext } from "./PlanContext";

export default function ObservationPage() {
    const [shouldRefetch, setShouldRefetch] = useState(false);
    
    return (
        <PlanContext.Provider value={{ shouldRefetch, setShouldRefetch }}>
            <div className="w-[90%] m-auto py-6">
                <Stellarium />
                <div className="mt-6 flex">
                    <PlanTab />
                    <Plans />
                </div>
            </div>
        </PlanContext.Provider>
    );
}
