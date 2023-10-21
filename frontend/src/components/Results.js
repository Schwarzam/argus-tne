import axios from 'axios';

export default function Results(props) {
    const [results, setResults] = useState([]);

    useEffect(() => {
        axios.get('/api/fetch_observed')
            .then((res) => res.json())
            .then((data) => setResults(data));
    }, []);

    return (
        <div>
            <h1>Results</h1>
            <p>Results will be displayed here</p>
        </div>
    )
}