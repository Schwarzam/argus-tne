import axios from "axios";

class AppInfo {
    constructor() {
        this.info = null;
        this.loadingPromise = this.load();
    }
    
    async load() {
        if (this.loadingPromise) return this.loadingPromise;

        this.loadingPromise = axios.get('/api/appinfo/')
            .then(response => {
                this.info = response.data;
                console.log("App info loaded")
                return response.data;
            })
            .catch(error => {
                console.log(error);
            });
        
        return this.loadingPromise;
    }

    syncLoad() {
        axios.get('/api/appinfo/')
        .then(response => {
            this.info = response.data;
            console.log("App info loaded")
            return response.data;
        })
        .catch(error => {
            console.log(error);
        });
    }

    async get(key) {
        if (!this.info) await this.load();
        return this.info[key];
    }
}

const info = new AppInfo();

export default info;
