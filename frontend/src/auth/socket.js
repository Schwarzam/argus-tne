import { io } from "socket.io-client";
const socket = io('/', { withCredentials: true });

class Socket{
    constructor(){
        this.socket = io('/', { withCredentials: true });
    }

    connect(){
        if (!this.socket) {
            this.socket = io('/', { withCredentials: true });
        }
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

    off(event, callback){
        if (this.socket && this.socket.off) {
            this.socket.off(event, callback);
        }
    }
}

const sio = new Socket();

export default sio;