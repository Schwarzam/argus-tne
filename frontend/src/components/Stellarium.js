import React, { useState, useEffect } from "react";

import React from "react";

export default function Stellarium() {
    return (
        <div>
            <iframe
                title="Stellarium"
                src="https://stellarium-web.org/"
                width="100%"
                height="600px"
                frameBorder="0"
            ></iframe>
        </div>
    );
}
