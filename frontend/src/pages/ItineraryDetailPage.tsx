import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  MapPin, Calendar, Clock, Share2, Trash2, ChevronDown, ChevronUp,
  Plane, Hotel, Utensils, Car, Star, Globe, Lock, Copy, CheckCheck,
  ArrowLeft, Loader2, Lightbulb, AlertCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { itinerariesApi } from '../services/api';
import { Itinerary, ItineraryActivity } from '../types';

const typeIcon: Record<string, React.ReactNode> = {
  flight: <Plane className="w-4 h-4" />,
  hotel: <Hotel className="w-4 h-4" />,
  meal: <Utensils className="w-4 h-4" />,
  transport: <Car className="w-4 h-4" />,
  activity: <Star className="w-4 h-4" />,
  other: <MapPin className="w-4 h-4" />,
};

const typeColor: Record<string, string> = {
  flight: 'bg-blue-100 text-blue-700 border-blue-200',
  hotel: 'bg-purple-100 text-purple-700 border-purple-200',
  meal: 'bg-rose-100 text-rose-700 border-rose-200',
  transport: 'bg-orange-100 text-orange-700 border-orange-200',
  activity: 'bg-teal-100 text-teal-700 border-teal-200',
  other: 'bg-gray-100 text-gray-600 border-gray-200',
};

function ActivityItem({ activity }: { activity: ItineraryActivity }) {
  return (
    <div className="flex gap-4 py-4 border-b border-sand-100 last:border-0">
      <div className="flex flex-col items-center gap-1 flex-shrink-0 w-14">
        {activity.time && (
          <span className="text-xs font-mono text-navy-400 font-semibold">{activity.time}</span>
        )}
        <div className={`w-8 h-8 rounded-xl border flex items-center justify-center ${typeColor[activity.type] || typeColor.other}`}>
          {typeIcon[activity.type] || typeIcon.other}
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h4 className="font-semibold text-navy-700 text-sm">{activity.title}</h4>
          <div className="flex gap-1.5 flex-shrink-0">
            {activity.cost && (
              <span className="text-xs bg-sand-100 text-navy-500 px-2 py-0.5 rounded-full font-medium">{activity.cost}</span>
            )}
            {activity.duration && (
              <span className="text-xs bg-sand-100 text-navy-500 px-2 py-0.5 rounded-full">{activity.duration}</span>
            )}
          </div>
        </div>
        <p className="text-sm text-navy-400 leading-relaxed">{activity.description}</p>
        {activity.bookingRef && (
          <p className="text-xs text-gold-600 font-mono mt-1">Ref: {activity.bookingRef}</p>
        )}
      </div>
    </div>
  );
}

