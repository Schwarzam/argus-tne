import React, { useState, useEffect } from "react";

import PlanTab from "./PlanTab";
import Stellarium from "./Stellarium";
import Plans from "./Plans";

export default function ObservationPage() {
    return (
        <div className="w-[90%] m-auto ">
            <Stellarium />
            <PlanTab />
            <Plans />   
        </div>
    );
}
