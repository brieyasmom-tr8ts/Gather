import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Register from './pages/Register';
import Confirmation from './pages/Confirmation';
import Ticket from './pages/Ticket';
import FAQ from './pages/FAQ';
import AdminLogin from './pages/AdminLogin';
import Admin from './pages/Admin';
import AdminSettings from './pages/AdminSettings';
import Scanner from './pages/Scanner';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/register" element={<Register />} />
      <Route path="/confirmation/:groupId" element={<Confirmation />} />
      <Route path="/ticket/:ticketId" element={<Ticket />} />
      <Route path="/faq" element={<FAQ />} />
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/admin" element={<Admin />} />
      <Route path="/admin/settings" element={<AdminSettings />} />
      <Route path="/admin/scanner" element={<Scanner />} />
    </Routes>
  );
}
