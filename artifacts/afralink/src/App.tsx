import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@workspace/replit-auth-web";
import NotFound from "@/pages/not-found";
import { Loader2 } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";

// Define components to import
import Home from "@/pages/home";
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

const queryClient = new QueryClient();

function ProtectedRoute({ component: Component, adminOnly = false, ...rest }: any) {
  const { user, isAuthenticated, isLoading, login } = useAuth();
  const [location, setLocation] = useLocation();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    login();
    return null;
  }

  if (adminOnly && (user as any)?.role !== "admin") {
    setLocation("/");
    return null;
  }

  return <Component {...rest} />;
}

function Router() {
  return (
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
          {() => <ProtectedRoute component={AdminDashboard} adminOnly={true} />}
        </Route>
        
        <Route path="/profile">
          {() => <ProtectedRoute component={Profile} />}
        </Route>

        <Route component={NotFound} />
      </Switch>
    </AppLayout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
