import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import AppLayout from "@/components/layout/app-layout";
import Dashboard from "@/pages/dashboard";
import Students from "@/pages/students";
import Expenses from "@/pages/expenses";
import Inventory from "@/pages/inventory";
import Reports from "@/pages/reports";
import Classes from "@/pages/classes";
import FeeManagement from "@/pages/fee-management";
import FeePayments from "@/pages/fee-payments";
import Settings from "@/pages/settings";
import Login from "@/pages/login";
import { useEffect, useState } from "react";

// Simple authentication check
function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [, setLocation] = useLocation();

  useEffect(() => {
    // Check if user data exists in session storage
    const userData = sessionStorage.getItem("user");
    if (userData) {
      try {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        setIsAuthenticated(true);
      } catch (err) {
        console.error("Failed to parse user data:", err);
        sessionStorage.removeItem("user");
        setLocation("/login");
      }
    }
  }, [setLocation]);

  return { isAuthenticated, user };
}

function AuthenticatedApp() {
  const { isAuthenticated, user } = useAuth();
  const [location] = useLocation();

  // If on login page, don't redirect
  if (location === "/login") {
    return (
      <Switch>
        <Route path="/login" component={Login} />
        <Route component={Login} />
      </Switch>
    );
  }

  // Not authenticated, redirect to login
  if (!isAuthenticated) {
    return <Login />;
  }

  // Check if user is parent, restrict to only students page
  if (user && user.role === "parent" && location !== "/students" && location !== "/") {
    return (
      <AppLayout>
        <Students />
      </AppLayout>
    );
  }

  // Regular authenticated routing
  return (
    <AppLayout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/students" component={Students} />
        <Route path="/classes" component={Classes} />
        <Route path="/fee-management" component={FeeManagement} />
        <Route path="/fee-payments" component={FeePayments} />
        <Route path="/expenses" component={Expenses} />
        <Route path="/inventory" component={Inventory} />
        <Route path="/reports" component={Reports} />
        <Route path="/settings" component={Settings} />
        <Route component={NotFound} />
      </Switch>
    </AppLayout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthenticatedApp />
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
