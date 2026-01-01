import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { 
  Activity, 
  BarChart3, 
  Brain, 
  ChevronRight, 
  Database, 
  HelpCircle, 
  LogIn, 
  Mail, 
  Phone, 
  ShieldCheck, 
  UserPlus,
  Zap,
  User
} from 'lucide-react';

const Landing = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 glass border-b border-border/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <Phone className="h-5 w-5 text-white" />
              </div>
              <span className="font-display font-bold text-xl">ECA</span>
            </div>

            <nav className="hidden md:flex items-center gap-8">
              <a href="#home" className="text-muted-foreground hover:text-foreground transition-colors">Home</a>
              <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">Features</a>
              <a href="#help" className="text-muted-foreground hover:text-foreground transition-colors">Help</a>
              <a href="#contact" className="text-muted-foreground hover:text-foreground transition-colors">Contact</a>
            </nav>

            <div className="flex items-center gap-3">
              <Link to="/auth?portal=user">
                <Button variant="ghost" size="sm">
                  <User className="h-4 w-4 mr-2" />
                  User Login
                </Button>
              </Link>
              <Link to="/auth?portal=admin">
                <Button variant="outline" size="sm">
                  <ShieldCheck className="h-4 w-4 mr-2" />
                  Admin Login
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section id="home" className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm mb-8">
            <Zap className="h-4 w-4" />
            AI-Powered Emergency Analysis
          </div>
          
          <h1 className="text-4xl md:text-6xl font-display font-bold mb-6 leading-tight">
            <span className="gradient-text">Sentiment Analysis</span>
            <br />
            <span className="text-foreground">for Emergency Calls</span>
          </h1>
          
          <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mb-10">
            Advanced MEDLDA and JST models combined with SVM classification to analyze 
            emotional distress, urgency levels, and extract actionable insights from 
            emergency communications.
          </p>

          {/* Portal Selection Cards */}
          <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto mt-12">
            {/* User Portal Card */}
            <div className="p-8 rounded-2xl glass border border-border/40 hover:border-primary/40 transition-all hover:scale-[1.02] group">
              <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mx-auto mb-6 group-hover:bg-primary group-hover:text-white transition-colors">
                <User className="h-8 w-8" />
              </div>
              <h3 className="text-2xl font-bold mb-3">User Portal</h3>
              <p className="text-muted-foreground mb-6">
                Make emergency calls, manage contacts, and track your call history with detailed analysis
              </p>
              <div className="space-y-3">
                <Link to="/auth?portal=user&mode=login">
                  <Button className="w-full" size="lg">
                    <LogIn className="h-4 w-4 mr-2" />
                    Login to User Portal
                  </Button>
                </Link>
                <Link to="/auth?portal=user&mode=register">
                  <Button variant="outline" className="w-full" size="lg">
                    <UserPlus className="h-4 w-4 mr-2" />
                    Register as User
                  </Button>
                </Link>
              </div>
            </div>

            {/* Admin Portal Card */}
            <div className="p-8 rounded-2xl glass border border-border/40 hover:border-accent/40 transition-all hover:scale-[1.02] group">
              <div className="h-16 w-16 rounded-2xl bg-accent/10 flex items-center justify-center text-accent mx-auto mb-6 group-hover:bg-accent group-hover:text-white transition-colors">
                <ShieldCheck className="h-8 w-8" />
              </div>
              <h3 className="text-2xl font-bold mb-3">Admin Portal</h3>
              <p className="text-muted-foreground mb-6">
                Access datasets, analytics, user management, and comprehensive system controls
              </p>
              <div className="space-y-3">
                <Link to="/auth?portal=admin&mode=login">
                  <Button variant="secondary" className="w-full" size="lg">
                    <ShieldCheck className="h-4 w-4 mr-2" />
                    Login as Admin
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { value: '95%', label: 'Model Accuracy' },
              { value: '50+', label: 'Sample Transcripts' },
              { value: '3', label: 'Sentiment Classes' },
              { value: '4', label: 'Urgency Levels' }
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-primary">{stat.value}</div>
                <div className="text-muted-foreground mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 bg-card/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
              Powerful Analysis Features
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Our platform combines state-of-the-art NLP techniques with intuitive visualizations
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: Brain,
                title: 'JST Model',
                description: 'Joint Sentiment-Topic modeling to extract emotional polarity and thematic topics simultaneously'
              },
              {
                icon: Activity,
                title: 'MEDLDA Classification',
                description: 'Maximum Entropy Discrimination LDA with SVM for robust urgency classification'
              },
              {
                icon: BarChart3,
                title: 'Real-time Analytics',
                description: 'Interactive dashboards showing sentiment distribution, urgency metrics, and topic word clouds'
              },
              {
                icon: Database,
                title: 'Synthetic Dataset',
                description: '50 carefully crafted emergency call transcripts with varied emotional tones and incident types'
              },
              {
                icon: ShieldCheck,
                title: 'Role-based Access',
                description: 'Secure admin and user portals with different access levels and capabilities'
              },
              {
                icon: Zap,
                title: 'Fast Processing',
                description: 'Optimized preprocessing pipeline with stemming, stop word removal, and n-gram analysis'
              }
            ].map((feature, i) => (
              <div key={i} className="p-6 rounded-2xl glass border border-border/40 hover:border-primary/40 transition-colors">
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4">
                  <feature.icon className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Help Section */}
      <section id="help" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-primary/10 text-primary mb-6">
              <HelpCircle className="h-8 w-8" />
            </div>
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
              How It Works
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                title: 'Data Input',
                description: 'Upload emergency call transcripts or use our synthetic dataset for analysis'
              },
              {
                step: '02',
                title: 'AI Processing',
                description: 'MEDLDA and JST models analyze sentiment, topics, and classify urgency levels'
              },
              {
                step: '03',
                title: 'Insights',
                description: 'View comprehensive dashboards with actionable insights and detailed analytics'
              }
            ].map((item, i) => (
              <div key={i} className="relative">
                <div className="text-8xl font-display font-bold text-primary/10 absolute -top-4 -left-2">
                  {item.step}
                </div>
                <div className="relative pt-12">
                  <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                  <p className="text-muted-foreground">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20 px-4 sm:px-6 lg:px-8 bg-card/30">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
            Get in Touch
          </h2>
          <p className="text-muted-foreground mb-8">
            Have questions about our emergency call analysis platform? We're here to help.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <a 
              href="mailto:support@eca.example.com" 
              className="flex items-center gap-3 px-6 py-4 rounded-xl glass border border-border/40 hover:border-primary/40 transition-colors"
            >
              <Mail className="h-5 w-5 text-primary" />
              <span>support@eca.example.com</span>
            </a>
            <a 
              href="tel:+1234567890" 
              className="flex items-center gap-3 px-6 py-4 rounded-xl glass border border-border/40 hover:border-primary/40 transition-colors"
            >
              <Phone className="h-5 w-5 text-primary" />
              <span>+1 (234) 567-890</span>
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 sm:px-6 lg:px-8 border-t border-border/40">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Phone className="h-4 w-4 text-white" />
            </div>
            <span className="font-display font-semibold">Emergency Call Analyzer</span>
          </div>
          
          <p className="text-sm text-muted-foreground">
            © 2024 B.Tech Project - Sentiment Analysis in Emergency Calls
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
