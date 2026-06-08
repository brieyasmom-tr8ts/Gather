import { Link } from 'react-router-dom';
import { useEvent } from '../hooks/useEvent';

export default function SiteFooter() {
  const { event } = useEvent();
  return (
    <footer className="bg-gala-dark text-white/70 py-12 px-6">
      <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <p className="text-sm">
          &copy; {new Date().getFullYear()} GiveSendGo. All rights reserved.
        </p>
        <div className="flex items-center gap-6 text-sm">
          <Link to="/" className="hover:text-white">Home</Link>
          <Link to="/register" className="hover:text-white">Register</Link>
          <Link to="/faq" className="hover:text-white">FAQ</Link>
          {event.giver_army_signup_url && (
            <a href={event.giver_army_signup_url} target="_blank" rel="noreferrer" className="hover:text-white">
              Giver Army
            </a>
          )}
        </div>
      </div>
    </footer>
  );
}
