import { Link } from 'react-router-dom';
import { MapPin, Sparkles, Upload, Calendar, Share2, ArrowRight, Star, Zap } from 'lucide-react';

const features = [
  {
    icon: Upload,
    title: 'Upload Your Bookings',
    desc: 'Drop PDFs or images of your flight tickets, hotel reservations, and travel documents.',
    color: 'text-teal-500',
    bg: 'bg-teal-50',
  },
  {
    icon: Sparkles,
    title: 'AI Reads & Understands',
    desc: 'Gemini AI extracts all travel details — flights, hotels, destinations, dates — automatically.',
    color: 'text-gold-500',
    bg: 'bg-amber-50',
  },
  {
    icon: Calendar,
    title: 'Get Your Itinerary',
    desc: 'A beautiful day-by-day travel plan is created instantly, packed with activities and tips.',
    color: 'text-purple-500',
    bg: 'bg-purple-50',
  },
  {
    icon: Share2,
    title: 'Share & Explore',
    desc: 'Share your itinerary with travel companions via a unique link. Revisit any time.',
    color: 'text-rose-500',
    bg: 'bg-rose-50',
  },
];

const stats = [
  { value: '30 sec', label: 'Avg. generation time' },
  { value: 'Gemini AI', label: 'Powered by' },
  { value: '10+ formats', label: 'Document support' },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-navy-900/95 backdrop-blur-md border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gold-gradient flex items-center justify-center shadow-gold-glow">
              <MapPin className="w-4 h-4 text-navy-900" strokeWidth={2.5} />
            </div>
            <span className="font-display text-xl font-bold text-white">Trrip</span>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login" className="text-white/70 hover:text-white text-sm font-medium transition-colors px-4 py-2">
              Sign in
            </Link>
            <Link to="/register" className="btn-primary text-sm py-2 px-5">
              Get started free
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="bg-hero-gradient pt-32 pb-20 px-4 overflow-hidden relative">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-gold-500/5 rounded-full blur-3xl" />
          <div className="absolute top-40 -left-40 w-80 h-80 bg-teal-500/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full h-px bg-gradient-to-r from-transparent via-gold-500/20 to-transparent" />
        </div>

        <div className="max-w-4xl mx-auto text-center relative">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gold-500/10 border border-gold-500/20 text-gold-400 text-sm font-medium mb-6 animate-fade-in">
            <Zap className="w-3.5 h-3.5" />
            Powered by Gemini AI
          </div>

          <h1 className="font-display text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-tight mb-6 animate-fade-up">
            Your bookings,{' '}
            <span className="gradient-text italic">transformed</span>
            <br />into perfect itineraries
          </h1>

          <p className="text-white/60 text-lg md:text-xl max-w-2xl mx-auto mb-10 font-body leading-relaxed animate-fade-up" style={{ animationDelay: '0.1s' }}>
            Upload your flight tickets and hotel bookings. Our AI reads them, understands your trip, and builds a beautiful day-by-day travel plan in seconds.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-up" style={{ animationDelay: '0.2s' }}>
            <Link to="/register" className="btn-primary text-base px-8 py-4 w-full sm:w-auto justify-center">
              <Sparkles className="w-5 h-5" />
              Create your first itinerary
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link to="/login" className="text-white/60 hover:text-white text-base font-medium transition-colors">
              Already have an account →
            </Link>
          </div>

          {/* Stats */}
          <div className="flex items-center justify-center gap-8 mt-16 pt-8 border-t border-white/10 animate-fade-up" style={{ animationDelay: '0.3s' }}>
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="font-display text-2xl font-bold text-gold-400">{stat.value}</div>
                <div className="text-white/40 text-xs mt-1 font-body">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4 bg-sand-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-gold-500 font-semibold text-sm uppercase tracking-widest mb-3">How it works</p>
            <h2 className="section-title">From documents to adventure, instantly</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {features.map((f, i) => (
              <div key={f.title} className="card-hover p-6 group" style={{ animationDelay: `${i * 0.1}s` }}>
                <div className={`w-12 h-12 rounded-2xl ${f.bg} flex items-center justify-center mb-4`}>
                  <f.icon className={`w-6 h-6 ${f.color}`} />
                </div>
                <h3 className="font-display text-xl font-semibold text-navy-800 mb-2">{f.title}</h3>
                <p className="text-navy-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-hero-gradient py-20 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <div className="flex items-center justify-center gap-1 mb-4">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-5 h-5 text-gold-400 fill-gold-400" />
            ))}
          </div>
          <h2 className="font-display text-4xl font-bold text-white mb-4">
            Ready to plan smarter?
          </h2>
          <p className="text-white/60 mb-8 text-lg">
            Join travelers who use Trrip to turn their booking confirmations into beautiful, shareable itineraries.
          </p>
          <Link to="/register" className="btn-primary text-base px-8 py-4 inline-flex">
            <Sparkles className="w-5 h-5" />
            Start for free — no credit card needed
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-navy-900 py-8 px-4 text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="w-6 h-6 rounded-lg bg-gold-gradient flex items-center justify-center">
            <MapPin className="w-3 h-3 text-navy-900" strokeWidth={2.5} />
          </div>
          <span className="font-display text-white font-bold">Trrip</span>
        </div>
        <p className="text-white/30 text-sm">AI-powered travel planning. Built for Trrip assignment.</p>
      </footer>
    </div>
  );
}
