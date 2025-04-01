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
import Attendance from "@/pages/attendance";
import FeeManagement from "@/pages/fee-management";
import FeePayments from "@/pages/fee-payments";
import Settings from "@/pages/settings";
import Login from "@/pages/login";
import { AuthProvider, useAuth } from "@/context/auth-context";
import ProtectedRoute from "@/components/protected-route";

function AuthenticatedApp() {
  const { isAuthenticated, user } = useAuth();
  const [location, setLocation] = useLocation();

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

  // Define allowed paths for each role
  const rolePathMap = {
    parent: ["/students"],
    teacher: ["/dashboard", "/students", "/classes", "/attendance", "/inventory"],
    officeadmin: ["/dashboard", "/students", "/classes", "/attendance", "/fee-management", "/fee-payments", "/expenses", "/inventory", "/reports"],
    superadmin: ["/dashboard", "/students", "/classes", "/attendance", "/fee-management", "/fee-payments", "/expenses", "/inventory", "/reports", "/settings", "/role-management", "/user-management"]
  };

  // Redirect to allowed page based on role
  if (user && location !== "/") {
    const allowedPaths = rolePathMap[user.role] || [];
    if (!allowedPaths.includes(location)) {
      // Redirect to the first allowed page for this role
      if (allowedPaths.length > 0) {
        if (location !== allowedPaths[0]) {
          setLocation(allowedPaths[0]);
          return null;
        }
      }
    }
  } 
  
  // Handle root path redirects for each role
  if (user && (location === "/" || location === "")) {
    // Parents go straight to students page
    if (user.role === "parent") {
      setLocation("/students");
      return null;
    }
    // Everyone else goes to dashboard
    setLocation("/dashboard");
    return null;
  }

  // Regular authenticated routing with role-based protection
  return (
    <AppLayout>
      <Switch>
        <Route path="/dashboard">
          <ProtectedRoute 
            component={Dashboard} 
            allowedRoles={["teacher", "officeadmin", "superadmin"]} 
          />
        </Route>
        <Route path="/students">
          <ProtectedRoute 
            component={Students} 
            allowedRoles={["parent", "teacher", "officeadmin", "superadmin"]} 
          />
        </Route>
        <Route path="/classes">
          <ProtectedRoute 
            component={Classes} 
            allowedRoles={["teacher", "officeadmin", "superadmin"]} 
          />
        </Route>
        <Route path="/attendance">
          <ProtectedRoute 
            component={Attendance} 
            allowedRoles={["teacher", "officeadmin", "superadmin"]} 
          />
        </Route>
        <Route path="/fee-management">
          <ProtectedRoute 
            component={FeeManagement} 
            allowedRoles={["officeadmin", "superadmin"]} 
          />
        </Route>
        <Route path="/fee-payments">
          <ProtectedRoute 
            component={FeePayments} 
            allowedRoles={["officeadmin", "superadmin"]} 
          />
        </Route>
        <Route path="/expenses">
          <ProtectedRoute 
            component={Expenses} 
            allowedRoles={["officeadmin", "superadmin"]} 
          />
        </Route>
        <Route path="/inventory">
          <ProtectedRoute 
            component={Inventory} 
            allowedRoles={["teacher", "officeadmin", "superadmin"]} 
          />
        </Route>
        <Route path="/reports">
          <ProtectedRoute 
            component={Reports} 
            allowedRoles={["officeadmin", "superadmin"]} 
          />
        </Route>
        <Route path="/settings">
          <ProtectedRoute 
            component={Settings} 
            allowedRoles={["superadmin"]} 
          />
        </Route>
        <Route component={NotFound} />
      </Switch>
    </AppLayout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AuthenticatedApp />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
