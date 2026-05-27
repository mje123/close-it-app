import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Facebook, Instagram, Twitter, Globe, ChevronLeft, ChevronRight, Check } from 'lucide-react';

const SCREENSHOTS = [
  { src: '/assets/screenshots/mobile-home-1.png', alt: 'Close It! buyer calculator' },
  { src: '/assets/screenshots/mobile-buy.png', alt: 'Buy it calculator' },
  { src: '/assets/screenshots/mobile-sell-1.png', alt: 'Sell it calculator' },
  { src: '/assets/screenshots/mobile-sell-2.png', alt: 'Sell it summary' },
  { src: '/assets/screenshots/mobile-costs.png', alt: 'Closing costs breakdown' },
  { src: '/assets/screenshots/mobile-disclosure.png', alt: 'Closing disclosure' },
  { src: '/assets/screenshots/mobile-menu.png', alt: 'Menu' },
];

const TESTIMONIALS = [
  { text: "Really nice and detailed app. I can't believe someone hadn't thought of this before! Works very well.", author: "Verified User" },
  { text: "Very helpful in calculating my mortgage payment to give me a better idea of what my family can afford.", author: "Homebuyer" },
  { text: "It takes all the financial clutter of the real estate transaction and puts it in a comprehensible, detailed package.", author: "Real Estate Agent" },
];

const FEATURES = [
  { icon: '⚡', title: 'Super Fast', desc: 'Receive an accurate closing cost estimate in seconds.' },
  { icon: '📄', title: 'Downloadable Reports', desc: 'Share your reports with clients, family & friends.' },
  {
    icon: '⚖️',
    title: 'Attorneys at the Ready',
    desc: 'Questions about your Close It! experience? We can help! Speak with a Federal Title staff attorney at (202) 918-9358 or email attorneys@federaltitle.com.',
    link: 'tel:+12029189358'
  },
  { icon: '🏆', title: 'Trusted by the Pros', desc: 'Our app has been verified for use by Bright MLS.' },
];

const FEATURES_LIST = [
  'Instant & Accurate Reports',
  'Fully customizable inputs',
  'Shareable Reports',
  'Regular Fee Updates',
  'Personalized Branding',
];

const AUDIENCE = [
  { title: 'Buyers', icon: '🏠', text: "Want to know how much cash you need at closing? Close It! knows.", cta: 'buy' },
  { title: 'Sellers', icon: '🔑', text: "Want to know how much cash you will walk away with? Close It! knows.", cta: 'sell' },
  { title: 'Agents', icon: '👔', text: "Impress your buyers & sellers with customized Closing Reports.", cta: 'buy' },
];

