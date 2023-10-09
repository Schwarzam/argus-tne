import { io } from "socket.io-client";
const socket = io('/', { withCredentials: true });

class Socket{
    constructor(){
        this.socket = null;
    }

    connect(){
        this.socket = io('/', { withCredentials: true });
    }

    disconnect(){
        this.socket.disconnect();
    }

    send(type, message){
        this.socket.emit(type, message);
    }

    on(event, callback){
        this.socket.on(event, callback);
    }
}

const sio = new Socket();

export default sio;