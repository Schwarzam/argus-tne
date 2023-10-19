import React, { useEffect, useState } from "react";

import sio from "../auth/socket";

export default function TelescopeStatus() {

    const [telescopeStatus, setTelescopeStatus] = useState({});

    useEffect(() => {


        sio.on("telescope_status", (message) => {
            setTelescopeStatus(message);
        });

        sio.send('check_telescope_status');
        const interval = setInterval(() => {
            sio.send('check_telescope_status');
        }, 5000);

        return () => clearInterval(interval);
        
    }, []);


    return (
        <div className="w-full max-w-xl mx-auto py-6 px-4 rounded-md">
            <TelescopeStatusDiv data={telescopeStatus} />
        </div>
    );
}

const getStatusColor = (status) => {
    if (!status) return 'bg-gray-300';
    if (status === 'idle') return 'bg-yellow-200';
    if (status.includes('error')) return 'bg-red-200';
    if (status.includes('executing') || status.includes('sending')) return 'bg-green-200';
    return 'bg-gray-300'; // default color
};

const TelescopeStatusDiv = ({ data }) => {
    const statusColor = getStatusColor(data.status);

    return (
        <div className="w-full bg-gray-800 text-white p-8 rounded-lg shadow-md">
            <h1 className="text-2xl font-bold mb-4">Telescope: {data.name}</h1>
            <div className="grid grid-cols-2 gap-4">
                <p><span className="font-semibold">Status:</span> <span className={`p-1 rounded text-black font-bold ${statusColor}`}>{data.status}</span></p>
                <p><span className="font-semibold">Plan ID:</span> {data.executing_plan_id}</p>
                <p><span className="font-semibold">RA:</span> {data.ra}</p>
                <p><span className="font-semibold">DEC:</span> {data.dec}</p>
                <p><span className="font-semibold">Altitude:</span> {data.alt}</p>
                <p><span className="font-semibold">Azimuth:</span> {data.az}</p>
                <p><span className="font-semibold">Operation:</span> <pre>{data.operation || 'None'}</pre></p>
            </div>
        </div>
    );
}