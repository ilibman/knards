import { useRef, useState, useEffect, useContext } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import AuthContext from '../context/AuthProvider';
import api from '../api';

export default function Login() {
  const { setAuthTokens, setUserId } = useContext(AuthContext);

  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/';

  const loginRef = useRef();
  const errorRef = useRef();

  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    loginRef.current.focus();
  }, []);

  useEffect(() => {
    setErrorMsg('');
  }, [login, password]);

  async function handleSubmit(e) {
    e.preventDefault();

    try {
      const response = await api.post(
        'auth/jwt/create/',
        JSON.stringify({
          email: login,
          password
        }),
        {
          headers: {
            'Content-Type': 'application/json'
          },
          withCredentials: true
        }
      );
      
      setAuthTokens(response.data);
      setUserId(jwtDecode(response.data.access).user_id);
      localStorage.setItem('authTokens', JSON.stringify(response.data));
      localStorage.setItem(
        'userId',
        JSON.stringify(jwtDecode(response.data.access).user_id)
      );

      setLogin('');
      setPassword('');

      navigate(from, { replace: true });
    } catch (error) {
      console.log(error)
      if (!error.response) {
        setErrorMsg('No server response');
      } else if (error.response.status === 400) {
        setErrorMsg('Missing Username and/or Password');
      } else if (error.response.status === 401) {
        setErrorMsg('Unauthorized');
      } else {
        setErrorMsg('Login failed');
      }
      errorRef.current.focus();
    }
  }

  return (
    <div className="h-screen flex flex-col justify-center">
      <div className="flex flex-col justify-start
        w-full max-w-[420px] mx-auto p-4
        border-2 border-black">
        <p
          ref={errorRef}
          className={`mb-2 p-2 text-red-dark font-bold bg-red-light
            ${errorMsg ? '' : 'offscreen'}`}
          aria-live="assertive"
        >{errorMsg}</p>
        <h1 className="text-xl font-bold text-center">Login</h1>
        <form
          className="flex flex-col justify-evenly"
          onSubmit={handleSubmit}
        >
          <label
            className="flex my-2 font-base font-semibold text-lg"
            htmlFor="email"
          >
            Email:
          </label>
          <input
            className="p-2 pt-1.5 rounded-sm outline-none"
            type="text"
            id="email"
            ref={loginRef}
            autoComplete="off"
            value={login}
            required
            onChange={(e) => setLogin(e.target.value)}
          />
          <label
            className="mt-2 flex mb-2 font-base font-semibold text-lg"
            htmlFor="password"
          >
            Password:
          </label>
          <input
            className="p-2 pt-1.5 rounded-sm outline-none"
            type="password"
            id="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            className="self-center mt-5 px-8 py-2 font-semibold uppercase
              bg-white rounded-sm"
          >
            Sign in
          </button>
        </form>
        <p className="mt-3 text-center">
          Need an account?
          <Link
            className="ml-1 underline"
            to={'/registration'}
          >
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}