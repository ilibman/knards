import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../api';

export default function Activation() {
  const { uid } = useParams();
  const { token } = useParams();

  const [verified, setVerified] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    verify(uid, token)
  }, []);

  useEffect(() => {
    setErrorMsg('');
  }, [verified]);

  async function verify(uid, token) {
    try {
      await api.post(
        'auth/users/activation/',
        JSON.stringify({ uid, token }),
        {
          headers: {
            'Content-Type': 'application/json'
          },
          withCredentials: true
        }
      );

      setVerified(true);
    } catch (error) {
      if (!error.response) {
        setErrorMsg('No server response');
      } else if (error.response.status === 400) {
        setErrorMsg('Missing Username and/or Password');
      } else if (error.response.status === 401) {
        setErrorMsg('Unauthorized');
      } else {
        setErrorMsg('Login failed');
      }
    }
  }

  return (
    <div className="h-screen flex flex-col justify-center">
      <div className="flex flex-col justify-start
        w-full max-w-[420px] mx-auto p-4
        border-2 border-black">
        <p
          className={`mb-2 p-2 text-red-dark font-bold bg-red-light
            ${errorMsg ? '' : 'offscreen'}`}
          aria-live="assertive"
        >{errorMsg}</p>
        <p className="mt-3 text-center">
          Your email was successfully verified!
        </p>
        <p className="mt-3 text-center">
          Go to&nbsp;
          <Link
            className="underline"
            to={'/login'}
          >
            Login
          </Link>
          &nbsp;page
        </p>
      </div>
    </div>
  );
}