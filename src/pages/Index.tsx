import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, Star, Users, Sparkles, ArrowRight, Phone, Mail, MapPin, LogOut, Menu, X } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useServices } from '@/hooks/useServices';
import { useScrollToHash } from '@/hooks/useScrollToHash';
import { useState } from 'react';

const Index = () => {
  const { user, loading, signOut } = useAuth();
  const { services } = useServices();
  const featuredServices = (services || []).filter(s => s.is_active).slice(0, 4);
  const scrollToHash = useScrollToHash();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleScroll = (sectionId: string) => {
    scrollToHash(sectionId);
    setIsMenuOpen(false); // Close mobile menu after clicking
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass-panel">
        <div className="container mx-auto px-4 md:px-6 py-3 md:py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <img 
              src="gwyn.png" 
              alt="Gwyn Logo" 
              className="h-10 w-16 md:h-14 md:w-22 object-cover rounded-full"
            />
          </Link>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <button 
              onClick={() => handleScroll('home')}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Home
            </button>
            <button 
              onClick={() => handleScroll('services')}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Services
            </button>
            <button 
              onClick={() => handleScroll('about')}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              About
            </button>
            <button 
              onClick={() => handleScroll('contact')}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Contact
            </button>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex items-center gap-3">
            {!loading && (
              <>
                {user ? (
                  <>
                    <Link to="/dashboard" className="hidden md:block">
                      <Button variant="ghost" size="sm">Dashboard</Button>
                    </Link>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={signOut}
                      className="hidden md:flex"
                    >
                      <LogOut className="h-4 w-4 mr-1" />
                      Logout
                    </Button>
                  </>
                ) : (
                  <Link to="/auth" className="hidden md:block">
                    <Button variant="hero" size="sm">Login</Button>
                  </Link>
                )}
              </>
            )}
            
            {/* Mobile Menu Toggle */}
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-accent/10"
            >
              {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isMenuOpen && (
          <div className="md:hidden glass-panel border-t border-border">
            <div className="container mx-auto px-4 py-4">
              <div className="flex flex-col gap-4">
                <button 
                  onClick={() => handleScroll('home')}
                  className="text-left py-2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  Home
                </button>
                <button 
                  onClick={() => handleScroll('services')}
                  className="text-left py-2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  Services
                </button>
                <button 
                  onClick={() => handleScroll('about')}
                  className="text-left py-2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  About
                </button>
                <button 
                  onClick={() => handleScroll('contact')}
                  className="text-left py-2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  Contact
                </button>
                
                {/* Mobile Auth Buttons */}
                {!loading && (
                  <>
                    {user ? (
                      <>
                        <Link to="/dashboard">
                          <Button variant="ghost" size="sm" className="w-full justify-start">
                            Dashboard
                          </Button>
                        </Link>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={signOut}
                          className="w-full justify-start"
                        >
                          <LogOut className="h-4 w-4 mr-2" />
                          Logout
                        </Button>
                      </>
                    ) : (
                      <Link to="/auth">
                        <Button variant="hero" size="sm" className="w-full">
                          Login
                        </Button>
                      </Link>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section id="home" className="relative min-h-screen flex items-center hero-gradient pt-16 md:pt-20">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 -right-20 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 -left-20 w-80 h-80 bg-accent/30 rounded-full blur-3xl" />
        </div>
        
        <div className="container mx-auto px-4 md:px-6 relative z-10">
          <div className="grid lg:grid-cols-2 gap-8 md:gap-12 items-center">
            <div className="max-w-2xl animate-slide-up">
              <h1 className="text-3xl md:text-5xl lg:text-7xl font-serif font-semibold text-foreground mb-4 md:mb-6 leading-tight">
                Reveal Your
                <span className="text-primary block">Natural Beauty</span>
              </h1>
              <p className="text-base md:text-lg lg:text-xl text-muted-foreground mb-6 md:mb-8 max-w-xl">
                Experience personalized aesthetic treatments in a luxurious, state-of-the-art environment. 
                Your journey to radiant confidence starts here.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
                <Link to="/book" className="w-full sm:w-auto">
                  <Button variant="hero" size="lg" className="w-full sm:w-auto">
                    Book Appointment
                    <ArrowRight className="ml-2 h-4 w-4 md:h-5 md:w-5" />
                  </Button>
                </Link>
                <Button 
                  onClick={() => handleScroll('services')} 
                  variant="outline" 
                  size="lg"
                  className="w-full sm:w-auto"
                >
                  Explore Services
                </Button>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 md:gap-8 mt-12 md:mt-16 pt-6 md:pt-8 border-t border-border/50">
                <div>
                  <p className="text-2xl md:text-3xl font-serif font-semibold text-foreground">15+</p>
                  <p className="text-muted-foreground text-xs md:text-sm">Years Experience</p>
                </div>
                <div>
                  <p className="text-2xl md:text-3xl font-serif font-semibold text-foreground">10k+</p>
                  <p className="text-muted-foreground text-xs md:text-sm">Happy Clients</p>
                </div>
                <div>
                  <p className="text-2xl md:text-3xl font-serif font-semibold text-foreground">4.9</p>
                  <p className="text-muted-foreground text-xs md:text-sm flex items-center gap-1">
                    <Star className="h-3 w-3 fill-primary text-primary" /> Rating
                  </p>
                </div>
              </div>
            </div>

            {/* Hero Image - Hidden on small screens, shown on medium and up */}
            <div className="relative hidden md:block lg:block">
              <div className="relative rounded-2xl md:rounded-3xl overflow-hidden shadow-xl md:shadow-2xl">
                <img 
                  src="gwyncover.avif" 
                  alt="Gwyn Aesthetic Clinic Interior" 
                  className="w-full h-auto object-cover rounded-2xl md:rounded-3xl"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-2xl md:rounded-3xl"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-16 md:py-24 bg-muted/30">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-2xl md:text-4xl lg:text-5xl font-serif font-semibold text-foreground mt-2 mb-4">
              Our Services
            </h2>
            <p className="text-muted-foreground text-sm md:text-base max-w-2xl mx-auto">
              From rejuvenating facials to advanced aesthetic procedures, we offer a comprehensive 
              range of treatments tailored to your unique needs.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {featuredServices.map((service, index) => (
              <div
                key={service.id}
                className="group glass-card rounded-xl md:rounded-2xl p-4 md:p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg md:rounded-xl bg-accent flex items-center justify-center mb-3 md:mb-4 group-hover:bg-primary/10 transition-colors">
                  {/* Service icon placeholder */}
                </div>
                <h3 className="font-serif text-lg md:text-xl font-semibold text-foreground mb-2">{service.name}</h3>
                <p className="text-muted-foreground text-xs md:text-sm mb-3 md:mb-4 line-clamp-2">{service.description}</p>
                <div className="flex items-center justify-between pt-3 md:pt-4 border-t border-border/50">
                  <div className="flex items-center gap-2 text-xs md:text-sm text-muted-foreground">
                    <Clock className="h-3 w-3 md:h-4 md:w-4" />
                    {service.duration} min
                  </div>
                  <span className="font-semibold text-foreground text-sm md:text-base">
                    {service.price === 0 ? 'Free' : `₱${service.price}`}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-8 md:mt-12">
            <Link to="/book">
              <Button variant="default"   className="md:size-lg">
                View All Services
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section id="about" className="py-16 md:py-24">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid lg:grid-cols-2 gap-8 md:gap-16 items-center">
            <div>
              <span className="text-primary font-medium text-sm md:text-base">Why Gwyn</span>
              <h2 className="text-2xl md:text-4xl lg:text-5xl font-serif font-semibold text-foreground mt-2 mb-4 md:mb-6">
                Excellence in Every Detail
              </h2>
              <p className="text-muted-foreground text-sm md:text-base mb-6 md:mb-8">
                At Gwyn, we combine cutting-edge technology with personalized care to deliver 
                exceptional results. Our team of certified professionals is dedicated to helping 
                you achieve your aesthetic goals.
              </p>
              
              <div className="space-y-4 md:space-y-6">
                {[
                  { icon: Users, title: 'Expert Team', desc: 'Board-certified specialists with years of experience' },
                  { icon: Star, title: 'Premium Products', desc: 'Only FDA-approved, top-tier products and equipment' },
                  { icon: Calendar, title: 'Easy Booking', desc: 'Convenient online scheduling, 24/7 availability' },
                ].map((item, index) => (
                  <div key={index} className="flex gap-3 md:gap-4">
                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg md:rounded-xl bg-accent flex items-center justify-center shrink-0">
                      <item.icon className="h-4 w-4 md:h-5 md:w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground text-sm md:text-base mb-1">{item.title}</h3>
                      <p className="text-muted-foreground text-xs md:text-sm">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative mt-8 lg:mt-0">
              <div className="aspect-[4/5] rounded-xl md:rounded-3xl bg-gradient-to-br from-primary/20 via-accent/30 to-secondary overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center p-4 md:p-8">
                    <img 
                      src="cover2.avif" 
                      alt="Gwyn Logo" 
                      className="h-40 md:h-356 w-auto object-cover mx-auto mb-3 md:mb-4"
                    />
                    <p className="text-muted-foreground font-serif text-base md:text-xl">Where Science Meets Beauty</p>
                  </div>
                </div>
              </div>
              <div className="absolute -bottom-4 -left-4 md:-bottom-6 md:-left-6 glass-card rounded-xl md:rounded-2xl p-3 md:p-4 shadow-lg">
                <div className="flex items-center gap-2 md:gap-3">
                  <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-primary flex items-center justify-center">
                    <Star className="h-3 w-3 md:h-5 md:w-5 text-primary-foreground fill-primary-foreground" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground text-sm md:text-base">Trusted by 10,000+</p>
                    <p className="text-xs md:text-sm text-muted-foreground">satisfied clients</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24 bg-primary/5">
        <div className="container mx-auto px-4 md:px-6">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-2xl md:text-4xl lg:text-5xl font-serif font-semibold text-foreground mb-4 md:mb-6">
              Ready to Begin Your Journey?
            </h2>
            <p className="text-muted-foreground text-sm md:text-lg mb-6 md:mb-8">
              Book your consultation today and discover how we can help you achieve your aesthetic goals.
            </p>
            <Link to="/book">
              <Button variant="hero" size="lg" className="md:size-xl">
                Book Your Appointment
                <ArrowRight className="ml-2 h-4 w-4 md:h-5 md:w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-16 md:py-24">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8">
            <div className="glass-card rounded-xl md:rounded-2xl p-6 md:p-8 text-center">
              <div className="w-12 h-12 md:w-14 md:h-14 rounded-lg md:rounded-xl bg-accent flex items-center justify-center mx-auto mb-3 md:mb-4">
                <Phone className="h-5 w-5 md:h-6 md:w-6 text-primary" />
              </div>
              <h3 className="font-serif text-lg md:text-xl font-semibold text-foreground mb-1 md:mb-2">Call Us</h3>
              <p className="text-muted-foreground text-sm md:text-base">+1 (555) 123-4567</p>
            </div>
            <div className="glass-card rounded-xl md:rounded-2xl p-6 md:p-8 text-center">
              <div className="w-12 h-12 md:w-14 md:h-14 rounded-lg md:rounded-xl bg-accent flex items-center justify-center mx-auto mb-3 md:mb-4">
                <Mail className="h-5 w-5 md:h-6 md:w-6 text-primary" />
              </div>
              <h3 className="font-serif text-lg md:text-xl font-semibold text-foreground mb-1 md:mb-2">Email Us</h3>
              <p className="text-muted-foreground text-sm md:text-base">gwyn@clinic.com</p>
            </div>
            <div className="glass-card rounded-xl md:rounded-2xl p-6 md:p-8 text-center col-span-2 sm:col-span-2 lg:col-span-1">
              <div className="w-12 h-12 md:w-14 md:h-14 rounded-lg md:rounded-xl bg-accent flex items-center justify-center mx-auto mb-3 md:mb-4">
                <MapPin className="h-5 w-5 md:h-6 md:w-6 text-primary" />
              </div>
              <h3 className="font-serif text-lg md:text-xl font-semibold text-foreground mb-1 md:mb-2">Visit Us</h3>
              <address className="mb-2">
                <p className="text-muted-foreground text-sm md:text-base">Mabini Street, Dipolog City</p>
              </address>
              <a 
                className="text-blue-500 hover:text-blue-600 text-sm md:text-base transition-colors"
                href="https://maps.google.com/?daddr=Mabini%20Street%2C%20Dipolog%20City%2C%20Zamboanga%20Peninsula" 
                target="_blank"
                rel="noopener noreferrer"
              >
                Get directions
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 md:py-12 border-t border-border">
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-3 md:gap-4">
            <div className="flex items-center gap-2">
              <img 
                src="gwyn.png" 
                alt="Gwyn Logo" 
                className="h-10 w-16 md:h-14 md:w-22 object-cover rounded-full"
              />
            </div>
            <p className="text-muted-foreground text-xs md:text-sm text-center md:text-left">
              © 2024 Gwyn Aesthetic Clinic. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;