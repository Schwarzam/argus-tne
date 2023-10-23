import axios from 'axios';
import React, { useEffect, useState } from 'react';

import { getCookie } from '../auth/cookies';

export default function Results(props) {
    const [results, setResults] = useState([]);

    useEffect(() => {
        axios.get('/api/fetch_observed')
            .then((res) => {
                setResults(res.data);
            })
            .catch((err) => console.log(err));
    }, []);

    return (
        <div className='w-[80%] m-auto mt-16'>
            <h1>Minhas observacoes</h1>
            {results.map((result) => (
                <Result key={result.id} result={result} />
            ))}
        </div>
    )
}

const Result = ({ result }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [images, setImages] = useState({});


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

    const formatDate = (dateStr) => {
        const dateObj = new Date(dateStr);
        return `${dateObj.toLocaleDateString()} ${dateObj.toLocaleTimeString()}`;
    }

    const toggleOpen = () => setIsOpen(!isOpen);

    return (
        <div className="border rounded-lg overflow-hidden mb-4">
            <div className="bg-gray-200 p-4 cursor-pointer flex justify-between" onClick={toggleOpen}>
                <span>{result.name}</span>
                {isOpen ? <span>-</span> : (
                    <div>
                        <span className="bg-blue-500 text-white px-2 py-1 rounded">
                            Executed on {formatDate(result.executed_at)}
                        </span>
                        <span className='ml-2'>+</span>
                    </div>
                    
                )}
            </div>
            {isOpen && (
                <div className="p-4 space-y-2">
                    <p className="text-sm"><strong className="text-gray-600">RA:</strong> {result.ra}</p>
                    <p className="text-sm"><strong className="text-gray-600">DEC:</strong> {result.dec}</p>
                    <p className="text-sm"><strong className="text-gray-600">Filtros:</strong> {result.filters}</p>
                    <p className="text-sm"><strong className="text-gray-600">Frame mode:</strong> {result.framemode}</p>
                    <p className="text-sm"><strong className="text-gray-600">Tempo de exposição:</strong> {result.exptime}</p>
                    <p className="text-sm"><strong className="text-gray-600">Executed:</strong> {result.executed ? 'Yes' : 'No'}</p>
                    <p className="text-sm"><strong className="text-gray-600">Executed At:</strong> {result.executed_at}</p>
    
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
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}