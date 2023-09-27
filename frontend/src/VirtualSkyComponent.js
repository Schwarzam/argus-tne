import React from "react";

import { useEffect } from "react";

const VirtualSkyComponent = props => {
    const id = "test";
    const width = "1000px";
    const height = "1000px";
  
    useEffect(() => {
      const planetarium = window.S.virtualsky({ 
        id,
        projection: 'polar',
		    objects: 'messier.json',
        latitude: -22.9712,
        longitude: -46.9964,
      
      });
    }, []);
  
    return (
      <div id="test" style={{ width, height }} />
    );
};
  
export default VirtualSkyComponent;