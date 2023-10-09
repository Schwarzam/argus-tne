import React, { createContext, useContext } from 'react';

// Create the Context
export const PlanContext = createContext();

// Custom hook to use the PlanContext and return its value
export const usePlanContext = () => {
    return useContext(PlanContext);
};