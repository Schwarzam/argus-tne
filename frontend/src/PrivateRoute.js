import { Navigate } from 'react-router-dom';
import { getCookie } from './auth/cookies';

export default function PrivateRoute({ children }) {
  const sessionId = getCookie('sessionid');
  const csrf = getCookie('csrftoken');

  if (sessionId && csrf) {
    return children;
  }

  return <Navigate to="/login" replace />;
}