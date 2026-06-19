import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  MapPin, Calendar, Clock, Plane, Hotel, ChevronDown, ChevronUp,
  Star, Utensils, Car, Lightbulb, AlertCircle, ArrowRight,
} from 'lucide-react';
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
  flight: 'bg-blue-100 text-blue-700',
  hotel: 'bg-purple-100 text-purple-700',
  meal: 'bg-rose-100 text-rose-700',
  transport: 'bg-orange-100 text-orange-700',
  activity: 'bg-teal-100 text-teal-700',
  other: 'bg-gray-100 text-gray-600',
};

function ActivityItem({ activity }: { activity: ItineraryActivity }) {
  return (
    <div className="flex gap-4 py-4 border-b border-sand-100 last:border-0">
      <div className="flex flex-col items-center gap-1 flex-shrink-0 w-14">
        {activity.time && <span className="text-xs font-mono text-navy-400 font-semibold">{activity.time}</span>}
        <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${typeColor[activity.type] || typeColor.other}`}>
          {typeIcon[activity.type] || typeIcon.other}
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h4 className="font-semibold text-navy-700 text-sm">{activity.title}</h4>
          <div className="flex gap-1.5 flex-shrink-0">
            {activity.cost && <span className="text-xs bg-sand-100 text-navy-500 px-2 py-0.5 rounded-full">{activity.cost}</span>}
            {activity.duration && <span className="text-xs bg-sand-100 text-navy-400 px-2 py-0.5 rounded-full">{activity.duration}</span>}
          </div>
        </div>
        <p className="text-sm text-navy-400 leading-relaxed">{activity.description}</p>
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
          <div className="flex items-center gap-3 mt-1 flex-wrap">
            <span className="flex items-center gap-1 text-xs text-navy-400"><MapPin className="w-3 h-3" /> {day.location}</span>
            {day.date && <span className="text-xs text-navy-400">{day.date}</span>}
          </div>
        </div>
        {open ? <ChevronUp className="w-5 h-5 text-navy-300" /> : <ChevronDown className="w-5 h-5 text-navy-300" />}
      </button>
      {open && (
        <div className="border-t border-sand-100 px-5">
          {day.accommodation && (
            <div className="flex items-center gap-2 py-3 border-b border-sand-100">
              <Hotel className="w-4 h-4 text-purple-500" />
              <span className="text-sm text-navy-500"><strong>Stay:</strong> {day.accommodation}</span>
            </div>
          )}
          {day.activities?.map((act, i) => <ActivityItem key={i} activity={act} />)}
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

export default function SharedItineraryPage() {
  const { token } = useParams<{ token: string }>();
  const [itinerary, setItinerary] = useState<Itinerary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await itinerariesApi.getShared(token!);
        setItinerary(res.data.data.itinerary);
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-sand-50 flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-4 border-gold-400 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (error || !itinerary) {
    return (
      <div className="min-h-screen bg-sand-50 flex items-center justify-center px-4">
        <div className="card p-10 text-center max-w-md w-full">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="font-display text-xl font-bold text-navy-800 mb-2">Itinerary not found</h2>
          <p className="text-navy-400 mb-6">This shared itinerary may have been removed or sharing was disabled.</p>
          <Link to="/" className="btn-primary inline-flex">Back to Trrip</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-sand-50">
      {/* Navbar */}
      <nav className="bg-navy-900 px-4 h-14 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-gold-gradient flex items-center justify-center">
            <MapPin className="w-4 h-4 text-navy-900" strokeWidth={2.5} />
          </div>
          <span className="font-display text-lg font-bold text-white">Trrip</span>
        </Link>
        <Link to="/register" className="btn-primary text-sm py-2 px-4">
          Plan your trip <ArrowRight className="w-4 h-4" />
        </Link>
      </nav>

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {/* Shared badge */}
        <div className="flex items-center gap-2 text-sm text-navy-400">
          <MapPin className="w-4 h-4 text-gold-500" />
          <span>Shared travel itinerary</span>
        </div>

        {/* Hero */}
        <div className="bg-hero-gradient rounded-3xl p-6 md:p-8 relative overflow-hidden">
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-gold-500/5 rounded-full blur-3xl pointer-events-none" />
          <div className="relative">
            <h1 className="font-display text-2xl md:text-3xl font-bold text-white mb-3">{itinerary.title}</h1>
            <p className="text-white/60 leading-relaxed mb-5">{itinerary.summary}</p>
            <div className="flex flex-wrap gap-3">
              <div className="flex items-center gap-2 bg-white/5 rounded-xl px-4 py-2">
                <Clock className="w-4 h-4 text-gold-400" />
                <span className="text-white text-sm">{itinerary.totalDays} days</span>
              </div>
              {itinerary.destinations?.length > 0 && (
                <div className="flex items-center gap-2 bg-white/5 rounded-xl px-4 py-2">
                  <MapPin className="w-4 h-4 text-gold-400" />
                  <span className="text-white text-sm">{itinerary.destinations.join(' · ')}</span>
                </div>
              )}
              {itinerary.startDate && (
                <div className="flex items-center gap-2 bg-white/5 rounded-xl px-4 py-2">
                  <Calendar className="w-4 h-4 text-gold-400" />
                  <span className="text-white text-sm">{itinerary.startDate}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Days */}
        <div>
          <h2 className="font-display text-xl font-bold text-navy-800 mb-4">Day-by-Day Plan</h2>
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
                  <span className="w-5 h-5 rounded-full bg-gold-100 text-gold-700 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">{i + 1}</span>
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* CTA */}
        <div className="bg-hero-gradient rounded-2xl p-6 text-center">
          <p className="text-white/70 mb-3">Create your own AI-powered travel itinerary</p>
          <Link to="/register" className="btn-primary inline-flex">
            Get started free <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
