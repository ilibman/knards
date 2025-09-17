import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import { AuthProvider} from '../context/AuthProvider';
import useAuth from '../context/AuthProvider';
import Header from '../components/Header';
import Footer from '../components/Footer';
import 'rsuite/dist/rsuite-no-reset.min.css';
import '../styles/rs-suite-overrides.scss';

export default function Root() {
  const { authTokens } = useAuth();
  const location = useLocation();
  
//   useEffect(() => {
//     if (location.pathname !== '/revise') {
//         localStorage.removeItem('cardset');
//     }
//   }, [location]);

  return (
    <AuthProvider>
      <Header />
      <Outlet />
      <Footer />
      <ToastContainer />
    </AuthProvider>
  );
}