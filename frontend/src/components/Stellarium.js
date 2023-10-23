import React, { useState, useEffect } from "react";
import info from "../auth/appinfo";
/*
Stellarium is a free and open-source planetarium, 
licensed under the terms of the GNU General Public License version 2,
available for Linux, Windows, and macOS.
*/

export default function Stellarium() {
    const [showInstructions, setShowInstructions] = useState(true);


    return (
        <div className="p-5 border rounded-md shadow-md relative">
            <h2 className="text-center mb-4 text-xl font-semibold">Stellarium - Observador</h2>
            
            <div className="relative mb-4">
                <iframe
                    title="Stellarium"
                    src="https://stellarium-web.org/"
                    width="100%"
                    height="700px"
                    frameBorder="0"
                    className="rounded-md"
                ></iframe>

                {showInstructions && (
                    <div 
                    className="absolute top-0 right-0 bg-white p-5 rounded-md w-[300px] max-h-[600px] overflow-y-auto shadow-md"
                    >
                        <Instructions />
                        <button className="bg-blue-500 text-white px-3 py-2 mt-3 rounded-md hover:bg-blue-600 transition" onClick={() => setShowInstructions(!setShowInstructions)}>
                            Ok
                        </button>
                    </div>
                )}
            </div>

            <div className="text-center">
                <button 
                    className="bg-blue-500 text-white px-3 py-1 rounded-md hover:bg-blue-600 transition"
                    onClick={() => setShowInstructions(!showInstructions)}
                >
                    📜 Instructions
                </button>
            </div>
        </div>
    );
}

function Instructions(){

    const [lat, setLat] = useState(0);
    const [lon, setLon] = useState(0);

    useEffect(() => {
        async function getLatLon(){
            const lat = await info.get('LAT');
            const lon = await info.get('LON');
            setLat(lat);
            setLon(lon);
        }
        getLatLon();
    }, []);

    return (
        <div>
            <h3 className="mb-4 font-semibold">Como planejar sua observação.</h3>
                        
                        <p className="mb-3">Siga os passos a seguir.</p>
                        <BlackLine />
                        <p className="">1. Feche a aba lateral.</p>
                        <img
                            src="/imagens/instrucao1.png" 
                            alt="Stellarium Example"
                            className="w-full h-auto mb-3 rounded-md"
                        />
                        
                        <BlackLine />
                        <p className="mb-3">2. Aceite os termos.</p>
                        <img
                            src="/imagens/instrucao2.png" 
                            alt="Navigation Guide"
                            className="w-full h-auto mb-3 rounded-md"
                        />
                        
                        <BlackLine />
                        <p className="mb-3">3. Clique no botão esquerdo inferior para adicionar a localização do telescópio.</p>
                        <img
                            src="/imagens/instrucao3.png" 
                            alt="Navigation Guide"
                            className="w-full h-auto mb-3 rounded-md"
                        />
                        <p>Cole as seguintes coordenadas em "Search... " e clique "Enter": </p>

                        <p className="font-bold outline outline-[0.25px] py-2 px-1 text-center rounded-md">{lat} {lon}</p>
                        <p className="mb-3">Depois de inserir as coordenadas e ter teclado enter clique em "Use this location" para aplicar. Cetifique-se de que a localização selecionada está como Valinhos.</p>

                        <BlackLine />
                        <p className="mb-3">4. Clique nesse botão para ligar o grid azimutal.</p>
                        <img
                            src="/imagens/instrucao4.png" 
                            alt="Navigation Guide"
                            className="w-full h-auto mb-3 rounded-md"
                        />

                        <BlackLine />
                        <p className="mb-3">5. Ajuste a hora no canto inferior direito para o momento da observação desejada.</p>
                        <img
                            src="/imagens/instrucao7.png" 
                            alt="Navigation Guide"
                            className="w-full h-auto mb-3 rounded-md"
                        />

                        <BlackLine />
                        <p className="mb-3">6. Usando o mouse, olhe bem para o topo (zenite), como mostra a imagem, e procure por objetos de interesse em torno. Use o scroll do mouse para dar zoom.</p>
                        <img
                            src="/imagens/instrucao5.png" 
                            alt="Navigation Guide"
                            className="w-full h-auto mb-3 rounded-md"
                        />

                        <BlackLine />
                        <p className="mb-3">7. Ao encontrar um objeto de interesse, clique nele e copie suas coordenadas (Ra/Dec) para adicionar ao plano de observação abaixo.</p>
                        <img
                            src="/imagens/instrucao6.png" 
                            alt="Navigation Guide"
                            className="w-full h-auto mb-3 rounded-md"
                        />
                        
        </div>
    )
}

function BlackLine(){
    return (
        <div className="bg-black py-[0.5px] mb-4"></div>
    )
}