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

function Router() {
  return (
    <AppLayout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/students" component={Students} />
        <Route path="/expenses" component={Expenses} />
        <Route path="/inventory" component={Inventory} />
        <Route path="/reports" component={Reports} />
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
