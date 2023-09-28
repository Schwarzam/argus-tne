import React from "react";

import { useEffect } from "react";

const VirtualSkyComponent = props => {
    const id = "test";
    const width = "700px";
    const height = "700px";
  
    useEffect(() => {
      const planetarium = window.S.virtualsky({ 
        id,
        projection: 'fisheye',
		    //objects: 'messier.json',
        latitude: -22.9712,
        longitude: -90,
        az: 180,
        live: true,
        gridlines_eq: true,
        negative: false,
        mouse: false,
        ground: true,
        magnitude: 10, 
        showplanets: true,
        showstarlabels: true,
        transparent: true,


        callback: {
          click: function(e) {
            console.log(e.ra, e.dec);
          }
        }
      });
    }, []);
  
    return (
      <div id="test" style={{ width, height }} />
    );
};
  
export default VirtualSkyComponent;