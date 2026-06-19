import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Itinerary } from '../types';
import {
  MapPin, Calendar, Clock, Share2, Trash2, Eye,
  Globe, Lock, MoreVertical,
} from 'lucide-react';
import { itinerariesApi } from '../services/api';
import toast from 'react-hot-toast';

interface Props {
  itinerary: Itinerary;
  onDelete?: (id: string) => void;
  onShareToggle?: (id: string, isShared: boolean) => void;
}

export default function ItineraryCard({ itinerary, onDelete, onShareToggle }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault();
    setSharing(true);
    try {
      const newState = !itinerary.isShared;
      await itinerariesApi.toggleShare(itinerary._id, newState);
      onShareToggle?.(itinerary._id, newState);
      if (newState) {
        const shareUrl = `${window.location.origin}/share/${itinerary.shareToken}`;
        await navigator.clipboard.writeText(shareUrl);
        toast.success('Link copied to clipboard!');
      } else {
        toast.success('Sharing disabled');
      }
    } catch {
      toast.error('Failed to update sharing');
    } finally {
      setSharing(false);
      setMenuOpen(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!confirm('Delete this itinerary? This cannot be undone.')) return;
    setDeleting(true);
    try {
      await itinerariesApi.delete(itinerary._id);
      onDelete?.(itinerary._id);
      toast.success('Itinerary deleted');
    } catch {
      toast.error('Failed to delete');
    } finally {
      setDeleting(false);
      setMenuOpen(false);
    }
  };

  const formattedDate = new Date(itinerary.createdAt).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  });

  return (
    <div className="card-hover group relative flex flex-col">
      {/* Color band top */}
      <div className="h-1.5 bg-gold-gradient rounded-t-2xl" />

      <div className="p-5 flex-1 flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <h3 className="font-display text-base font-semibold text-navy-800 leading-tight line-clamp-2 flex-1">
            {itinerary.title}
          </h3>
          <div className="relative flex-shrink-0">
            <button
              onClick={(e) => { e.preventDefault(); setMenuOpen(!menuOpen); }}
              className="p-1.5 rounded-lg text-gray-400 hover:bg-sand-100 hover:text-navy-600 transition-colors"
            >
              <MoreVertical className="w-4 h-4" />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-8 z-20 bg-white rounded-xl shadow-premium-lg border border-sand-200 py-1 min-w-[160px]">
                <button
                  onClick={handleShare}
                  disabled={sharing}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-navy-600 hover:bg-sand-50 transition-colors"
                >
                  {itinerary.isShared ? <Lock className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
                  {itinerary.isShared ? 'Disable sharing' : 'Copy share link'}
                </button>
                <Link
                  to={`/itinerary/${itinerary._id}`}
                  className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-navy-600 hover:bg-sand-50 transition-colors"
                >
                  <Eye className="w-4 h-4" /> View full
                </Link>
                <hr className="my-1 border-sand-200" />
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  {deleting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Destinations */}
        {itinerary.destinations?.length > 0 && (
          <div className="flex items-center gap-1.5 mb-3 flex-wrap">
            <MapPin className="w-3.5 h-3.5 text-gold-500 flex-shrink-0" />
            <span className="text-xs text-navy-500 font-medium">
              {itinerary.destinations.slice(0, 3).join(' → ')}
              {itinerary.destinations.length > 3 && ` +${itinerary.destinations.length - 3}`}
            </span>
          </div>
        )}

        {/* Summary */}
        <p className="text-sm text-navy-400 leading-relaxed line-clamp-2 flex-1 mb-4">
          {itinerary.summary}
        </p>

        {/* Meta */}
        <div className="flex items-center justify-between text-xs text-navy-400 border-t border-sand-100 pt-3">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" /> {itinerary.totalDays}d
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" /> {formattedDate}
            </span>
          </div>
          {itinerary.isShared && (
            <span className="flex items-center gap-1 text-teal-600 font-medium">
              <Globe className="w-3.5 h-3.5" /> Shared
            </span>
          )}
        </div>
      </div>

      {/* View button */}
      <Link
        to={`/itinerary/${itinerary._id}`}
        className="mx-5 mb-5 btn-secondary text-sm py-2.5 justify-center"
      >
        <Eye className="w-4 h-4" /> View Itinerary
      </Link>

      {/* Overlay to close menu */}
      {menuOpen && (
        <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
      )}
    </div>
  );
}
