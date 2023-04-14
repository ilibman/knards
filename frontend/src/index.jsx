import React from 'react';
import ReactDOM from 'react-dom/client';
import {
  createBrowserRouter,
  RouterProvider,
} from 'react-router-dom';

import './styles/index.scss';
import Root from './routes/root';
import ErrorPage from './error-page';
import New from './routes/new';
import Edit from './routes/edit';
import List from './routes/list';
import Explore from './routes/explore';

const router = createBrowserRouter([
  {
    path: '/',
    element: <Root />,
    errorElement: <ErrorPage />,
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
        element: <List />,
      },
      {
        path: 'explore',
        element: <Explore />,
      },
    ]
  },
]);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);