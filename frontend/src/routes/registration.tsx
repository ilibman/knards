import { useRef, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaCheck, FaTimes } from 'react-icons/fa';
import { IoInformationCircleOutline } from 'react-icons/io5';
import api from '../api';

const EMAIL_REGEX = /^(([^<>()[\]\.,;:\s@\"]+(\.[^<>()[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i;
const USERNAME_REGEX = /^[a-zA-Z][a-zA-Z0-9-_]{3,23}$/;
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%]).{8,24}$/;

export default function Registration() {
  const emailRef = useRef();
  const usernameRef = useRef();
  const errorRef = useRef();

  const [email, setEmail] = useState('');
  const [validEmail, setValidEmail] = useState(false);
  const [emailFocus, setEmailFocus] = useState(false);

  const [username, setUsername] = useState('');
  const [validUsername, setValidUsername] = useState(false);
  const [usernameFocus, setUsernameFocus] = useState(false);

  const [password, setPassword] = useState('');
  const [validPassword, setValidPassword] = useState(false);
  const [passwordFocus, setPasswordFocus] = useState(false);

  const [matchPassword, setMatchPassword] = useState('');
  const [validMatchPassword, setValidMatchPassword] = useState(false);
  const [matchPasswordFocus, setMatchPasswordFocus] = useState(false);

  const [errorMsg, setErrorMsg] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    emailRef.current.focus();
  }, []);

  useEffect(() => {
    setValidEmail(EMAIL_REGEX.test(email));
  }, [email]);

  useEffect(() => {
    setValidUsername(USERNAME_REGEX.test(username));
  }, [username]);

  useEffect(() => {
    setValidPassword(PASSWORD_REGEX.test(password));
    setValidMatchPassword(password === matchPassword);
  }, [password, matchPassword]);

  useEffect(() => {
    setErrorMsg('');
  }, [username, password, matchPassword]);

  async function handleSubmit(e) {
    e.preventDefault();

    // if someone activates the submit button via console
    const emailValid = EMAIL_REGEX.test(email);
    const usernameValid = USERNAME_REGEX.test(username);
    const passwordValid = PASSWORD_REGEX.test(password);
    if (!emailValid || !usernameValid || !passwordValid) {
      setErrorMsg('Invalid entry');
      return;
    }

    setSuccess(true);

    try {
      await api.post(
        'auth/users/',
        JSON.stringify({
          username,
          email,
          password,
          re_password: matchPassword,
          card_series: [],
          cards: []
        }),
        {
          headers: {
            'Content-Type': 'application/json',
          },
          withCredentials: true
        }
      );
    } catch (error: any) {
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
    } finally {
    }
  }

  return (
    <>
      {success ? (
        <div className="h-screen flex flex-col justify-center">
          <div className="flex flex-col justify-start
              w-full max-w-[420px] mx-auto p-4
              border-2 border-black">
            <h1 className="text-xl font-bold text-center">Success!</h1>
            <p className="text-center">
              <Link
                className="underline"
                to={'/login'}
              >
                Login
              </Link>
            </p>
          </div>
        </div>
      ) : (
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
            <h1 className="text-xl font-bold text-center">Registration</h1>
            <form
              className="flex flex-col justify-evenly"
              onSubmit={handleSubmit}
            >
              <label
                className="flex my-2 font-base font-semibold text-lg"
                htmlFor="email"
              >
                Email:
                <span className={validEmail
                  ? 'relative top-[5px] ml-2'
                  : 'hidden'}>
                  <FaCheck className="fill-green" />
                </span>
                <span className={validEmail || !email
                  ? 'hidden'
                  : 'relative top-[5px] ml-2'}>
                  <FaTimes className="fill-red-dark" />
                </span>
              </label>
              <input
                className="p-2 pt-1.5 rounded-sm outline-none"
                type="text"
                id="email"
                ref={emailRef}
                autoComplete="off"
                required
                aria-invalid={validEmail ? 'false' : 'true'}
                aria-describedby="email-note"
                onChange={(e) => setEmail(e.target.value)}
                onFocus={() => setEmailFocus(true)}
                onBlur={() => setEmailFocus(false)}
              />
              <p
                id="email-note"
                className={emailFocus && email && !validEmail
                  ? `relative bottom-[-10px] p-1 text-white text-sm
                    rounded bg-black`
                  : 'offscreen'}
              >
                <IoInformationCircleOutline
                  className="w-[20px] h-[20px] stroke-white fill-white"
                />
                Must be valid email.
              </p>
              <label
                className={`flex mb-2 font-base font-semibold text-lg
                  ${emailFocus && email && !validEmail ? 'mt-4' : 'mt-8'}`}
                htmlFor="username"
              >
                Username:
                <span className={validUsername
                  ? 'relative top-[5px] ml-2'
                  : 'hidden'}>
                  <FaCheck className="fill-green" />
                </span>
                <span className={validUsername || !username
                  ? 'hidden'
                  : 'relative top-[5px] ml-2'}>
                  <FaTimes className="fill-red-dark" />
                </span>
              </label>
              <input
                className="p-2 pt-1.5 rounded-sm outline-none"
                type="text"
                id="username"
                ref={usernameRef}
                autoComplete="off"
                required
                aria-invalid={validUsername ? 'false' : 'true'}
                aria-describedby="uid-note"
                onChange={(e) => setUsername(e.target.value)}
                onFocus={() => setUsernameFocus(true)}
                onBlur={() => setUsernameFocus(false)}
              />
              <p
                id="uid-note"
                className={usernameFocus && username && !validUsername
                  ? `relative bottom-[-10px] p-1 text-white text-sm
                    rounded bg-black`
                  : 'offscreen'}
              >
                <IoInformationCircleOutline
                  className="w-[20px] h-[20px] stroke-white fill-white"
                />
                4 to 24 characters.<br />
                Must begin with a letter.<br />
                Letters, numbers, underscores, hyphens allowed.
              </p>
              <label
                className={`flex mb-2 font-base font-semibold text-lg
                  ${usernameFocus && username && !validUsername ? 'mt-4' : 'mt-8'}`}
                htmlFor="password"
              >
                Password:
                <span className={validPassword
                  ? 'relative top-[5px] ml-2'
                  : 'hidden'}>
                  <FaCheck className="fill-green" />
                </span>
                <span className={validPassword || !password
                  ? 'hidden'
                  : 'relative top-[5px] ml-2'}>
                  <FaTimes className="fill-red-dark" />
                </span>
              </label>
              <input
                className="p-2 pt-1.5 rounded-sm outline-none"
                type="password"
                id="password"
                required
                aria-invalid={validPassword ? 'false' : 'true'}
                aria-describedby="pwd-note"
                onChange={(e) => setPassword(e.target.value)}
                onFocus={() => setPasswordFocus(true)}
                onBlur={() => setPasswordFocus(false)}
              />
              <p
                id="pwd-note"
                className={passwordFocus && !validPassword
                  ? `relative bottom-[-10px] p-1 text-white text-sm
                    rounded bg-black`
                  : 'offscreen'}
              >
                <IoInformationCircleOutline
                  className="w-[20px] h-[20px] stroke-white fill-white"
                />
                8 to 24 characters.<br />
                Must include uppercase and lowercase letters, a number and a special character.<br />
                Allowed special characters:&nbsp;
                <span className="text-white" aria-label="exclamation mark">!</span>&nbsp;
                <span className="text-white" aria-label="at symbol">@</span>&nbsp;
                <span className="text-white" aria-label="hashtag">#</span>&nbsp;
                <span className="text-white" aria-label="dollar sign">$</span>&nbsp;
                <span className="text-white" aria-label="percent">%</span>
              </p>
              <label
                className={`flex mb-2 font-base font-semibold text-lg
                  ${passwordFocus && !validUsername ? 'mt-4' : 'mt-8'}`}
                htmlFor="confirm-password"
              >
                Confirm password:
                <span className={validMatchPassword && matchPassword
                  ? 'relative top-[5px] ml-2'
                  : 'hidden'}>
                  <FaCheck className="fill-green" />
                </span>
                <span className={validMatchPassword || !matchPassword
                  ? 'hidden'
                  : 'relative top-[5px] ml-2'}>
                  <FaTimes className="fill-red-dark" />
                </span>
              </label>
              <input
                className="p-2 pt-1.5 rounded-sm outline-none"
                type="password"
                id="confirm-password"
                required
                aria-invalid={validMatchPassword ? 'false' : 'true'}
                aria-describedby="confirm-note"
                onChange={(e) => setMatchPassword(e.target.value)}
                onFocus={() => setMatchPasswordFocus(true)}
                onBlur={() => setMatchPasswordFocus(false)}
              />
              <p
                id="confirm-note"
                className={matchPasswordFocus && !validMatchPassword
                  ? `relative bottom-[-10px] p-1 text-white text-sm
                    rounded bg-black`
                  : 'offscreen'}
              >
                <IoInformationCircleOutline
                  className="w-[20px] h-[20px] stroke-white fill-white"
                />
                Must match the first password input field.
              </p>
              <button
                className="self-center mt-5 px-8 py-2 font-semibold uppercase
                  bg-white rounded-sm disabled:opacity-50"
                disabled={!validUsername || !validPassword || !validMatchPassword ? true : false}
              >
                Sign up
              </button>
            </form>
            <p className="mt-3 text-center">
              Already registered?
              <Link
                className="ml-1 underline"
                to={'/login'}
              >
                Login
              </Link>
            </p>
          </div>
        </div>
      )}
    </>
  );
}