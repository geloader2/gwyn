import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, Star, Users, Sparkles, ArrowRight, Phone, Mail, MapPin, LogOut } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useServices } from '@/hooks/useServices';

const Index = () => {
  const { user, loading, signOut } = useAuth();
  const { services } = useServices();
  const featuredServices = (services || []).filter(s => s.is_active).slice(0, 4);

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass-panel">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <img src="../gwyn.png" alt="Gwyn Logo" className="h-14 w-22 object-cover rounded-full" />
            {/* <span className="font-serif text-2xl font-semibold text-foreground">Gwyn Aesthetic Clinic</span> */}
          </Link>
          <div className="hidden md:flex items-center gap-8">
            <a href="#services" className="text-muted-foreground hover:text-foreground transition-colors">Services</a>
            <a href="#about" className="text-muted-foreground hover:text-foreground transition-colors">About</a>
            <a href="#contact" className="text-muted-foreground hover:text-foreground transition-colors">Contact</a>
          </div>
          <div className="flex items-center gap-3">
            {!loading && (
              <>
                {user ? (
                  <>
                    <Link to="/dashboard">
                      <Button variant="ghost" size="sm">Dashboard</Button>
                    </Link>
                    <Button variant="ghost" size="sm" onClick={signOut}>
                      <LogOut className="h-4 w-4 mr-1" />
                      Logout
                    </Button>
                  </>
                ) : (
                  <Link to="/auth">
                    <Button variant="hero" size="sm">Login</Button>
                  </Link>
                )}
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center hero-gradient pt-20">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 -right-20 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 -left-20 w-80 h-80 bg-accent/30 rounded-full blur-3xl" />
        </div>
        
        <div className="container mx-auto px-6 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="max-w-2xl animate-slide-up">
              <h1 className="text-5xl md:text-7xl font-serif font-semibold text-foreground mb-6 leading-tight">
                Reveal Your
                <span className="text-primary block">Natural Beauty</span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-xl">
                Experience personalized aesthetic treatments in a luxurious, state-of-the-art environment. 
                Your journey to radiant confidence starts here.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link to="/book">
                  <Button variant="hero" size="xl">
                    Book Appointment
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <a href="#services">
                  <Button variant="outline" size="xl">
                    Explore Services
                  </Button>
                </a>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-8 mt-16 pt-8 border-t border-border/50">
                <div>
                  <p className="text-3xl font-serif font-semibold text-foreground">15+</p>
                  <p className="text-muted-foreground text-sm">Years Experience</p>
                </div>
                <div>
                  <p className="text-3xl font-serif font-semibold text-foreground">10k+</p>
                  <p className="text-muted-foreground text-sm">Happy Clients</p>
                </div>
                <div>
                  <p className="text-3xl font-serif font-semibold text-foreground">4.9</p>
                  <p className="text-muted-foreground text-sm flex items-center gap-1">
                    <Star className="h-3 w-3 fill-primary text-primary" /> Rating
                  </p>
                </div>
              </div>
            </div>

            {/* Hero Image */}
            <div className="relative hidden lg:block">
              <div className="relative rounded-3xl overflow-hidden shadow-2xl">
                <img 
                  src="gwyncover.avif" 
                  alt="Gwyn Aesthetic Clinic Interior" 
                  className="w-full h-auto object-cover rounded-3xl"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-3xl"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-24 bg-muted/30">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            {/* <span className="text-primary font-medium">Our Services</span> */}
            <h2 className="text-4xl md:text-5xl font-serif font-semibold text-foreground mt-2 mb-4">
              Our Services
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              From rejuvenating facials to advanced aesthetic procedures, we offer a comprehensive 
              range of treatments tailored to your unique needs.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredServices.map((service, index) => (
              <div
                key={service.id}
                className="group glass-card rounded-2xl p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center mb-4 group-hover:bg-primary/10 transition-colors">
                  {/* <img src="gwyncover.avif" alt="Gwyn Logo" className="h-6 w-6 object-cover rounded-full" /> */}
                </div>
                <h3 className="font-serif text-xl font-semibold text-foreground mb-2">{service.name}</h3>
                <p className="text-muted-foreground text-sm mb-4 line-clamp-2">{service.description}</p>
                <div className="flex items-center justify-between pt-4 border-t border-border/50">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    {service.duration} min
                  </div>
                  <span className="font-semibold text-foreground">
                    {service.price === 0 ? 'Free' : `₱${service.price}`}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link to="/book">
              <Button variant="default" size="lg">
                View All Services
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section id="about" className="py-24">
        <div className="container mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <span className="text-primary font-medium">Why Gwyn</span>
              <h2 className="text-4xl md:text-5xl font-serif font-semibold text-foreground mt-2 mb-6">
                Excellence in Every Detail
              </h2>
              <p className="text-muted-foreground mb-8">
                At Gwyn, we combine cutting-edge technology with personalized care to deliver 
                exceptional results. Our team of certified professionals is dedicated to helping 
                you achieve your aesthetic goals.
              </p>
              
              <div className="space-y-6">
                {[
                  { icon: Users, title: 'Expert Team', desc: 'Board-certified specialists with years of experience' },
                  { icon: Star, title: 'Premium Products', desc: 'Only FDA-approved, top-tier products and equipment' },
                  { icon: Calendar, title: 'Easy Booking', desc: 'Convenient online scheduling, 24/7 availability' },
                ].map((item, index) => (
                  <div key={index} className="flex gap-4">
                    <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center shrink-0">
                      <item.icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground mb-1">{item.title}</h3>
                      <p className="text-muted-foreground text-sm">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="aspect-[4/5] rounded-3xl bg-gradient-to-br from-primary/20 via-accent/30 to-secondary overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center p-8">
                    <img src="cover2.avif" alt="Gwyn Logo" className="h-356 w-90 object-cover mx-auto mb-4" />
                    <p className="text-muted-foreground font-serif text-xl">Where Science Meets Beauty</p>
                  </div>
                </div>
              </div>
              <div className="absolute -bottom-6 -left-6 glass-card rounded-2xl p-4 shadow-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
                    <Star className="h-5 w-5 text-primary-foreground fill-primary-foreground" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">Trusted by 10,000+</p>
                    <p className="text-sm text-muted-foreground">satisfied clients</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-primary/5">
        <div className="container mx-auto px-6">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-4xl md:text-5xl font-serif font-semibold text-foreground mb-6">
              Ready to Begin Your Journey?
            </h2>
            <p className="text-muted-foreground text-lg mb-8">
              Book your consultation today and discover how we can help you achieve your aesthetic goals.
            </p>
            <Link to="/book">
              <Button variant="hero" size="xl">
                Book Your Appointment
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-24">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="glass-card rounded-2xl p-8 text-center">
              <div className="w-14 h-14 rounded-xl bg-accent flex items-center justify-center mx-auto mb-4">
                <Phone className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-serif text-xl font-semibold text-foreground mb-2">Call Us</h3>
              <p className="text-muted-foreground">+1 (555) 123-4567</p>
            </div>
            <div className="glass-card rounded-2xl p-8 text-center">
              <div className="w-14 h-14 rounded-xl bg-accent flex items-center justify-center mx-auto mb-4">
                <Mail className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-serif text-xl font-semibold text-foreground mb-2">Email Us</h3>
              <p className="text-muted-foreground">gwyn@clinic.com</p>
            </div>
            <div className="glass-card rounded-2xl p-8 text-center">
              <div className="w-14 h-14 rounded-xl bg-accent flex items-center justify-center mx-auto mb-4">
                <MapPin className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-serif text-xl font-semibold text-foreground mb-2">Visit Us</h3>
              <address ><p><button type="button" aria-pressed="false" aria-labelledby="label-react-aria1030714992-:r5g:" aria-live="polite">Mabini Street, Dipolog City</button></p></address>
              <a className="text-blue" href="https://maps.google.com/?daddr=Mabini%20Street%2C%20Dipolog%20City%2C%20Zamboanga%20Peninsula"  data-qa="location-directions-link" id="directions-link" target="_blank">Get directions</a>
             
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-border">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <img src="..gwyn.png" alt="Gwyn Logo" className="h-14 w-22 object-cover rounded-full" />
              {/* <span className="font-serif text-xl font-semibold text-foreground">Gwyn Aesthetic Clinic</span> */}
            </div>
            <p className="text-muted-foreground text-sm">
              © 2024 Gwyn Aesthetic Clinic. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;