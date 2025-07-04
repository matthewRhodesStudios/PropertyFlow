import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import Properties from "@/pages/properties";
import Contractors from "@/pages/contractors";
import Documents from "@/pages/documents";
import Quotes from "@/pages/quotes";
import Reports from "@/pages/reports";
import Gantt from "@/pages/gantt";
import Expenses from "@/pages/expenses";
import Sidebar from "@/components/layout/sidebar";
import TopBar from "@/components/layout/topbar";
import calendar from "@/pages/calendar";
import { Calendar } from "lucide-react";

function Router() {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-y-auto bg-surface-variant px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <Switch>
            <Route path="/" component={Dashboard} />
            <Route path="/properties" component={Properties} />
            <Route path="/contractors" component={Contractors} />
            <Route path="/documents" component={Documents} />
            <Route path="/quotes" component={Quotes} />
            <Route path="/gantt" component={Gantt} />
            <Route path="/expenses" component={Expenses} />
            <Route path="/reports" component={Reports} />
            <Route path="/calendar" component={calendar} />
            <Route component={NotFound} />
          </Switch>
        </main>
      </div>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
