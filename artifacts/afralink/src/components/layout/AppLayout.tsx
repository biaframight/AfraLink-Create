import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { Home, Users, Car, Calendar, User, LogOut, LogIn, Menu, X, Shield, Truck, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { BackButton } from "@/components/BackButton";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/drivers", label: "Find Drivers" },
  { href: "/rentals", label: "Car Rentals" },
];

const mobileTabLinks = [
  { href: "/", label: "Home", icon: Home },
  { href: "/drivers", label: "Drivers", icon: Users },
  { href: "/rentals", label: "Rentals", icon: Car },
  { href: "/dashboard", label: "Bookings", icon: Calendar, protected: true },
  { href: "/profile", label: "Profile", icon: User, protected: true },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { user, isAuthenticated, login, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const role = (user as any)?.role;
  const visibleTabs = mobileTabLinks.filter(t => !t.protected || isAuthenticated);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Navigation Bar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 flex-shrink-0">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center font-bold text-white text-sm shadow-sm">
                A
              </div>
              <span className="text-xl font-bold text-slate-900 tracking-tight">AfraLink</span>
            </Link>

            {/* Desktop Nav Links */}
            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map(({ href, label }) => {
                const isActive = href === "/" ? location === "/" : location.startsWith(href);
                return (
                  <Link key={href} href={href}>
                    <span className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                    }`}>
                      {label}
                    </span>
                  </Link>
                );
              })}

              {isAuthenticated && (
                <>
                  <Link href="/dashboard">
                    <span className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      location.startsWith("/dashboard") ? "bg-primary/10 text-primary" : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                    }`}>My Bookings</span>
                  </Link>
                  {role === "driver" && (
                    <Link href="/driver-dashboard">
                      <span className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        location.startsWith("/driver-dashboard") ? "bg-primary/10 text-primary" : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                      }`}>Driver Hub</span>
                    </Link>
                  )}
                  {role === "admin" && (
                    <Link href="/admin">
                      <span className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        location.startsWith("/admin") ? "bg-primary/10 text-primary" : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                      }`}>Admin</span>
                    </Link>
                  )}
                </>
              )}
            </nav>

            {/* Desktop Auth */}
            <div className="hidden md:flex items-center gap-3">
              {!isAuthenticated ? (
                <>
                  <Button variant="ghost" size="sm" onClick={() => login()} className="text-slate-600 hover:text-slate-900">
                    Sign In
                  </Button>
                  <Button size="sm" onClick={() => login()} className="bg-primary hover:bg-primary/90 text-white shadow-sm">
                    Get Started
                  </Button>
                </>
              ) : (
                <div className="flex items-center gap-2">
                  <Link href="/profile">
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer">
                      <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden flex-shrink-0">
                        {user?.profileImageUrl ? (
                          <img src={user.profileImageUrl} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-primary text-xs font-bold">
                            {user?.firstName?.[0] || "U"}
                          </span>
                        )}
                      </div>
                      <span className="text-sm font-medium text-slate-700">{user?.firstName || "Account"}</span>
                      <ChevronDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </Link>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => logout()}
                    className="text-slate-400 hover:text-slate-700 px-2"
                  >
                    <LogOut className="w-4 h-4" />
                  </Button>
                </div>
              )}

              {/* Become Driver / List Vehicle CTAs */}
              {isAuthenticated && !role && (
                <Link href="/become-driver">
                  <Button size="sm" variant="outline" className="text-primary border-primary hover:bg-primary/5">
                    <Truck className="w-3 h-3 mr-1" /> Become a Driver
                  </Button>
                </Link>
              )}
            </div>

            {/* Mobile hamburger */}
            <button
              className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
              onClick={() => setMobileMenuOpen(v => !v)}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-100 bg-white px-4 py-3 space-y-1 shadow-lg">
            {navLinks.map(({ href, label }) => {
              const isActive = href === "/" ? location === "/" : location.startsWith(href);
              return (
                <Link key={href} href={href}>
                  <span
                    onClick={() => setMobileMenuOpen(false)}
                    className={`block px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      isActive ? "bg-primary/10 text-primary" : "text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    {label}
                  </span>
                </Link>
              );
            })}
            {isAuthenticated && (
              <>
                <Link href="/dashboard">
                  <span onClick={() => setMobileMenuOpen(false)} className="block px-4 py-2.5 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50">My Bookings</span>
                </Link>
                <Link href="/profile">
                  <span onClick={() => setMobileMenuOpen(false)} className="block px-4 py-2.5 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50">My Profile</span>
                </Link>
                {role === "driver" && (
                  <Link href="/driver-dashboard">
                    <span onClick={() => setMobileMenuOpen(false)} className="block px-4 py-2.5 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50">Driver Hub</span>
                  </Link>
                )}
              </>
            )}
            <div className="pt-2 border-t border-slate-100">
              {!isAuthenticated ? (
                <Button onClick={() => { login(); setMobileMenuOpen(false); }} className="w-full bg-primary hover:bg-primary/90 text-white">
                  <LogIn className="w-4 h-4 mr-2" /> Sign In / Register
                </Button>
              ) : (
                <Button variant="outline" onClick={() => { logout(); setMobileMenuOpen(false); }} className="w-full text-slate-600">
                  <LogOut className="w-4 h-4 mr-2" /> Sign Out
                </Button>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Page Content */}
      <main className="flex-1 pb-16 md:pb-0">
        {location !== "/" && (
          <div className="px-4 sm:px-6 lg:px-8 pt-3">
            <BackButton />
          </div>
        )}
        {children}
      </main>

      {/* Mobile Bottom Tab Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 flex items-center justify-around z-50 shadow-up">
        {visibleTabs.slice(0, 5).map(({ href, label, icon: Icon }) => {
          const isActive = href === "/" ? location === "/" : location.startsWith(href);
          return (
            <Link key={href} href={href}>
              <div className={`flex flex-col items-center py-2 px-3 min-w-[56px] transition-colors ${
                isActive ? "text-primary" : "text-slate-400 hover:text-slate-700"
              }`}>
                <Icon className={`w-5 h-5 mb-0.5 ${isActive ? "stroke-[2.5px]" : ""}`} />
                <span className="text-[10px] font-medium leading-none">{label}</span>
              </div>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