export function LandingPage() {
  const [carouselIdx, setCarouselIdx] = useState(0);
  const [_mobileMenuOpen, _setMobileMenuOpen] = useState(false);

  const prevSlide = () => setCarouselIdx(i => (i - 1 + SCREENSHOTS.length) % SCREENSHOTS.length);
  const nextSlide = () => setCarouselIdx(i => (i + 1) % SCREENSHOTS.length);

  return (
    <div className="min-h-screen bg-white font-sans">
      {/* ===== Header ===== */}
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/">
              <img src="/assets/logos/close-it-logo-main.png" alt="Close It!" className="h-10 object-contain" />
            </Link>
            <img src="/assets/logos/federal-title-logo.jpg" alt="Federal Title & Escrow Company" className="h-8 object-contain hidden sm:block" />
          </div>

          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-600">
            <a href="#features" className="hover:text-[#3EABA2]">Features</a>
            <a href="mailto:attorneys@federaltitle.com" className="hover:text-[#3EABA2]">Contact Us</a>
            <a href="https://closeitapp.com/blog" target="_blank" rel="noopener noreferrer" className="hover:text-[#3EABA2]">Blog</a>
            <Link to="/calculator" className="bg-[#3EABA2] text-white px-4 py-2 rounded font-semibold hover:bg-[#349990] transition-colors">
              Try It Now!
            </Link>
          </nav>

          <div className="flex items-center gap-3 text-gray-400">
            <a href="https://www.facebook.com/dcTitleCompany/" target="_blank" rel="noopener noreferrer" aria-label="Facebook"><Facebook size={18} className="hover:text-[#3EABA2]" /></a>
            <a href="https://www.instagram.com/federaltitle" target="_blank" rel="noopener noreferrer" aria-label="Instagram"><Instagram size={18} className="hover:text-[#3EABA2]" /></a>
            <a href="https://x.com/dcTitleCompany" target="_blank" rel="noopener noreferrer" aria-label="X/Twitter"><Twitter size={18} className="hover:text-[#3EABA2]" /></a>
            <a href="https://www.federaltitle.com" target="_blank" rel="noopener noreferrer" aria-label="Website"><Globe size={18} className="hover:text-[#3EABA2]" /></a>
          </div>
        </div>
      </header>

      {/* ===== Hero ===== */}
      <section className="bg-[#2C2C2C] text-white py-16 px-6">
        <div className="max-w-6xl mx-auto flex flex-col lg:flex-row items-center gap-10">
          <div className="flex-1">
            <h1 className="text-4xl lg:text-5xl font-black leading-tight mb-4">
              THIS APP'S GOT<br />
              <span className="text-[#3EABA2]">YOUR NUMBER</span>
            </h1>
            <p className="text-gray-300 text-lg mb-8 max-w-lg">
              Create, edit and share Closing Reports. Know exactly how much cash will cross the closing table.
            </p>
            <Link
              to="/calculator"
              className="inline-block bg-[#3EABA2] hover:bg-[#349990] text-white font-bold px-8 py-3 rounded-lg text-lg transition-colors"
            >
              TRY IT NOW! →
            </Link>
          </div>
          <div className="relative">
            <img
              src="/assets/screenshots/tablet.jpeg"
              alt="Close It! App on tablet"
              className="w-full max-w-md rounded-lg shadow-2xl"
              onError={e => (e.target as HTMLImageElement).style.display = 'none'}
            />
          </div>
        </div>
      </section>

      {/* ===== Target Audience ===== */}
      <section className="py-14 px-6 bg-[#F5F5F0]">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
          {AUDIENCE.map((a, i) => (
            <div key={i} className="bg-white rounded-xl shadow-sm p-6 text-center hover:shadow-md transition-shadow">
              <div className="text-5xl mb-3">{a.icon}</div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">{a.title}</h3>
              <p className="text-gray-500 text-sm mb-4">{a.text}</p>
              <Link
                to={`/calculator?tab=${a.cta}`}
                className="inline-block bg-[#3EABA2] text-white px-5 py-2 rounded font-semibold text-sm hover:bg-[#349990] transition-colors"
              >
                Try It Now!
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* ===== Features Grid ===== */}
      <section id="features" className="py-14 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-black text-center text-gray-800 mb-10">Why Choose Close It!</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {FEATURES.map((f, i) => (
              <div key={i} className="flex gap-4 p-5 bg-[#F5F5F0] rounded-xl">
                <span className="text-3xl shrink-0">{f.icon}</span>
                <div>
                  <h3 className="font-bold text-gray-800 mb-1">{f.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
                  {f.link && (
                    <a href={f.link} className="text-[#3EABA2] text-xs hover:underline mt-1 block">(202) 918-9358</a>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-10 bg-[#3EABA2] bg-opacity-10 rounded-xl p-6">
            <h3 className="font-bold text-gray-800 mb-4 text-center">Features at a Glance</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {FEATURES_LIST.map((f, i) => (
                <div key={i} className="flex items-center gap-2 text-sm text-gray-600">
                  <Check size={16} className="text-[#3EABA2] shrink-0" />
                  {f}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ===== Testimonials ===== */}
      <section className="py-14 px-6 bg-[#F5F5F0]">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-black text-center text-gray-800 mb-10">What People Are Saying</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t, i) => (
              <div key={i} className="bg-white rounded-xl shadow-sm p-6">
                <div className="text-[#3EABA2] text-4xl mb-3">"</div>
                <p className="text-gray-600 text-sm leading-relaxed mb-4">{t.text}</p>
                <p className="text-xs text-gray-400 font-medium">— {t.author}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== Educational Videos ===== */}
      <section className="py-14 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-black text-center text-gray-800 mb-4">All About Closing Costs</h2>
          <p className="text-center text-gray-500 mb-10 max-w-2xl mx-auto">
            Learn everything you need to know about closing costs with these educational videos from Federal Title & Escrow Company.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="font-bold text-gray-700 mb-3">Understanding Closing Costs</h3>
              <div className="relative pb-[56.25%] bg-gray-100 rounded-lg overflow-hidden">
                <iframe
                  className="absolute inset-0 w-full h-full"
                  src="https://www.youtube.com/embed/B3hDfTdZo3c"
                  title="Understanding Closing Costs"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            </div>
            <div>
              <h3 className="font-bold text-gray-700 mb-3">Who Chooses the Title Company?</h3>
              <div className="relative pb-[56.25%] bg-gray-100 rounded-lg overflow-hidden">
                <iframe
                  className="absolute inset-0 w-full h-full"
                  src="https://www.youtube.com/embed/fifp2mLGoWc"
                  title="Who Chooses the Title Company?"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            </div>
          </div>

          <div className="mt-8 bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800">
            <p className="font-semibold mb-1">Legal Notice (RESPA Section 9)</p>
            <p className="leading-relaxed">
              "No seller of property that will be purchased with the assistance of a federally related mortgage loan shall violate section 9 of RESPA (12 U.S.C. 2608)..."
              {' '}
              <a
                href="https://www.consumerfinance.gov/rules-policy/regulations/1024/16/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#3EABA2] hover:underline"
              >
                Read more →
              </a>
            </p>
          </div>
        </div>
      </section>

      {/* ===== Screenshots Carousel ===== */}
      <section className="py-14 px-6 bg-[#2C2C2C]">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-black text-center text-white mb-10">See It In Action</h2>
          <div className="relative">
            <div className="overflow-hidden">
              <div
                className="flex transition-transform duration-300"
                style={{ transform: `translateX(-${carouselIdx * (100 / Math.min(3, SCREENSHOTS.length))}%)` }}
              >
                {SCREENSHOTS.map((s, i) => (
                  <div key={i} className="shrink-0 w-1/3 px-2 min-w-[200px]">
                    <img
                      src={s.src}
                      alt={s.alt}
                      className="w-full rounded-xl shadow-lg"
                      onError={e => (e.target as HTMLImageElement).style.display = 'none'}
                    />
                  </div>
                ))}
              </div>
            </div>
            <button
              onClick={prevSlide}
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 bg-white rounded-full p-2 shadow-lg hover:bg-gray-100"
              aria-label="Previous"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={nextSlide}
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-3 bg-white rounded-full p-2 shadow-lg hover:bg-gray-100"
              aria-label="Next"
            >
              <ChevronRight size={20} />
            </button>
          </div>
          <div className="flex justify-center gap-2 mt-4">
            {SCREENSHOTS.map((_, i) => (
              <button
                key={i}
                onClick={() => setCarouselIdx(i)}
                className={`w-2 h-2 rounded-full transition-colors ${i === carouselIdx ? 'bg-[#3EABA2]' : 'bg-gray-500'}`}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ===== As Seen On ===== */}
      <section className="py-10 px-6 bg-[#3EABA2]">
        <div className="max-w-4xl mx-auto text-center">
          <h3 className="text-white font-bold mb-6 uppercase tracking-widest text-sm">As Seen On</h3>
          <div className="flex flex-wrap justify-center items-center gap-8">
            {[
              { src: '/assets/media/wapo.png', alt: 'Washington Post' },
              { src: '/assets/media/curbed.png', alt: 'Curbed DC' },
              { src: '/assets/media/inman.png', alt: 'Inman' },
              { src: '/assets/media/urbanturf.png', alt: 'Urban Turf DC' },
            ].map((m, i) => (
              <img
                key={i}
                src={m.src}
                alt={m.alt}
                className="h-8 object-contain filter brightness-0 invert opacity-90 hover:opacity-100 transition-opacity"
                onError={e => {
                  const el = e.target as HTMLImageElement;
                  el.style.display = 'none';
                  const span = document.createElement('span');
                  span.className = 'text-white font-bold text-sm';
                  span.textContent = m.alt;
                  el.parentNode?.insertBefore(span, el);
                }}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ===== CTA ===== */}
      <section className="py-14 px-6 bg-white text-center">
        <h2 className="text-3xl font-black text-gray-800 mb-4">Ready to Know Your Numbers?</h2>
        <p className="text-gray-500 mb-8 max-w-xl mx-auto">
          Get an instant, accurate closing cost estimate. No signup required to try it.
        </p>
        <Link
          to="/calculator"
          className="inline-block bg-[#3EABA2] hover:bg-[#349990] text-white font-bold px-10 py-4 rounded-lg text-lg transition-colors"
        >
          TRY IT NOW! — It's Free
        </Link>
      </section>

      {/* ===== Footer ===== */}
      <footer className="bg-[#2C2C2C] text-gray-400 py-10 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-wrap gap-8 justify-between mb-8">
            <div>
              <img src="/assets/logos/close-it-logo-main.png" alt="Close It!" className="h-8 object-contain mb-3 filter brightness-0 invert" />
              <p className="text-sm">©2025 Federal Title & Escrow Company</p>
              <p className="text-sm">5481 Wisconsin Avenue, Suite D</p>
              <p className="text-sm">Chevy Chase, MD, 20815</p>
              <p className="text-sm mt-2">Phone: <a href="tel:+12023621500" className="hover:text-white">202.362.1500</a></p>
              <p className="text-sm">Email: <a href="mailto:services@federaltitle.com" className="hover:text-white">services@federaltitle.com</a></p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-3">Quick Links</h4>
              <div className="space-y-2 text-sm">
                <div><Link to="/calculator" className="hover:text-white">Try Calculator</Link></div>
                <div><a href="https://www.federaltitle.com/quote" target="_blank" rel="noopener noreferrer" className="hover:text-white">Get a closing costs quote »</a></div>
                <div><a href="https://closeitapp.com/privacy-policy/" target="_blank" rel="noopener noreferrer" className="hover:text-white">Privacy Policy</a></div>
                <div><a href="https://closeitapp.com/blog" target="_blank" rel="noopener noreferrer" className="hover:text-white">Blog</a></div>
              </div>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-3">Connect</h4>
              <div className="flex gap-4">
                <a href="https://www.facebook.com/dcTitleCompany/" target="_blank" rel="noopener noreferrer" aria-label="Facebook"><Facebook size={20} className="hover:text-[#3EABA2]" /></a>
                <a href="https://www.instagram.com/federaltitle" target="_blank" rel="noopener noreferrer" aria-label="Instagram"><Instagram size={20} className="hover:text-[#3EABA2]" /></a>
                <a href="https://x.com/dcTitleCompany" target="_blank" rel="noopener noreferrer" aria-label="X"><Twitter size={20} className="hover:text-[#3EABA2]" /></a>
                <a href="https://www.federaltitle.com" target="_blank" rel="noopener noreferrer" aria-label="Website"><Globe size={20} className="hover:text-[#3EABA2]" /></a>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-700 pt-6 text-center text-xs text-gray-500">
            <p>Close It!™ is a product of Federal Title & Escrow Company. All calculations are estimates and for informational purposes only.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
