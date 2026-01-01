import { Link } from 'react-router-dom';
import { Brain, HelpCircle, Home, LogOut, Mail, Phone, Settings, ShieldCheck, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface HeaderProps {
  userEmail?: string;
  userRole?: 'admin' | 'user' | null;
  onSignOut?: () => void;
}

export function Header({ userEmail, userRole, onSignOut }: HeaderProps) {
  return (
    <header className="border-b border-border/50 bg-card/50 backdrop-blur-xl sticky top-0 z-50">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/20 glow-primary">
                <Phone className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-bold gradient-text">Emergency Call Analyzer</h1>
                <p className="text-sm text-muted-foreground">Sentiment Analysis Dashboard</p>
              </div>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            <Link 
              to="/dashboard" 
              className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
            >
              <Home className="h-4 w-4" />
              Dashboard
            </Link>
            <a 
              href="/#help" 
              className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
            >
              <HelpCircle className="h-4 w-4" />
              Help
            </a>
            <a 
              href="/#contact" 
              className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
            >
              <Mail className="h-4 w-4" />
              Contact
            </a>
            {userRole === 'admin' && (
              <Link 
                to="/admin" 
                className="text-sm text-primary hover:text-primary/80 transition-colors flex items-center gap-1"
              >
                <ShieldCheck className="h-4 w-4" />
                Admin
              </Link>
            )}
          </nav>
          
          <div className="flex items-center gap-4">
            <div className="hidden lg:flex items-center gap-2 text-sm text-muted-foreground">
              <Brain className="h-4 w-4 text-accent" />
              <span>MEDLDA + JST</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-urgency-low animate-pulse" />
              <span className="text-sm text-muted-foreground">Live</span>
            </div>
            
            {userEmail && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="flex items-center gap-2">
                    {userRole === 'admin' ? (
                      <ShieldCheck className="h-4 w-4 text-primary" />
                    ) : (
                      <User className="h-4 w-4 text-muted-foreground" />
                    )}
                    <span className="hidden sm:inline text-muted-foreground max-w-[150px] truncate">
                      {userEmail}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-popover border-border">
                  <div className="px-2 py-1.5">
                    <p className="text-sm font-medium">{userEmail}</p>
                    <p className="text-xs text-muted-foreground capitalize">{userRole} Account</p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/dashboard" className="cursor-pointer">
                      <Home className="h-4 w-4 mr-2" />
                      Dashboard
                    </Link>
                  </DropdownMenuItem>
                  {userRole === 'admin' && (
                    <DropdownMenuItem asChild>
                      <Link to="/admin" className="cursor-pointer">
                        <ShieldCheck className="h-4 w-4 mr-2" />
                        Admin Panel
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem asChild>
                    <a href="/#help" className="cursor-pointer">
                      <HelpCircle className="h-4 w-4 mr-2" />
                      Help
                    </a>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <a href="/#contact" className="cursor-pointer">
                      <Mail className="h-4 w-4 mr-2" />
                      Contact
                    </a>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  {onSignOut && (
                    <DropdownMenuItem onClick={onSignOut} className="text-destructive cursor-pointer">
                      <LogOut className="h-4 w-4 mr-2" />
                      Sign Out
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
