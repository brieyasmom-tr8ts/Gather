import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Register from './pages/Register';
import Confirmation from './pages/Confirmation';
import Edit from './pages/Edit';
import FAQPage from './pages/FAQPage';
import Ticket from './pages/Ticket';
import AdminLogin from './pages/AdminLogin';
import Admin from './pages/Admin';
import Scanner from './pages/Scanner';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/register" element={<Register />} />
      <Route path="/confirmation/:groupId" element={<Confirmation />} />
      <Route path="/edit/:token" element={<Edit />} />
      <Route path="/faq" element={<FAQPage />} />
      <Route path="/ticket/:ticketId" element={<Ticket />} />
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/admin" element={<Admin />} />
      <Route path="/admin/scanner" element={<Scanner />} />
    </Routes>
  );
}
