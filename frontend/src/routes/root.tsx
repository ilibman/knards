import { useQuery } from '@tanstack/react-query';
import { Outlet, useLocation } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';

import { AuthProvider} from '../context/AuthProvider';
import useAuth from '../context/AuthProvider';
import { getHomeInfo } from '../query-client';
import Header from '../components/Header';
import Footer from '../components/Footer';

export default function Root() {
  const { pathname } = useLocation();
  const { authTokens } = useAuth();

  const {
    data: homeInfo,
    isLoading: isHomeInfoLoading,
  } = useQuery({
    ...getHomeInfo(authTokens.access)
  });

  return (
    <AuthProvider>
      <Header />
      {!isHomeInfoLoading && pathname === '/' && (
        <div className="my-3 mx-8">
          <div className="flex">
            <h6 className="text-white text-lg font-semibold normal-case">
              Total cards:
            </h6>
            <p className="ml-2 text-white text-lg">{homeInfo.cards_total}</p>
          </div>
          {homeInfo.recommendations.length > 0 && <div className="flex flex-col">
            <h6 className="text-white text-lg font-semibold normal-case">
              Recommendations:
            </h6>
            <div className="ml-5">
              {homeInfo.recommendations.slice(0, 3).map((_) => (
                <p className="ml-2 text-white text-lg">{_}</p>
              ))}
            </div>
          </div>}
        </div>
      )}
      <Outlet />
      <Footer />
      <ToastContainer />
    </AuthProvider>
  );
}