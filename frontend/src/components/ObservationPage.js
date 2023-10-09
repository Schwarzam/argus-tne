import React, { useState, useEffect } from "react";

import PlanTab from "./PlanTab";
import Stellarium from "./Stellarium";

export default function ObservationPage() {
    return (
        <div>
            <Stellarium />
            <PlanTab />
        </div>
    );
}
