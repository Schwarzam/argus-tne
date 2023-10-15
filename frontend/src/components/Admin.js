import React, {useEffect, useState} from 'react';
import { useNavigate } from 'react-router-dom';

import axios from 'axios';
import { toast } from 'react-toastify';

import { getCookie } from '../auth/cookies';

export default function Admin() {
    const navigate = useNavigate();

    const [users, setUsers] = useState([]);
    const [reservations, setReservations] = useState([]);

    const deleteReservation = (id) => {
        axios.post('/api/delete_reservation/', {reservation_id: id}, {headers: {'X-CSRFToken': getCookie('csrftoken')}})
            .then(res => {
                toast.success(res.data.message);
                getReservations();
            })
            .catch(err => {
                toast.error(err.response.data.message);
            });
    }

    const reserveTime = (data) => {
        axios.post('/api/reserve_time/', {user_email: data.query, start_time: data.startDate, end_time: data.endDate}, {headers: {'X-CSRFToken': getCookie('csrftoken')}})
            .then(res => {
                toast.success(res.data.message);
                getReservations();
            })
            .catch(err => {
                toast.error(err.response.data.message);
            });
    }

    const getReservations = () => {
        axios.get('/api/get_reservations')
            .then(res => {
                if (res.data.reservations){
                    setReservations(res.data.reservations);
                }
            })
            .catch(err => {
                toast.error(err.response.data.message);
                navigate('/login');
            });
    }

    const getEmails = () => {
        axios.get('/api/get_all_users_emails')
            .then(res => {
                console.log(res.data);
                if (res.data.emails){
                    setUsers(res.data.emails);
                }
            })
            .catch(err => {
                toast.error(err.response.data.message);
                navigate('/login');
            });
    }

    useEffect(() => {
        getEmails();
        getReservations();
        
        }, []);

    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-gray-100">
        <h1 className='font-bold text-3xl mb-10'>Painel Administrador</h1>
        <SearchAndDateComponent suggestions={users} onSubmit={reserveTime} />

        <ReservationsComponent reservations={reservations} deleteReservation={deleteReservation} />
        </div>
    );
}

const ReservationsComponent = ({ reservations, deleteReservation }) => {
    return (
      <div className="p-4 mt-10">
        <h2 className="text-2xl font-semibold mb-4 text-center">Reservas</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {reservations.map((reservation) => (
            <div key={reservation.id} className="bg-white p-4 rounded shadow-md relative">
              <h3 className="text-lg font-medium mb-2">Reserva ID: {reservation.id}</h3>
              <button onClick={() => deleteReservation(reservation.id)} className='absolute right-4 top-2 bg-red-500 rounded-lg px-2 py-2'>Delete</button>
              <p><span className="font-semibold">Email:</span> {reservation.user}</p>
              <p><span className="font-semibold">Nome:</span> {reservation.username}</p>
              <p><span className="font-semibold">Inicio:</span> {new Date(reservation.start_time).toLocaleString()}</p>
              <p><span className="font-semibold">Fim:</span> {new Date(reservation.end_time).toLocaleString()}</p>
            </div>
          ))}
        </div>
      </div>
    );
  };

const SearchAndDateComponent = ({ suggestions, onSubmit }) => {
    const [query, setQuery] = useState('');
    const [filteredSuggestions, setFilteredSuggestions] = useState([]);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [isInputFocused, setIsInputFocused] = useState(false);
    
    const handleChange = (e) => {
      const value = e.target.value;
      setQuery(value);
      setFilteredSuggestions(suggestions.filter(s => s.toLowerCase().includes(value.toLowerCase())));
    };
  
    const handleDateChange = (e) => {
      e.target.name === 'startDate' ? setStartDate(e.target.value) : setEndDate(e.target.value);
    };
  
    const handleSubmit = (e) => {
      e.preventDefault();
      if(onSubmit && typeof onSubmit === 'function') {
        onSubmit({
          query,
          startDate,
          endDate
        });
      }
    };
  
    const handleSuggestionClick = (suggestion) => {
      setQuery(suggestion);
      setIsInputFocused(false); // hide suggestions after selection
    }
  
    return (
      <form onSubmit={handleSubmit} className="space-y-4 relative">
        <p>Criar reserva de tempo para usuário.</p>
        <div>
          <input
            type="text"
            value={query}
            onChange={handleChange}
            onFocus={() => setIsInputFocused(true)}
            onBlur={() => setTimeout(() => setIsInputFocused(false), 150)} // Added delay
            placeholder="Search..."
            className="p-2 border rounded w-full"
          />
          {isInputFocused && filteredSuggestions.length > 0 && (
            <ul className="border rounded mt-2 p-2 absolute w-full bg-white">
              {filteredSuggestions.map((suggestion, idx) => (
                <li key={idx} className="p-1 hover:bg-gray-200 cursor-pointer text-sm" onClick={() => handleSuggestionClick(suggestion)}>
                  {suggestion}
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="flex space-x-4">
          <input 
            type="datetime-local"
            value={startDate}
            name="startDate"
            onChange={handleDateChange}
            className="p-2 border rounded"
          />
          <input 
            type="datetime-local"
            value={endDate}
            name="endDate"
            onChange={handleDateChange}
            className="p-2 border rounded"
          />
        </div>
        <button type="submit" className="p-2 bg-blue-500 text-white rounded">
          Reservar
        </button>
      </form>
    );
  };
  