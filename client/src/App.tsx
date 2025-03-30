import { Switch, Route } from "wouter";
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
import UserManagement from "@/pages/user-management";

function Router() {
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
        <Route path="/user-management" component={UserManagement} />
        <Route component={NotFound} />
      </Switch>
    </AppLayout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router />
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
