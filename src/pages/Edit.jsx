import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import SiteFooter from '../components/SiteFooter';
import AttendeeForm from '../components/AttendeeForm';
import { GIVER_ARMY_TENURE_OPTIONS } from '../config';

const emptyAttendee = () => ({
  ticketId: null,
  firstName: '', lastName: '', email: '', phone: '',
  giverArmy: null, giverArmyTenure: '', mediaConsent: true,
});

// Map a server attendee shape to a form shape.
function toFormShape(a) {
  return {
    ticketId: a.ticket_id,
    firstName: a.first_name || '',
    lastName: a.last_name || '',
    email: a.email || '',
    phone: a.phone || '',
    giverArmy: !!a.is_giver_army,
    giverArmyTenure: a.giver_army_tenure || '',
    mediaConsent: !!a.media_consent || true,
  };
}

export default function Edit() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [attendees, setAttendees] = useState([]);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [serverError, setServerError] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch(`/api/edit/${token}`)
      .then((r) => r.ok ? r.json() : Promise.reject())
      .then((body) => {
        setData(body);
        setAttendees(body.attendees.map(toFormShape));
      })
      .catch(() => setLoadError('This link is invalid or has expired.'))
      .finally(() => setLoading(false));
  }, [token]);

  const update = (i, a) => setAttendees((p) => p.map((x, idx) => idx === i ? a : x));
  const add = () => attendees.length < 2 && setAttendees((p) => [...p, emptyAttendee()]);
  const remove = (i) => setAttendees((p) => p.filter((_, idx) => idx !== i));

  const validate = () => {
    const next = {};
    const emails = new Set();
    attendees.forEach((a, i) => {
      const f = {};
      if (!a.firstName.trim()) f.firstName = 'Required';
      if (!a.lastName.trim()) f.lastName = 'Required';
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(a.email || '')) f.email = 'Invalid email';
      else if (emails.has(a.email.toLowerCase())) f.email = 'Duplicate email';
      if (a.email) emails.add(a.email.toLowerCase());
      if (Object.keys(f).length) next[i] = f;
    });
    setErrors(next);
    return !Object.keys(next).length;
  };

  const submit = async () => {
    if (!validate()) return;
    setSaving(true); setServerError(''); setSaved(false);
    try {
      const res = await fetch(`/api/edit/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          attendees: attendees.map((a) => ({
            ticketId: a.ticketId || null,
            firstName: a.firstName.trim(),
            lastName: a.lastName.trim(),
            email: a.email.trim().toLowerCase(),
            phone: (a.phone || '').trim(),
            giverArmy: !!a.giverArmy,
            giverArmyTenure: a.giverArmy ? a.giverArmyTenure || null : null,
            mediaConsent: true,
          })),
        }),
      });
      const body = await res.json();
      if (!res.ok) { setServerError(body.error || 'Failed to save.'); return; }
      setSaved(true);
      // Refresh from server so ticket ids of newly added attendees are consistent
      const refresh = await fetch(`/api/edit/${token}`).then((r) => r.json());
      setData(refresh);
      setAttendees(refresh.attendees.map(toFormShape));
    } catch {
      setServerError('Connection error. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Center>Loading…</Center>;
  if (loadError) return <Center><p className="text-gray-600 mb-4">{loadError}</p><Link to="/" className="btn-primary">Go Home</Link></Center>;

  const event = data.event;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-100">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="text-lg font-bold text-gala-dark">{event.name}</Link>
          <Link to="/faq" className="text-sm text-gray-500">FAQ</Link>
        </div>
      </header>

      <main className="flex-1 max-w-2xl mx-auto px-6 py-10 w-full">
        <div className="text-center mb-8">
          <h1 className="text-2xl md:text-3xl font-extrabold text-gala-dark mb-1">Edit Your Registration</h1>
          <p className="text-gray-500">{event.long_date} · {event.time_range}</p>
        </div>

        {!data.canEdit && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 text-amber-900 text-sm mb-6">
            Editing is closed for this event. For changes, please reach out to the organizers.
          </div>
        )}

        {saved && (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-4 text-green-800 text-sm mb-5">
            Registration updated.
          </div>
        )}

        <div className="space-y-5">
          {attendees.map((a, i) => (
            <AttendeeForm
              key={i} index={i}
              attendee={a}
              onChange={update}
              onRemove={remove}
              errors={errors[i]}
              isPrimary={i === 0}
              event={event}
            />
          ))}
        </div>

        {attendees.length < 2 && data.canEdit && (
          <button
            type="button"
            onClick={add}
            className="mt-5 w-full py-4 rounded-2xl border-2 border-dashed border-gray-200 text-gray-500 hover:border-gala-mint hover:text-gala-deep hover:bg-gala-mint/10 transition font-medium"
          >
            + Add a Guest
          </button>
        )}

        {serverError && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm mt-5">
            {serverError}
          </div>
        )}

        <div className="mt-8 flex gap-3">
          <Link to="/" className="btn-secondary flex-1 rounded-2xl text-center">Cancel</Link>
          <button
            type="button"
            onClick={submit}
            disabled={saving || !data.canEdit}
            className="btn-primary flex-1 rounded-2xl"
          >
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}

function Center({ children }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-6">
      <div className="text-center">{children}</div>
    </div>
  );
}
