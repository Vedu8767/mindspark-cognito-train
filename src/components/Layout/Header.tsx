import { useState } from 'react';
import { Menu, X, Brain, User, BarChart3, BookOpen, Gamepad2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface HeaderProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

const Header = ({ currentPage, onNavigate }: HeaderProps) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navigationItems = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'games', label: 'Brain Games', icon: Gamepad2 },
    { id: 'analytics', label: 'Progress', icon: BarChart3 },
    { id: 'articles', label: 'Brain Health', icon: BookOpen },
  ];

  return (
    <header className="glass-card-strong sticky top-0 z-50 w-full">
      <div className="container mx-auto px-4 lg:px-6">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-primary to-primary-dark">
              <Brain className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">MCI Cognitive Care</h1>
              <p className="text-xs text-muted-foreground">Brain Training Platform</p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-2">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              return (
                <Button
                  key={item.id}
                  variant={currentPage === item.id ? "default" : "ghost"}
                  onClick={() => onNavigate(item.id)}
                  className={`
                    px-4 py-2 h-auto flex items-center space-x-2 rounded-lg transition-all duration-200
                    ${currentPage === item.id 
                      ? 'bg-gradient-to-r from-primary to-primary-dark text-primary-foreground shadow-lg' 
                      : 'hover:bg-hover text-foreground'
                    }
                  `}
                >
                  <Icon className="h-4 w-4" />
                  <span className="font-medium">{item.label}</span>
                </Button>
              );
            })}
          </nav>

          {/* User Profile */}
          <div className="hidden md:flex items-center space-x-3">
            <div className="text-right">
              <p className="text-sm font-medium text-foreground">Mrs. Sharma</p>
              <p className="text-xs text-muted-foreground">Welcome back!</p>
            </div>
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-accent to-accent-light flex items-center justify-center">
              <User className="h-5 w-5 text-accent-foreground" />
            </div>
          </div>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="sm"
            className="md:hidden"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-border">
            <nav className="space-y-2">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Button
                    key={item.id}
                    variant={currentPage === item.id ? "default" : "ghost"}
                    onClick={() => {
                      onNavigate(item.id);
                      setIsMobileMenuOpen(false);
                    }}
                    className={`
                      w-full justify-start px-4 py-3 h-auto flex items-center space-x-3 rounded-lg
                      ${currentPage === item.id 
                        ? 'bg-gradient-to-r from-primary to-primary-dark text-primary-foreground' 
                        : 'hover:bg-hover text-foreground'
                      }
                    `}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="font-medium text-lg">{item.label}</span>
                  </Button>
                );
              })}
            </nav>
            
            {/* Mobile User Profile */}
            <div className="mt-4 pt-4 border-t border-border flex items-center space-x-3">
              <div className="h-12 w-12 rounded-full bg-gradient-to-br from-accent to-accent-light flex items-center justify-center">
                <User className="h-6 w-6 text-accent-foreground" />
              </div>
              <div>
                <p className="text-base font-medium text-foreground">Mrs. Sharma</p>
                <p className="text-sm text-muted-foreground">Welcome back!</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;