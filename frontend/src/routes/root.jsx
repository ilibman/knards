import { Outlet } from 'react-router-dom';
import { AuthProvider } from '../context/AuthProvider';
import Header from '../components/Header';
import Footer from '../components/Footer';
import 'rsuite/dist/rsuite-no-reset.min.css';

export default function Root() {
  return (
    <AuthProvider>
      <Header />
      <Outlet />
      <Footer />
    </AuthProvider>
  );
}