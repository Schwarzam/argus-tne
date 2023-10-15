import { useState, useEffect } from 'react';
import { getCookie } from './cookies';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

import info from './appinfo';
import sio from './socket';

function Login() {
  const [formData, setFormData] = useState({
	email: '',
	password: ''
  });

  const [errors, setErrors] = useState({});
  const navigate = useNavigate();
  const handleChange = (e) => {
	setFormData({
	  ...formData,
	  [e.target.name]: e.target.value
	});
  }

  useEffect(() => {
	const csrfToken = getCookie('csrftoken');
	const sessionid = getCookie('sessionid');
	if (sessionid) {
	  navigate('/');
	}
  }, []);

  const handleSubmit = async (e) => {
	e.preventDefault();
	setErrors({});
	
	await axios.post('/api/auth/login/', formData)
		.then((res) => {
				sio.connect();
				navigate('/');
			}
		)
		.catch((err) => {
			if (err.response.status === 403){
				navigate('/');
			}
			console.log('Error: ', err.response);
			setErrors(err.response.data);
			}
		);
  }

  const renderErrors = (errors) => {
	return Object.keys(errors).map((key) => (
	  <div key={key} className="py-1">
		<p className="text-red-500 text-sm font-semibold">{key}:</p>
		{errors[key].map((error, index) => (
		  <p key={index} className="text-red-500 text-xs italic ml-2">- {error}</p>
		))}
	  </div>
	));
  }

  return (
	<div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
	  <div className="max-w-md w-full space-y-8">
		<div>
		  <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">Login</h2>
		</div>
		<form className="mt-8 space-y-6" onSubmit={handleSubmit}>
		  <input type="hidden" name="remember" value="true" />
		  <div className="rounded-md shadow-sm -space-y-px">
			<div>
			  <label htmlFor="email" className="sr-only">Email address</label>
			  <input id="email" name="email" type="email" autoComplete="email" required className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm" placeholder="Email address" value={formData.email} onChange={handleChange} />
			</div>
			<div>
			  <label htmlFor="password" className="sr-only">Password</label>
			  <input id="password" name="password" type="password" autoComplete="current-password" required className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm" placeholder="Password" value={formData.password} onChange={handleChange} />
			</div>
		  </div>
		  
		  {errors && renderErrors(errors)}

		  <div>
			<button type="submit" className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary">
			  Log in
			</button>
		  </div>
		  <div>
			<p className='cursor-pointer' onClick={() => navigate("/register")}>
				Não tem cadastro?
			</p>
		  </div>
		</form>
	  </div>
	</div>
  );
}

export default Login;