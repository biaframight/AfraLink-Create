import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth, AuthProvider } from "@/lib/auth";
import NotFound from "@/pages/not-found";
import { Loader2 } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";

import Home from "@/pages/home";
import LoginPage from "@/pages/login";
import Onboarding from "@/pages/onboarding";
import DriversList from "@/pages/drivers/list";
import DriverDetail from "@/pages/drivers/detail";
import RentalsList from "@/pages/rentals/list";
import RentalDetail from "@/pages/rentals/detail";
import CustomerDashboard from "@/pages/dashboard";
import DriverDashboard from "@/pages/driver-dashboard";
import BecomeDriver from "@/pages/become-driver";
import ListVehicle from "@/pages/list-vehicle";
import AdminDashboard from "@/pages/admin";
import Profile from "@/pages/profile";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: (count, err: any) => err?.status >= 500 && count < 2 },
  },
});

function ProtectedRoute({
  component: Component,
  adminOnly = false,
  ...rest
}: any) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [location, setLocation] = useLocation();

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    setLocation(`/login?next=${encodeURIComponent(location)}`);
    return null;
  }

  if (adminOnly && user?.role !== "admin") {
    setLocation("/");
    return null;
  }

  return <Component {...rest} />;
}

function OnboardingGate({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [location, setLocation] = useLocation();

  const skipPaths = ["/login", "/onboarding"];
  if (skipPaths.some((p) => location.startsWith(p))) return <>{children}</>;

  if (
    !isLoading &&
    isAuthenticated &&
    user &&
    (!user.phone || !user.fullName)
  ) {
    setLocation("/onboarding");
    return null;
  }

  return <>{children}</>;
}

function Router() {
  return (
    <OnboardingGate>
      <Switch>
        <Route path="/login" component={LoginPage} />
        <Route path="/onboarding" component={Onboarding} />

        <Route>
          <AppLayout>
            <Switch>
              <Route path="/" component={Home} />
              <Route path="/drivers" component={DriversList} />
              <Route path="/drivers/:id" component={DriverDetail} />
              <Route path="/rentals" component={RentalsList} />
              <Route path="/rentals/:id" component={RentalDetail} />

              <Route path="/dashboard">
                {() => <ProtectedRoute component={CustomerDashboard} />}
              </Route>
              <Route path="/driver-dashboard">
                {() => <ProtectedRoute component={DriverDashboard} />}
              </Route>
              <Route path="/become-driver">
                {() => <ProtectedRoute component={BecomeDriver} />}
              </Route>
              <Route path="/list-vehicle">
                {() => <ProtectedRoute component={ListVehicle} />}
              </Route>
              <Route path="/admin">
                {() => <ProtectedRoute component={AdminDashboard} adminOnly />}
              </Route>
              <Route path="/profile">
                {() => <ProtectedRoute component={Profile} />}
              </Route>

              <Route component={NotFound} />
            </Switch>
          </AppLayout>
        </Route>
      </Switch>
    </OnboardingGate>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <AuthProvider>
            <Router />
          </AuthProvider>
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
