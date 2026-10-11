import { Link } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout';
import Logo from '../components/Logo';

export default function LegalPage({ title }) {
  return (
    <AuthLayout>
      <Logo />
      <div className="card-head"><h1>{title}</h1><p>Placeholder page. Replace this with your real {title.toLowerCase()} before launch.</p></div>
      <Link to="/">Back to sign in</Link>
    </AuthLayout>
  );
}
