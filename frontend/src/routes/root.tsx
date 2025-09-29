import { Outlet } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import { AuthProvider} from '../context/AuthProvider';
import Header from '../components/Header';
import Footer from '../components/Footer';
import 'rsuite/dist/rsuite-no-reset.min.css';
import '../styles/rs-suite-overrides.scss';

export default function Root() {
  return (
    <AuthProvider>
      <Header />
      <Outlet />
      <Footer />
      <ToastContainer />
    </AuthProvider>
  );
}