import React, { useEffect, useRef, useState } from "react";
import info from "../auth/appinfo";
import sio from "../auth/socket";
import { toast } from "react-toastify";
import timeService from "../services/timeService";

export default function AladinSky({ onCoordinateClick, telescopePosition, observationPlans = [] }) {
    const aladinRef = useRef(null);
    const aladinInstance = useRef(null);
    const onCoordinateClickRef = useRef(onCoordinateClick);
    const [showInstructions, setShowInstructions] = useState(true);
    const [telescopeData, setTelescopeData] = useState({ lat: null, lon: null });
    const [isAladinReady, setIsAladinReady] = useState(false);

    // Update the ref when the callback changes
    useEffect(() => {
        onCoordinateClickRef.current = onCoordinateClick;
    }, [onCoordinateClick]);

    useEffect(() => {
        async function getTelescopeData() {
            try {
                const lat = await info.get('LAT');
                const lon = await info.get('LON');
                setTelescopeData({ lat: parseFloat(lat), lon: parseFloat(lon) });
            } catch (error) {
                console.error('Error fetching telescope data:', error);
            }
        }
        getTelescopeData();
    }, []);

    useEffect(() => {
        if (!telescopeData.lat || !telescopeData.lon) return;

        const initAladin = () => {
            console.log('Attempting to initialize Aladin...', { hasWindow: !!window.A, hasRef: !!aladinRef.current, hasInstance: !!aladinInstance.current });
            
            if (window.A && aladinRef.current && !aladinInstance.current) {
                try {
                    window.A.init.then(async () => {
                        console.log('Aladin init completed, creating instance...');
                        // Calculate proper zenith position first using server time
                        const calculateZenith = async () => {
                            try {
                                const serverTime = await timeService.getServerTime();
                                const lstHours = getLST(serverTime, telescopeData.lon);
                                const zenithRA = lstHours; // LST in hours is the RA of zenith
                                const zenithDec = telescopeData.lat; // Zenith declination equals observer latitude
                                
                                console.log(`Zenith calculation: LST=${lstHours.toFixed(2)}h, RA=${zenithRA.toFixed(2)}h, DEC=${zenithDec}°`);
                                return { zenithRA, zenithDec };
                            } catch (error) {
                                console.error('Error getting server time for zenith:', error);
                                // Fallback to local time
                                const now = new Date();
                                const lstHours = getLST(now, telescopeData.lon);
                                const zenithRA = lstHours;
                                const zenithDec = telescopeData.lat;
                                return { zenithRA, zenithDec };
                            }
                        };

                        const zenithData = await calculateZenith();

                        aladinInstance.current = window.A.aladin(aladinRef.current, {
                            survey: 'P/DSS2/color',
                            fov: 80,
                            projection: 'SIN',
                            cooFrame: 'equatorial',
                            showCooGridControl: true,
                            showSimbadPointerControl: true,
                            showCooGrid: true,
                            showFrame: true,
                            showCatalog: true,
                            target: `${zenithData.zenithRA} ${zenithData.zenithDec}`, // Start at zenith (RA already in hours)
                            fullScreen: false,
                            reticleColor: '#ff0000',
                            reticleSize: 22
                        });

                        // Set telescope location for calculations
                        if (aladinInstance.current && aladinInstance.current.setLocation) {
                            aladinInstance.current.setLocation(telescopeData.lat, telescopeData.lon);
                        }

                        // Add right-click event listener for coordinate selection
                        const aladinContainer = aladinRef.current;
                        
                        const handleRightClick = (e) => {
                            e.preventDefault(); // Prevent context menu
                            
                            const rect = aladinContainer.getBoundingClientRect();
                            const x = e.clientX - rect.left;
                            const y = e.clientY - rect.top;
                            
                            try {
                                const raDec = aladinInstance.current.pix2world(x, y);
                                if (raDec && onCoordinateClickRef.current) {
                                    const ra = raDec[0];
                                    const dec = raDec[1];
                                    
                                    // Format RA and DEC
                                    const raFormatted = formatRA(ra);
                                    const decFormatted = formatDEC(dec);
                                    
                                    // Add marker without jumping view (ra is in degrees here)
                                    addCoordinateMarker(ra, dec);
                                    
                                    // Check visibility immediately
                                    checkVisibility(ra, dec, raFormatted, decFormatted);
                                    
                                    toast.info(`Coordenada selecionada: ${raFormatted}°, ${decFormatted}°`);
                                    onCoordinateClickRef.current(raFormatted, decFormatted);
                                }
                            } catch (error) {
                                console.log("Error getting coordinates:", error);
                            }
                        };
                        
                        aladinContainer.addEventListener('contextmenu', handleRightClick);
                        
                        // Store cleanup function
                        aladinInstance.current._cleanup = () => {
                            aladinContainer.removeEventListener('contextmenu', handleRightClick);
                        };

                        // Add position change listener
                        aladinInstance.current.on('positionChanged', (ra, dec) => {
                            // Update position display if needed
                        });

                        console.log('Aladin instance created successfully');
                        setIsAladinReady(true);
                    }).catch(error => {
                        console.error('Error initializing Aladin:', error);
                        // Don't retry automatically to avoid loops
                    });
                } catch (error) {
                    console.error('Error with Aladin:', error);
                    // Don't retry to avoid reset loops
                }
            }
        };

        // Wait for Aladin to be available, but only initialize once
        if (window.A && !aladinInstance.current) {
            initAladin();
        } else if (!window.A) {
            const checkAladin = setInterval(() => {
                if (window.A && !aladinInstance.current) {
                    clearInterval(checkAladin);
                    initAladin();
                }
            }, 100);
            
            // Cleanup timeout
            return () => clearInterval(checkAladin);
        }

        return () => {
            if (aladinInstance.current && aladinInstance.current._cleanup) {
                aladinInstance.current._cleanup();
            }
            aladinInstance.current = null;
        };
    }, [telescopeData.lat, telescopeData.lon]); // Only depend on telescope coordinates

    // Update telescope position marker
    useEffect(() => {
        if (aladinInstance.current && telescopePosition && isAladinReady) {
            try {
                // Remove existing telescope marker
                const existingOverlay = aladinInstance.current.getOverlayByName('telescope');
                if (existingOverlay) {
                    aladinInstance.current.removeOverlay(existingOverlay);
                }

                // Add new telescope position marker
                const telescopeOverlay = window.A.graphicOverlay({ 
                    name: 'telescope',
                    color: '#ff0000',
                    lineWidth: 3
                });
                
                telescopeOverlay.addFootprints(window.A.polygon([
                    [telescopePosition.ra, telescopePosition.dec]
                ]));
                
                aladinInstance.current.addOverlay(telescopeOverlay);
            } catch (error) {
                console.error('Error updating telescope position:', error);
            }
        }
    }, [telescopePosition, isAladinReady]);

    // Update observation plans overlay
    useEffect(() => {
        if (aladinInstance.current && observationPlans.length > 0 && isAladinReady) {
            try {
                // Remove existing plans overlay
                const existingOverlay = aladinInstance.current.getOverlayByName('plans');
                if (existingOverlay) {
                    aladinInstance.current.removeOverlay(existingOverlay);
                }

                // Add observation plans markers
                const plansOverlay = window.A.graphicOverlay({ 
                    name: 'plans',
                    color: '#00ff00',
                    lineWidth: 2
                });

                observationPlans.forEach((plan, index) => {
                    if (plan.ra && plan.dec) {
                        plansOverlay.addFootprints(window.A.circle(plan.ra, plan.dec, 0.5, {
                            color: plan.executed ? '#00ff00' : '#ffaa00'
                        }));
                    }
                });
                
                aladinInstance.current.addOverlay(plansOverlay);
            } catch (error) {
                console.error('Error updating observation plans:', error);
            }
        }
    }, [observationPlans, isAladinReady]);

    const formatRA = (ra) => {
        // Return RA in decimal degrees format
        let normalizedRA = ra;
        if (normalizedRA < 0) normalizedRA += 360;
        if (normalizedRA >= 360) normalizedRA -= 360;
        return normalizedRA.toFixed(6);
    };

    const formatDEC = (dec) => {
        // Return DEC in decimal degrees format
        return dec.toFixed(6);
    };

    const checkVisibility = (ra, dec, raFormatted, decFormatted) => {
        // Send visibility check via socket
        sio.send("checkcoord", {ra: raFormatted, dec: decFormatted});
        
        // Use a one-time listener approach to avoid memory leaks
        const handleVisibilityResponse = (message) => {
            if (message.allowed) {
                toast.success("✅ Coordenada observável agora!");
            } else {
                toast.warning("⚠️ Coordenada não observável no momento.");
            }
        };
        
        // Add a unique identifier to avoid conflicts
        const eventId = `coordchecked_${Date.now()}`;
        
        // Set up a one-time response handler
        const responseHandler = (message) => {
            handleVisibilityResponse(message);
            // Clean up this specific listener
            if (sio.off) {
                sio.off("coordchecked", responseHandler);
            }
        };
        
        sio.on("coordchecked", responseHandler);
        
        // Calculate basic visibility info
        try {
            const altitude = calculateAltitude(ra, dec, telescopeData.lat, telescopeData.lon);
            if (altitude < 30) {
                toast.info("💡 Dica: Objetos com altitude > 30° têm melhor qualidade de observação");
            }
        } catch (error) {
            console.log("Error calculating altitude:", error);
        }
    };

    const calculateAltitude = (ra, dec, lat, lon) => {
        // Simple altitude calculation (this is a simplified version)
        // In a real implementation, you'd want to use a proper astronomy library
        const now = new Date();
        const lst = getLST(now, lon); // Local Sidereal Time
        const ha = lst - ra; // Hour Angle
        
        // Convert to radians
        const decRad = dec * Math.PI / 180;
        const latRad = lat * Math.PI / 180;
        const haRad = ha * Math.PI / 180;
        
        // Calculate altitude
        const altRad = Math.asin(
            Math.sin(decRad) * Math.sin(latRad) + 
            Math.cos(decRad) * Math.cos(latRad) * Math.cos(haRad)
        );
        
        return altRad * 180 / Math.PI;
    };

    const getLST = (date, longitude) => {
        // More accurate Local Sidereal Time calculation
        const JD = (date.getTime() / 86400000) + 2440587.5;
        const T = (JD - 2451545.0) / 36525;
        
        // Greenwich Mean Sidereal Time at 0h UT
        let GMST = 280.46061837 + 360.98564736629 * (JD - 2451545.0) + 0.000387933 * T * T - T * T * T / 38710000;
        
        // Normalize to 0-360 degrees
        GMST = GMST % 360;
        if (GMST < 0) GMST += 360;
        
        // Local Sidereal Time = GMST + longitude
        let LST = GMST + longitude;
        LST = LST % 360;
        if (LST < 0) LST += 360;
        
        return LST / 15; // Convert to hours (0-24)
    };

    const gotoCoordinate = (ra, dec) => {
        if (aladinInstance.current && isAladinReady) {
            try {
                // Don't jump view when just adding coordinates, only when explicitly requested
                aladinInstance.current.gotoRaDec(ra, dec);
            } catch (error) {
                console.error('Error going to coordinate:', error);
            }
        }
    };

    const addCoordinateMarker = (ra, dec, label = "Selected") => {
        if (aladinInstance.current && isAladinReady) {
            try {
                // Remove existing selection marker
                const existingOverlay = aladinInstance.current.getOverlayByName('selection');
                if (existingOverlay) {
                    aladinInstance.current.removeOverlay(existingOverlay);
                }

                // Add new selection marker without jumping view
                const selectionOverlay = window.A.graphicOverlay({ 
                    name: 'selection',
                    color: '#ff6600',
                    lineWidth: 3
                });
                
                // Use RA in hours for Aladin
                selectionOverlay.addFootprints(window.A.circle(ra/15, dec, 0.5, {
                    color: '#ff6600'
                }));
                
                aladinInstance.current.addOverlay(selectionOverlay);
            } catch (error) {
                console.error('Error adding coordinate marker:', error);
            }
        }
    };

    const searchObject = (objectName) => {
        if (aladinInstance.current && isAladinReady) {
            try {
                aladinInstance.current.gotoObject(objectName);
            } catch (error) {
                console.error('Error searching object:', error);
                toast.error(`Objeto não encontrado: ${objectName}`);
            }
        }
    };

    return (
        <div className="p-5 border rounded-md shadow-md relative">
            <div className="text-center mb-4">
                <h2 className="text-xl font-semibold">Aladin Sky Atlas - Observação Interativa</h2>
                <p className="text-sm text-gray-600 mt-1">
                    <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded">
                        💡 Clique com botão direito no céu para selecionar coordenadas
                    </span>
                </p>
            </div>
            
            <div className="relative mb-4">
                <div 
                    ref={aladinRef}
                    style={{ width: '100%', height: '700px' }}
                    className="border rounded-md"
                />

                {showInstructions && (
                    <div className="absolute top-0 right-0 bg-white p-5 rounded-md w-[350px] max-h-[600px] overflow-y-auto shadow-md z-10">
                        <Instructions 
                            telescopeData={telescopeData}
                            onSearchObject={searchObject}
                            onGotoCoordinate={gotoCoordinate}
                        />
                        <button 
                            className="bg-blue-500 text-white px-3 py-2 mt-3 rounded-md hover:bg-blue-600 transition" 
                            onClick={() => setShowInstructions(false)}
                        >
                            Entendi
                        </button>
                    </div>
                )}
            </div>

            <div className="text-center flex gap-4 justify-center">
                <button 
                    className="bg-blue-500 text-white px-3 py-1 rounded-md hover:bg-blue-600 transition"
                    onClick={() => setShowInstructions(!showInstructions)}
                >
                    📜 Instruções
                </button>
                
                {telescopePosition && (
                    <button 
                        className="bg-green-500 text-white px-3 py-1 rounded-md hover:bg-green-600 transition"
                        onClick={() => {
                            // Convert string coordinates to numbers if needed
                            const ra = parseFloat(telescopePosition.ra);
                            const dec = parseFloat(telescopePosition.dec);
                            gotoCoordinate(ra/15, dec); // Convert to hours for Aladin
                        }}
                    >
                        🔭 Ir para Telescópio
                    </button>
                )}
                
                <button 
                    className="bg-purple-500 text-white px-3 py-1 rounded-md hover:bg-purple-600 transition"
                    onClick={async () => {
                        try {
                            const serverTime = await timeService.getServerTime();
                            const lstHours = getLST(serverTime, telescopeData.lon);
                            gotoCoordinate(lstHours, telescopeData.lat); // LST in hours is zenith RA
                            toast.info(`Indo para zênite: RA ${lstHours.toFixed(2)}h, DEC ${telescopeData.lat}°`);
                        } catch (error) {
                            console.error('Error getting server time for zenith:', error);
                            // Fallback to local time
                            const now = new Date();
                            const lstHours = getLST(now, telescopeData.lon);
                            gotoCoordinate(lstHours, telescopeData.lat);
                            toast.info(`Indo para zênite (horário local): RA ${lstHours.toFixed(2)}h, DEC ${telescopeData.lat}°`);
                        }
                    }}
                >
                    ⬆️ Ir para Zênite
                </button>
            </div>

            {!isAladinReady && (
                <div className="absolute inset-0 bg-gray-100 flex items-center justify-center rounded-md">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                        <p>Carregando Aladin Sky Atlas...</p>
                    </div>
                </div>
            )}
        </div>
    );
}