function DayCard({ day, defaultOpen }: { day: Itinerary['days'][0]; defaultOpen: boolean }) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="card overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-4 p-5 text-left hover:bg-sand-50 transition-colors"
      >
        <div className="w-12 h-12 rounded-2xl bg-hero-gradient flex flex-col items-center justify-center flex-shrink-0">
          <span className="text-gold-400 text-xs font-bold uppercase leading-none">Day</span>
          <span className="text-white font-display text-xl font-bold leading-none">{day.day}</span>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-display text-base font-semibold text-navy-800">{day.title}</h3>
          <div className="flex items-center gap-3 mt-1">
            <span className="flex items-center gap-1 text-xs text-navy-400">
              <MapPin className="w-3 h-3" /> {day.location}
            </span>
            {day.date && (
              <span className="flex items-center gap-1 text-xs text-navy-400">
                <Calendar className="w-3 h-3" /> {day.date}
              </span>
            )}
            <span className="text-xs text-navy-300">{day.activities?.length || 0} activities</span>
          </div>
        </div>
        <div className="text-navy-300 flex-shrink-0">
          {open ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </div>
      </button>

      {open && (
        <div className="border-t border-sand-100 px-5">
          {day.accommodation && (
            <div className="flex items-center gap-2 py-3 border-b border-sand-100">
              <Hotel className="w-4 h-4 text-purple-500 flex-shrink-0" />
              <span className="text-sm text-navy-500"><strong>Stay:</strong> {day.accommodation}</span>
            </div>
          )}
          {day.activities?.map((act, i) => (
            <ActivityItem key={i} activity={act} />
          ))}
          {day.notes && (
            <div className="flex items-start gap-2 py-3 bg-sand-50 -mx-5 px-5 mt-2">
              <Lightbulb className="w-4 h-4 text-gold-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-navy-500 italic">{day.notes}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function ItineraryDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [itinerary, setItinerary] = useState<Itinerary | null>(null);
  const [loading, setLoading] = useState(true);
  const [sharing, setSharing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await itinerariesApi.getById(id!);
        setItinerary(res.data.data.itinerary);
      } catch {
        toast.error('Itinerary not found');
        navigate('/dashboard');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [id, navigate]);

  const handleToggleShare = async () => {
    if (!itinerary) return;
    setSharing(true);
    try {
      const newState = !itinerary.isShared;
      const res = await itinerariesApi.toggleShare(itinerary._id, newState);
      setItinerary(res.data.data.itinerary);
      if (newState) {
        toast.success('Sharing enabled');
      } else {
        toast.success('Sharing disabled');
      }
    } catch {
      toast.error('Failed to update sharing');
    } finally {
      setSharing(false);
    }
  };

  const copyShareLink = async () => {
    if (!itinerary) return;
    const url = `${window.location.origin}/share/${itinerary.shareToken}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success('Share link copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDelete = async () => {
    if (!itinerary || !confirm('Delete this itinerary? This cannot be undone.')) return;
    setDeleting(true);
    try {
      await itinerariesApi.delete(itinerary._id);
      toast.success('Itinerary deleted');
      navigate('/dashboard');
    } catch {
      toast.error('Failed to delete');
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto space-y-4">
        <div className="skeleton h-10 w-1/2" />
        <div className="skeleton h-40 w-full rounded-2xl" />
        {[1, 2, 3].map((i) => <div key={i} className="skeleton h-24 w-full rounded-2xl" />)}
      </div>
    );
  }

  if (!itinerary) return null;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Back */}
      <button onClick={() => navigate(-1)} className="btn-ghost text-sm -ml-2">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      {/* Hero card */}
      <div className="bg-hero-gradient rounded-3xl p-6 md:p-8 relative overflow-hidden">
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-gold-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative">
          {/* Badges */}
          <div className="flex flex-wrap gap-2 mb-4">
            {itinerary.isShared && (
              <span className="tag bg-teal-500/20 text-teal-300 border border-teal-500/30">
                <Globe className="w-3 h-3" /> Shared publicly
              </span>
            )}
            {itinerary.startDate && (
              <span className="tag bg-white/10 text-white/70">
                <Calendar className="w-3 h-3" /> {itinerary.startDate}
                {itinerary.endDate && ` → ${itinerary.endDate}`}
              </span>
            )}
          </div>

          <h1 className="font-display text-2xl md:text-3xl font-bold text-white mb-3 leading-tight">
            {itinerary.title}
          </h1>
          <p className="text-white/60 text-base leading-relaxed mb-6">{itinerary.summary}</p>

          {/* Stats row */}
          <div className="flex flex-wrap gap-4 mb-6">
            <div className="flex items-center gap-2 bg-white/5 rounded-xl px-4 py-2">
              <Clock className="w-4 h-4 text-gold-400" />
              <span className="text-white text-sm font-medium">{itinerary.totalDays} days</span>
            </div>
            {itinerary.destinations?.length > 0 && (
              <div className="flex items-center gap-2 bg-white/5 rounded-xl px-4 py-2">
                <MapPin className="w-4 h-4 text-gold-400" />
                <span className="text-white text-sm font-medium">{itinerary.destinations.join(' · ')}</span>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleToggleShare}
              disabled={sharing}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                itinerary.isShared
                  ? 'bg-teal-500/20 text-teal-300 hover:bg-teal-500/30 border border-teal-500/30'
                  : 'bg-white/10 text-white hover:bg-white/20 border border-white/10'
              }`}
            >
              {sharing ? <Loader2 className="w-4 h-4 animate-spin" /> : itinerary.isShared ? <Lock className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
              {itinerary.isShared ? 'Disable sharing' : 'Enable sharing'}
            </button>

            {itinerary.isShared && (
              <button
                onClick={copyShareLink}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-gold-500 text-navy-900 hover:bg-gold-400 transition-all"
              >
                {copied ? <CheckCheck className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copied!' : 'Copy link'}
              </button>
            )}

            <button
              onClick={handleDelete}
              disabled={deleting}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 transition-all ml-auto"
            >
              {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              Delete
            </button>
          </div>
        </div>
      </div>

      {/* Flight summary */}
      {itinerary.extractedData?.flights?.length > 0 && (
        <div className="card p-5">
          <h2 className="font-display text-lg font-semibold text-navy-800 mb-4 flex items-center gap-2">
            <Plane className="w-5 h-5 text-blue-500" /> Flights
          </h2>
          <div className="space-y-3">
            {itinerary.extractedData.flights.map((f, i) => (
              <div key={i} className="flex items-center gap-4 bg-sand-50 rounded-xl p-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 font-semibold text-navy-700 text-sm mb-1">
                    <span>{f.departure?.city || f.departure?.airport || '—'}</span>
                    <Plane className="w-3.5 h-3.5 text-navy-300" />
                    <span>{f.arrival?.city || f.arrival?.airport || '—'}</span>
                  </div>
                  <div className="text-xs text-navy-400 flex gap-3 flex-wrap">
                    {f.airline && <span>{f.airline}</span>}
                    {f.flightNumber && <span className="font-mono">{f.flightNumber}</span>}
                    {f.departure?.date && <span>{f.departure.date}</span>}
                    {f.departure?.time && <span>{f.departure.time} → {f.arrival?.time}</span>}
                  </div>
                </div>
                {f.bookingRef && (
                  <span className="text-xs font-mono bg-blue-50 text-blue-700 px-2 py-1 rounded-lg">{f.bookingRef}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Hotels summary */}
      {itinerary.extractedData?.hotels?.length > 0 && (
        <div className="card p-5">
          <h2 className="font-display text-lg font-semibold text-navy-800 mb-4 flex items-center gap-2">
            <Hotel className="w-5 h-5 text-purple-500" /> Hotels
          </h2>
          <div className="space-y-3">
            {itinerary.extractedData.hotels.map((h, i) => (
              <div key={i} className="bg-sand-50 rounded-xl p-4">
                <div className="font-semibold text-navy-700 text-sm mb-1">{h.name || 'Hotel'}</div>
                <div className="text-xs text-navy-400 flex gap-3 flex-wrap">
                  {h.checkIn && <span>Check-in: {h.checkIn}</span>}
                  {h.checkOut && <span>Check-out: {h.checkOut}</span>}
                  {h.nights && <span>{h.nights} nights</span>}
                  {h.roomType && <span>{h.roomType}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Day-by-day */}
      <div>
        <h2 className="font-display text-xl font-bold text-navy-800 mb-4">Day-by-Day Itinerary</h2>
        <div className="space-y-4">
          {itinerary.days?.map((day, i) => (
            <DayCard key={day.day} day={day} defaultOpen={i === 0} />
          ))}
        </div>
      </div>

      {/* Tips */}
      {itinerary.tips?.length > 0 && (
        <div className="card p-6">
          <h2 className="font-display text-lg font-semibold text-navy-800 mb-4 flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-gold-500" /> Travel Tips
          </h2>
          <ul className="space-y-3">
            {itinerary.tips.map((tip, i) => (
              <li key={i} className="flex items-start gap-3 text-sm text-navy-500">
                <span className="w-5 h-5 rounded-full bg-gold-100 text-gold-700 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                  {i + 1}
                </span>
                {tip}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
