import { Link, useLocation } from "wouter";
import { useAuth } from "@workspace/replit-auth-web";
import { Home, Users, Car, Calendar, User, LogOut, LogIn, Menu, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { user, isAuthenticated, login, logout } = useAuth();

  const navItems = [
    { href: "/", label: "Home", icon: Home },
    { href: "/drivers", label: "Drivers", icon: Users },
    { href: "/rentals", label: "Rentals", icon: Car },
    { href: "/dashboard", label: "Bookings", icon: Calendar, protected: true },
    { href: "/profile", label: "Profile", icon: User, protected: true },
  ];

  if ((user as any)?.role === "admin") {
    navItems.push({ href: "/admin", label: "Admin", icon: Shield, protected: true });
  }

  const visibleItems = navItems.filter(item => !item.protected || isAuthenticated);

  return (
    <div className="flex h-screen w-full bg-slate-50 overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-slate-900 text-white shadow-xl flex-shrink-0">
        <div className="p-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center font-bold text-white">A</div>
            <span className="text-xl font-bold tracking-tight">AfraLink</span>
          </Link>
        </div>
        
        <nav className="flex-1 px-4 space-y-2 mt-4 overflow-y-auto">
          {visibleItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
            return (
              <Link key={item.href} href={item.href}>
                <span className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${
                  isActive 
                    ? "bg-primary text-primary-foreground" 
                    : "text-slate-400 hover:text-white hover:bg-slate-800"
                }`}>
                  <Icon className="w-5 h-5" />
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-800">
          {isAuthenticated ? (
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-sm font-medium">{user?.firstName || "User"}</span>
                <span className="text-xs text-slate-400 capitalize">{(user as any)?.role || "Customer"}</span>
              </div>
              <Button variant="ghost" size="icon" onClick={() => logout()} className="text-slate-400 hover:text-white hover:bg-slate-800">
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <Button onClick={() => login()} className="w-full bg-primary hover:bg-primary/90 text-white">
              <LogIn className="w-4 h-4 mr-2" />
              Log In
            </Button>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Mobile Header */}
        <header className="md:hidden flex items-center justify-between p-4 bg-white border-b shadow-sm z-10 flex-shrink-0">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center font-bold text-white">A</div>
            <span className="text-lg font-bold text-slate-900">AfraLink</span>
          </Link>
          {!isAuthenticated ? (
            <Button variant="outline" size="sm" onClick={() => login()}>Log In</Button>
          ) : (
            <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center overflow-hidden">
              {user?.profileImageUrl ? (
                <img src={user?.profileImageUrl} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <User className="w-4 h-4 text-slate-500" />
              )}
            </div>
          )}
        </header>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto pb-20 md:pb-0">
          <div className="max-w-7xl mx-auto w-full p-4 md:p-8">
            {children}
          </div>
        </div>
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t flex items-center justify-around p-2 pb-safe z-50">
        {visibleItems.slice(0, 5).map((item) => {
          const Icon = item.icon;
          const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
          return (
            <Link key={item.href} href={item.href}>
              <div className={`flex flex-col items-center p-2 rounded-xl min-w-[64px] transition-colors ${
                isActive ? "text-primary" : "text-slate-500 hover:text-slate-900"
              }`}>
                <Icon className={`w-5 h-5 mb-1 ${isActive ? "fill-primary/20" : ""}`} />
                <span className="text-[10px] font-medium">{item.label}</span>
              </div>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
