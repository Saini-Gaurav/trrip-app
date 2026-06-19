import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { itinerariesApi } from '../services/api';
import { Itinerary } from '../types';
import {
  Sparkles, MapPin, Calendar, ArrowRight, Clock,
  Globe, Plus, TrendingUp,
} from 'lucide-react';
import toast from 'react-hot-toast';
import ItineraryCard from '../components/ItineraryCard';

export default function DashboardPage() {
  const { user } = useAuth();
  const [itineraries, setItineraries] = useState<Itinerary[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const fetchItineraries = async () => {
      try {
        const res = await itinerariesApi.getAll(1, 6);
        setItineraries(res.data.data.itineraries);
        setTotal(res.data.data.pagination.total);
      } catch {
        toast.error('Failed to load itineraries');
      } finally {
        setLoading(false);
      }
    };
    fetchItineraries();
  }, []);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Hero greeting */}
      <div className="bg-hero-gradient rounded-3xl p-8 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-gold-500/5 rounded-full blur-2xl" />
          <div className="absolute bottom-0 left-1/3 w-px h-full bg-gradient-to-t from-gold-500/10 to-transparent" />
        </div>
        <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <p className="text-white/50 font-body text-sm mb-1">{greeting()},</p>
            <h1 className="font-display text-3xl md:text-4xl font-bold text-white mb-3">
              {user?.name?.split(' ')[0]} ✈️
            </h1>
            <p className="text-white/60 max-w-md">
              {total > 0
                ? `You have ${total} trip${total > 1 ? 's' : ''} planned. Ready for the next adventure?`
                : 'Ready to plan your first AI-powered trip?'}
            </p>
          </div>
          <Link to="/upload" className="btn-primary whitespace-nowrap">
            <Plus className="w-5 h-5" />
            New Itinerary
          </Link>
        </div>

        {/* Quick stats */}
        <div className="relative grid grid-cols-3 gap-4 mt-8 pt-6 border-t border-white/10">
          {[
            { icon: Globe, label: 'Trips planned', value: total },
            { icon: MapPin, label: 'Destinations', value: itineraries.flatMap(i => i.destinations).filter((v, i, a) => a.indexOf(v) === i).length },
            { icon: Calendar, label: 'Days mapped', value: itineraries.reduce((acc, i) => acc + (i.totalDays || 0), 0) },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="text-center">
              <Icon className="w-5 h-5 text-gold-400 mx-auto mb-1" />
              <div className="font-display text-2xl font-bold text-white">{value}</div>
              <div className="text-white/40 text-xs">{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent itineraries */}
      <div>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <TrendingUp className="w-5 h-5 text-gold-500" />
            <h2 className="section-title text-xl">Recent Itineraries</h2>
          </div>
          {total > 6 && (
            <Link to="/history" className="btn-ghost text-sm">
              View all <ArrowRight className="w-4 h-4" />
            </Link>
          )}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="card p-6 space-y-3">
                <div className="skeleton h-5 w-3/4" />
                <div className="skeleton h-4 w-1/2" />
                <div className="skeleton h-16 w-full" />
                <div className="skeleton h-8 w-full" />
              </div>
            ))}
          </div>
        ) : itineraries.length === 0 ? (
          <div className="card p-12 text-center">
            <div className="w-16 h-16 rounded-2xl bg-sand-100 flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-8 h-8 text-gold-400" />
            </div>
            <h3 className="font-display text-xl font-semibold text-navy-700 mb-2">No itineraries yet</h3>
            <p className="text-navy-400 mb-6 max-w-sm mx-auto">
              Upload your flight tickets and hotel bookings to generate your first AI-powered travel itinerary.
            </p>
            <Link to="/upload" className="btn-primary inline-flex">
              <Plus className="w-5 h-5" /> Create your first itinerary
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 stagger-children">
            {itineraries.map((it) => (
              <ItineraryCard
                key={it._id}
                itinerary={it}
                onDelete={(id) => setItineraries((s) => s.filter((i) => i._id !== id))}
              />
            ))}
          </div>
        )}
      </div>

      {/* Quick tip */}
      {!loading && itineraries.length > 0 && (
        <div className="bg-teal-500/5 border border-teal-500/20 rounded-2xl p-5 flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-teal-500/10 flex items-center justify-center flex-shrink-0">
            <Clock className="w-5 h-5 text-teal-500" />
          </div>
          <div>
            <p className="font-semibold text-navy-700 mb-1">Pro tip</p>
            <p className="text-navy-500 text-sm">
              Upload multiple booking documents at once — Trrip will combine your flights, hotels, and transfers into one seamless itinerary.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
