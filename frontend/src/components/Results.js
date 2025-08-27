import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

import { getCookie } from '../auth/cookies';

export default function Results(props) {
    const [results, setResults] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        axios.get('/api/fetch_observed')
            .then((res) => {
                setResults(res.data.reverse());
            })
            .catch((err) => console.log(err));
    }, []);

    return (
        <div className='w-[80%] m-auto mt-16'>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">Minhas Observações</h1>
                <button 
                    onClick={() => navigate('/observation')}
                    className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition"
                >
                    ← Voltar para Observação
                </button>
            </div>
            
            {results.length === 0 ? (
                <div className="text-center py-12">
                    <p className="text-gray-500 text-lg mb-4">Nenhuma observação encontrada</p>
                    <button 
                        onClick={() => navigate('/observation')}
                        className="bg-green-500 text-white px-6 py-3 rounded-md hover:bg-green-600 transition"
                    >
                        Criar Primeira Observação
                    </button>
                </div>
            ) : (
                results.map((result) => (
                    <Result key={result.id} result={result} />
                ))
            )}
        </div>
    )
}

const Result = ({ result }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [images, setImages] = useState({});
    const navigate = useNavigate();


    useEffect(() => {
        if (isOpen && result.outputs) {
            const fetchImages = async () => {
                let newImages = {};
                
                console.log(result)
                const filters = result.filters.split(',').map(f => f.trim());
                const filenames = result.outputs.split(',').map(f => f.trim());

                for (let i = 0; i < filters.length; i++) {
                    try {
                        const gifFilename = filenames[i].replace('.FIT', '.GIF');
                        
                        let response = await axios.post('/api/request_file/', {
                            filename: gifFilename
                        }, {
                            headers: {'X-CSRFToken': getCookie('csrftoken')},
                            responseType: 'blob'
                        });
                        
                        let url = URL.createObjectURL(response.data);
                        newImages[filters[i]] = url;
                    } catch (error) {
                        console.error(`Error fetching ${filters[i]} image:`, error);
                    }
                }

                setImages(newImages);
            };

            fetchImages();
        }
    }, [isOpen, result.outputs, result.filters]);

    function downloadFile(filename, filter) {
        axios.post('/api/request_file/', { filename: filename }, { headers:{'X-CSRFToken': getCookie('csrftoken')},  responseType: 'blob' })
            .then(response => {
                const url = window.URL.createObjectURL(new Blob([response.data]));
                const link = document.createElement('a');
                link.href = url;
                link.setAttribute('download', `${result.name}_${filter}.fits`);
                document.body.appendChild(link);
                link.click();
                link.remove();
            })
            .catch(error => {
                console.error("There was an error downloading the file:", error);
            });
    }

    function downloadImage(imageUrl, filter) {
        const link = document.createElement('a');
        link.href = imageUrl;
        link.setAttribute('download', `${result.name}_${filter}.gif`);
        document.body.appendChild(link);
        link.click();
        link.remove();
    }

    const formatDate = (dateStr) => {
        const dateObj = new Date(dateStr);
        return `${dateObj.toLocaleDateString()} ${dateObj.toLocaleTimeString()}`;
    }

    const toggleOpen = () => setIsOpen(!isOpen);

    const createSimilarPlan = () => {
        // Create a new observation plan based on this result
        const now = new Date();
        now.setMinutes(now.getMinutes() + 10); // 10 minutes from now
        const futureTime = now.toISOString().slice(0, 16);
        
        const planData = {
            name: `Re-observação: ${result.name}`,
            ra: result.ra,
            dec: result.dec,
            filters: result.filters.split(',').map(f => f.trim()), // Convert string to array
            framemode: result.framemode,
            exptime: result.exptime,
            date: futureTime
        };

        // Only include object_name if it exists and is not null/empty
        if (result.object_name && result.object_name.trim()) {
            planData.object_name = result.object_name;
        }

        axios.post('/api/create_plan/', planData, { 
            headers: { 'X-CSRFToken': getCookie('csrftoken') } 
        })
            .then((response) => {
                if (response.data.status === "success") {
                    toast.success("Plano de re-observação adicionado! Você pode editá-lo na aba de planos.");
                    setTimeout(() => navigate('/observation'), 1500);
                } else {
                    toast.error(response.data.message);
                }
            })
            .catch((error) => {
                console.log(error);
                toast.error("Erro ao criar plano de re-observação");
            });
    };

    const viewInAladin = () => {
        // Navigate to observation page with coordinates pre-selected
        const coordinates = {
            ra: result.ra,
            dec: result.dec
        };
        // Store coordinates in sessionStorage to be picked up by the observation page
        sessionStorage.setItem('selectedCoordinates', JSON.stringify(coordinates));
        navigate('/observation');
        toast.info("Coordenadas carregadas no Aladin Sky Atlas!");
    };

    return (
        <div className="border rounded-lg overflow-hidden mb-4 shadow-md">
            <div className="bg-gray-100 p-4 cursor-pointer flex justify-between items-center hover:bg-gray-200 transition" onClick={toggleOpen}>
                <div className="flex items-center gap-3">
                    <span className="font-semibold text-lg">{result.name}</span>
                    <span className="bg-green-500 text-white px-2 py-1 rounded text-sm">
                        ✓ Executado
                    </span>
                </div>
                {isOpen ? <span className="text-xl">−</span> : (
                    <div className="flex items-center gap-2">
                        <span className="bg-blue-500 text-white px-3 py-1 rounded text-sm">
                            {formatDate(result.executed_at)}
                        </span>
                        <span className="text-xl">+</span>
                    </div>
                )}
            </div>
            {isOpen && (
                <div className="p-4 space-y-2">
                    {result.object_name ? ( 
                        <p className="text-sm"><strong className="text-gray-600">Object Name:</strong> {result.object_name}</p>
                    )
                    :
                    <div>
                        <p className="text-sm"><strong className="text-gray-600">RA:</strong> {result.ra}</p>
                        <p className="text-sm"><strong className="text-gray-600">DEC:</strong> {result.dec}</p>
                    </div>
                    }
                    
                    <p className="text-sm"><strong className="text-gray-600">Filtros:</strong> {result.filters}</p>
                    <p className="text-sm"><strong className="text-gray-600">Frame mode:</strong> {result.framemode}</p>
                    <p className="text-sm"><strong className="text-gray-600">Tempo de exposição:</strong> {result.exptime}</p>
                    <p className="text-sm"><strong className="text-gray-600">Executed:</strong> {result.executed ? 'Yes' : 'No'}</p>
                    <p className="text-sm"><strong className="text-gray-600">Executed At:</strong> {result.executed_at}</p>
    
                    {/* Action buttons */}
                    <div className="flex gap-2 mt-4 mb-4">
                        <button 
                            onClick={(e) => { e.stopPropagation(); viewInAladin(); }}
                            className="bg-purple-500 text-white px-4 py-2 rounded-md hover:bg-purple-600 transition flex items-center gap-2"
                        >
                            🗺️ Ver no Aladin
                        </button>
                        <button 
                            onClick={(e) => { e.stopPropagation(); createSimilarPlan(); }}
                            className="bg-orange-500 text-white px-4 py-2 rounded-md hover:bg-orange-600 transition flex items-center gap-2"
                        >
                            🔄 Re-observar
                        </button>
                    </div>

                    <div className="space-y-4 mt-4">
                        {result.filters.split(',').map((filter, index) => (
                            <div key={filter} className="border rounded-lg p-3 space-y-2">
                                <h3 className="text-md font-semibold">{filter.trim()}</h3>
                                <img className="max-w-full h-auto border rounded-lg" src={images[filter.trim()]} alt={`${filter.trim()} filter`} />
                                <button 
                                    onClick={() => downloadFile(result.outputs.split(',')[index].trim(), filter.trim())}
                                    className="inline-block mt-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors duration-200">
                                    Download FITS
                                </button>
                                <button 
                                    onClick={() => downloadImage(images[filter.trim()], filter.trim())}
                                    className="inline-block mt-2 ml-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors duration-200">
                                    Download GIF
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}