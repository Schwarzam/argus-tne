import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function Register() {
  const [formData, setFormData] = useState({
    email: '',
    completeName: '',
    password1: '',
    password2: '',
  });

  const [errors, setErrors] = useState({});
  const [passwordError, setPasswordError] = useState('');

  let navigate = useNavigate();

  const renderErrors = (errors) => {
    try{
        return Object.keys(errors).map((key) => (
            <div key={key} className="py-1">
              <p className="text-red-500 text-sm font-semibold">{key}:</p>
              {errors[key].map((error, index) => (
                <p key={index} className="text-red-500 text-xs italic ml-2">- {error}</p>
              ))}
            </div>
          ));
    }
    catch(err){
        return <div></div>
    }   
    
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setPasswordError('');
    if (formData.password1 !== formData.password2) {
      setPasswordError('Passwords must be equal!');
      return;
    }


    await axios.post('/api/auth/register/', formData)
    .then((res) => {

        }
    ).catch((err) => {
            if (err.response.status === 500){
                setErrors({"email": ["Email already in use"]});
            }else if ("detail" in err.response.data){
                navigate('/');
            }
            else{
                setErrors(err.response.data);
            }
        }
    );

  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">Register</h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <input type="hidden" name="remember" value="true" />
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email" className="sr-only">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Email address"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div className="py-2">
              {errors.email && <p className="text-red-500 text-xs italic">{errors.email[0]}</p>}
            </div>
            <div>
              <label htmlFor="completeName" className="sr-only">
                Complete Name
              </label>
              <input
                id="completeName"
                name="completeName"
                type="text"
                autoComplete="name"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Complete Name"
                value={formData.completeName}
                onChange={(e) => setFormData({ ...formData, completeName: e.target.value })}
              />
            </div>
            <div>
              <label htmlFor="password1" className="sr-only">
                Password
              </label>
              <input
                id="password1"
                name="password1"
                type="password"
                autoComplete="new-password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Password"
                value={formData.password1}
                onChange={(e) => setFormData({ ...formData, password1: e.target.value })}
              />
            </div>
            <div>
              <label htmlFor="password2" className="sr-only">
                Confirm Password
              </label>
              <input
                id="password2"
                name="password2"
                type="password"
                autoComplete="new-password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Confirm Password"
                value={formData.password2}
                onChange={(e) => setFormData({ ...formData, password2: e.target.value })}
              />
            </div>
            <div className="py-2">
              {passwordError && <p className="text-red-500 text-xs italic">{passwordError}</p>}
              {errors && renderErrors(errors)}
            </div>
          </div>
          <div>
            <button
              type="submit"
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Register
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Register;