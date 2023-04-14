import { Link } from 'react-router-dom';

export default function Header() {
  return (
    <>
      <nav>
        <ul>
          <li>
            <Link to={'/'}>Home</Link>
          </li>
          <li>
            <Link to={'new'}>New knard</Link>
          </li>
          <li>
            <Link to={'list'}>My knards</Link>
          </li>
          <li>
            <Link to={'explore'}>Explore</Link>
          </li>
        </ul>
      </nav>
    </>
  );
}