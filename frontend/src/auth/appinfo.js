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
                console.log(response.data);
                this.info = response.data;
                return response.data;
            })
            .catch(error => {
                console.log(error);
                throw error;
            });
        
        return this.loadingPromise;
    }

    async get(key) {
        if (!this.info) await this.load();
        return this.info[key];
    }
}

const info = new AppInfo();

export default info;
