import { Outlet } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import { AuthProvider} from '../context/AuthProvider';
import Header from '../components/Header';
import Footer from '../components/Footer';

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