function Instructions({ telescopeData, onSearchObject, onGotoCoordinate }) {
    const [searchTerm, setSearchTerm] = useState('');

    const handleSearch = () => {
        if (searchTerm.trim()) {
            onSearchObject(searchTerm.trim());
        }
    };

    return (
        <div>
            <h3 className="mb-4 font-semibold">Como usar o Aladin Sky Atlas</h3>
            
            <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Buscar objeto astronômico:</label>
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Ex: M31, NGC 7000, Vega"
                        className="flex-1 p-2 border rounded text-sm"
                        onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    />
                    <button
                        onClick={handleSearch}
                        className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 text-sm"
                    >
                        🔍
                    </button>
                </div>
            </div>

            <BlackLine />
            
            <h4 className="font-medium mb-2">Navegação Interativa:</h4>
            <ul className="text-sm space-y-2 mb-4">
                <li>• <strong>Botão direito</strong> em qualquer coordenada para criar um plano de observação 🎯</li>
                <li>• <strong>Clique esquerdo</strong> para interagir com os controles do Aladin</li>
                <li>• <strong>Arraste</strong> para mover o mapa do céu</li>
                <li>• <strong>Scroll/Pinça</strong> para dar zoom in/out</li>
                <li>• <strong>Duplo clique</strong> em um objeto para centralizá-lo</li>
            </ul>

            <BlackLine />
            
            <h4 className="font-medium mb-2">Informações do Telescópio:</h4>
            <div className="text-sm space-y-1 mb-4">
                <p><strong>Localização:</strong> Valinhos, SP</p>
                {telescopeData.lat && telescopeData.lon && (
                    <p><strong>Coordenadas:</strong> {telescopeData.lat}°, {telescopeData.lon}°</p>
                )}
            </div>

            <BlackLine />
            
            <h4 className="font-medium mb-2">Marcadores no Mapa:</h4>
            <ul className="text-sm space-y-1 mb-4">
                <li>• <span className="text-red-500">●</span> Posição atual do telescópio</li>
                <li>• <span className="text-green-500">●</span> Observações executadas</li>
                <li>• <span className="text-yellow-500">●</span> Planos salvos pendentes</li>
            </ul>

            <BlackLine />
            
            <h4 className="font-medium mb-2">Dicas de Observação:</h4>
            <ul className="text-sm space-y-1">
                <li>• Procure objetos próximos ao zênite (topo do céu)</li>
                <li>• Evite objetos próximos ao horizonte</li>
                <li>• Use o grid de coordenadas para localização precisa</li>
                <li>• Clique em objetos para ver informações detalhadas</li>
            </ul>
        </div>
    );
}

function BlackLine() {
    return <div className="bg-gray-300 py-[0.5px] mb-3"></div>;
}