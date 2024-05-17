import React from 'react';
import ReactDOM from 'react-dom/client';
import {
  createBrowserRouter,
  RouterProvider,
} from 'react-router-dom';

import './styles/index.scss';
import { AuthProvider } from './context/AuthProvider';
import RequireAuth from './components/RequireAuth';
import Root from './routes/root';
import ErrorPage from './error-page';
import Registration from './routes/registration';
import Activation from './routes/activation';
import Login from './routes/login';
import New from './routes/new';
import Edit from './routes/edit';
import List from './routes/list';
import Explore from './routes/explore';
import Revise from './routes/revise';

const router = createBrowserRouter([
  {
    path: '/',
    element: <Root />,
    errorElement: <ErrorPage />,
    children: [
      {
        path: 'registration',
        element: <Registration />,
      },
      {
        path: 'activate/:uid/:token',
        element: <Activation />,
      },
      {
        path: 'login',
        element: <Login />,
      },
      {
        element: <RequireAuth />,
        children: [
          {
            path: 'new',
            element: <New />,
          },
          {
            path: 'edit/:id',
            element: <Edit />,
          },
          {
            path: 'list',
            element: <List />
          },
          {
            path: 'explore',
            element: <Explore />,
          },
          {
            path: 'revise/:id',
            element: <Revise />,
          },
        ]
      }
    ]
  },
]);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  </React.StrictMode>
);