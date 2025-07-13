import { useEffect, useContext } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import { AuthProvider} from '../context/AuthProvider';
import AuthContext from '../context/AuthProvider';
import Header from '../components/Header';
import Footer from '../components/Footer';
import 'rsuite/dist/rsuite-no-reset.min.css';
import api from '../api';
import '../styles/rs-suite-overrides.scss';

export default function Root() {
  const { authTokens } = useContext(AuthContext);
  const location = useLocation();
  
  useEffect(() => {
    if (location.pathname !== '/revise') {
      const cardset = localStorage.getItem('cardset')
        ? JSON.parse(localStorage.getItem('cardset'))
        : null;
        
      if (cardset) {
        cardset.forEach((_) => {
          if (_.revised) {
            saveCardScore(_.card_score_id, _.id, _.score);
          }
        });
    
        localStorage.removeItem('cardset');
      }
    }
  }, [location]);

  // i implemented this here, because i want revised cards to be saved
  // upon each route change, if there're any revised cards, in the background
  async function saveCardScore(cardScoreId, cardId, newScore) {
    try {
      const response = cardScoreId
        ? await api.patch(
          `api/cards/card-scores/${cardScoreId}/`,
          { score: newScore },
          {
            headers: {
              Authorization: `JWT ${authTokens.access}`,
              'X-CSRFToken': document.cookie.replace(
                /(?:(?:^|.*;\s*)csrftoken\s*\=\s*([^;]*).*$)|^.*$/, "$1"
              )
            },
            withCredentials: true
          }
        )
        : await api.post(
          'api/cards/card-scores/',
          {
            card: cardId,
            score: newScore
          },
          {
            headers: {
              Authorization: `JWT ${authTokens.access}`,
              'X-CSRFToken': document.cookie.replace(
                /(?:(?:^|.*;\s*)csrftoken\s*\=\s*([^;]*).*$)|^.*$/, "$1"
              )
            },
            withCredentials: true
          }
        )
    } catch (error) {
      if (!error.response) {
        console.error(error.message);
      }
    } finally {
      const cardset = localStorage.getItem('cardset')
        ? JSON.parse(localStorage.getItem('cardset'))
        : null;
      if (cardset) {
        localStorage.setItem('cardset', JSON.stringify(cardset.filter((_, i) => (
          _.id !== cardId 
        ))));
      }
    }
  }

  return (
    <AuthProvider>
      <Header />
      <Outlet />
      <Footer />
      <ToastContainer />
    </AuthProvider>
  );
}