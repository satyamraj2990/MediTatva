import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Search, MapPin, MessageCircle, Bot, Shield, Clock } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import heroImage from "@/assets/hero-image.jpg";

const Index = () => {
  return (
    <div className="min-h-screen">
      {/* Navigation Bar */}
      <nav className="absolute top-0 left-0 right-0 z-20 p-4">
        <div className="container mx-auto flex justify-end">
          <ThemeToggle />
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <div
          className="absolute inset-0 z-0 hero-gradient"
          style={{
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
        
        <div className="relative z-10 container mx-auto px-4 py-20 text-center">
          <div className="animate-in fade-in slide-in-from-bottom duration-700">
            <h1 className="text-6xl md:text-7xl font-heading font-bold text-white mb-6">
              MediTatva
            </h1>
            <p className="text-2xl md:text-3xl text-white/90 mb-4 font-semibold">
              Find Your Medicines Instantly
            </p>
            <p className="text-xl text-white/80 mb-12 max-w-2xl mx-auto">
              Anytime, Anywhere — AI-powered platform connecting you with nearby pharmacies
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/login?role=patient">
                <Button className="btn-gradient text-lg px-8 py-6 h-auto">
                  Login as Patient
                </Button>
              </Link>
              <Link to="/login?role=pharmacy">
                <Button className="btn-gradient text-lg px-8 py-6 h-auto bg-gradient-to-r from-secondary to-secondary-light">
                  Login as Pharmacy
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-white/50 rounded-full flex justify-center p-2">
            <div className="w-1 h-3 bg-white/50 rounded-full"></div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl md:text-5xl font-heading font-bold text-center mb-4 gradient-text">
            Powerful Features
          </h2>
          <p className="text-center text-muted-foreground mb-16 max-w-2xl mx-auto">
            Everything you need to find and manage medicines efficiently
          </p>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="glass-card p-8 card-hover">
              <div className="h-16 w-16 rounded-2xl gradient-primary flex items-center justify-center mb-6">
                <Search className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-heading font-bold mb-4">Smart Search</h3>
              <p className="text-muted-foreground">
                Find medicines instantly with AI-powered search across all nearby pharmacies with real-time availability.
              </p>
            </Card>

            <Card className="glass-card p-8 card-hover">
              <div className="h-16 w-16 rounded-2xl gradient-secondary flex items-center justify-center mb-6">
                <MapPin className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-heading font-bold mb-4">Live Location</h3>
              <p className="text-muted-foreground">
                Interactive map showing nearby pharmacies with distance, ratings, and opening hours.
              </p>
            </Card>

            <Card className="glass-card p-8 card-hover">
              <div className="h-16 w-16 rounded-2xl gradient-accent flex items-center justify-center mb-6">
                <MessageCircle className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-heading font-bold mb-4">Direct Chat</h3>
              <p className="text-muted-foreground">
                Chat directly with pharmacies to check availability, reserve medicines, and get instant responses.
              </p>
            </Card>

            <Card className="glass-card p-8 card-hover">
              <div className="h-16 w-16 rounded-2xl gradient-primary flex items-center justify-center mb-6">
                <Bot className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-heading font-bold mb-4">AI Assistant</h3>
              <p className="text-muted-foreground">
                24/7 AI chatbot for medicine recommendations, substitutes, and health queries with instant answers.
              </p>
            </Card>

            <Card className="glass-card p-8 card-hover">
              <div className="h-16 w-16 rounded-2xl gradient-secondary flex items-center justify-center mb-6">
                <Shield className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-heading font-bold mb-4">Secure Platform</h3>
              <p className="text-muted-foreground">
                Your health data is encrypted and secure. HIPAA compliant with end-to-end encryption.
              </p>
            </Card>

            <Card className="glass-card p-8 card-hover">
              <div className="h-16 w-16 rounded-2xl gradient-accent flex items-center justify-center mb-6">
                <Clock className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-heading font-bold mb-4">Quick Reservations</h3>
              <p className="text-muted-foreground">
                Reserve medicines in seconds and pick them up at your convenience. No more waiting in queues.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 gradient-primary">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl md:text-5xl font-heading font-bold text-center mb-16 text-white">
            What Our Users Say
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                name: "Sarah Johnson",
                role: "Patient",
                text: "MediTatva saved me hours of calling pharmacies. Found my medicine in minutes!",
              },
              {
                name: "Dr. Rajesh Kumar",
                role: "Healthcare Provider",
                text: "The AI chatbot is incredibly helpful for patients looking for alternatives.",
              },
              {
                name: "MediCare Pharmacy",
                role: "Pharmacy Partner",
                text: "Our customer engagement increased by 300% after joining MediTatva.",
              },
            ].map((testimonial, index) => (
              <Card key={index} className="glass-card p-8 bg-white/10 backdrop-blur-xl border-white/20">
                <p className="text-white mb-6 text-lg italic">"{testimonial.text}"</p>
                <div>
                  <p className="text-white font-semibold">{testimonial.name}</p>
                  <p className="text-white/70 text-sm">{testimonial.role}</p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-5xl font-heading font-bold mb-6 gradient-text">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-muted-foreground mb-12 max-w-2xl mx-auto">
            Join thousands of users who trust MediTatva for their medicine needs
          </p>
          <Link to="/login">
            <Button className="btn-gradient text-lg px-12 py-6 h-auto">
              Get Started Now
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-foreground text-background py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h3 className="font-heading font-bold text-xl mb-4">MediTatva</h3>
              <p className="text-sm opacity-80">
                AI-powered medicine finder connecting patients with pharmacies.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-sm opacity-80">
                <li><Link to="/login">Login</Link></li>
                <li><a href="#features">Features</a></li>
                <li><a href="#testimonials">Testimonials</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-sm opacity-80">
                <li><a href="#help">Help Center</a></li>
                <li><a href="#privacy">Privacy Policy</a></li>
                <li><a href="#terms">Terms of Service</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Contact</h4>
              <ul className="space-y-2 text-sm opacity-80">
                <li>support@meditatva.com</li>
                <li>+1 (555) 123-4567</li>
                <li>24/7 Support Available</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-background/20 mt-8 pt-8 text-center text-sm opacity-80">
            <p>&copy; 2025 MediTatva. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
