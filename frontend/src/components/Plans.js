import React, { useEffect, useState } from "react";

import sio from "../auth/socket";
import axios from "axios";

export default function Plans() {

    useEffect(() => {
        axios.get("/api/fetch_plans/")
            .then((response) => {
                console.log(response);
            })
    }, [])

    return (
        <div>

        </div>
    );
}