import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { itinerariesApi } from '../services/api';
import { Itinerary } from '../types';
import { Clock, Plus, ChevronLeft, ChevronRight, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import ItineraryCard from '../components/ItineraryCard';

export default function HistoryPage() {
  const [itineraries, setItineraries] = useState<Itinerary[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const LIMIT = 9;

  const fetchItineraries = async (p: number) => {
    setLoading(true);
    try {
      const res = await itinerariesApi.getAll(p, LIMIT);
      const { itineraries: data, pagination } = res.data.data;
      setItineraries(data);
      setTotalPages(pagination.totalPages);
      setTotal(pagination.total);
    } catch {
      toast.error('Failed to load history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchItineraries(page); }, [page]);

  const handleDelete = (id: string) => {
    setItineraries((s) => s.filter((i) => i._id !== id));
    setTotal((t) => t - 1);
  };

  const handleShareToggle = (id: string, isShared: boolean) => {
    setItineraries((s) => s.map((i) => i._id === id ? { ...i, isShared } : i));
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-navy-800 mb-1 flex items-center gap-3">
            <Clock className="w-7 h-7 text-gold-500" /> Trip History
          </h1>
          <p className="text-navy-400">{total} itinerary{total !== 1 ? 'ies' : 'y'} generated</p>
        </div>
        <Link to="/upload" className="btn-primary text-sm">
          <Plus className="w-4 h-4" /> New Itinerary
        </Link>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="card p-6 space-y-3">
              <div className="skeleton h-5 w-3/4" />
              <div className="skeleton h-4 w-1/2" />
              <div className="skeleton h-16 w-full" />
              <div className="skeleton h-8 w-full" />
            </div>
          ))}
        </div>
      ) : itineraries.length === 0 ? (
        <div className="card p-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-sand-100 flex items-center justify-center mx-auto mb-4">
            <Search className="w-8 h-8 text-navy-300" />
          </div>
          <h3 className="font-display text-xl font-semibold text-navy-700 mb-2">No itineraries yet</h3>
          <p className="text-navy-400 mb-6">Start by uploading your travel documents to generate your first itinerary.</p>
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
              onDelete={handleDelete}
              onShareToggle={handleShareToggle}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 pt-4">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="p-2.5 rounded-xl border border-sand-200 text-navy-500 hover:bg-sand-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex gap-1.5">
            {[...Array(totalPages)].map((_, i) => (
              <button
                key={i}
                onClick={() => setPage(i + 1)}
                className={`w-9 h-9 rounded-xl text-sm font-semibold transition-all ${
                  page === i + 1
                    ? 'bg-navy-700 text-white shadow-premium'
                    : 'text-navy-500 hover:bg-sand-100 border border-sand-200'
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="p-2.5 rounded-xl border border-sand-200 text-navy-500 hover:bg-sand-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
}
