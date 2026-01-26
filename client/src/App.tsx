import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import DashboardLayout from "./components/DashboardLayout";
import Dashboard from "./pages/Dashboard";
import Parts from "./pages/Parts";
import Suppliers from "./pages/Suppliers";
import Customers from "./pages/Customers";
import PurchaseOrders from "./pages/PurchaseOrders";
import SalesInvoices from "./pages/SalesInvoices";
import InventoryLedger from "./pages/InventoryLedger";
import AIRestocking from "./pages/AIRestocking";

function Router() {
  return (
    <DashboardLayout>
      <Switch>
        <Route path={"/"} component={Dashboard} />
        <Route path={"/parts"} component={Parts} />
        <Route path={"/suppliers"} component={Suppliers} />
        <Route path={"/customers"} component={Customers} />
        <Route path={"/purchase-orders"} component={PurchaseOrders} />
        <Route path={"/sales-invoices"} component={SalesInvoices} />
        <Route path={"/inventory-ledger"} component={InventoryLedger} />
        <Route path={"/ai-restocking"} component={AIRestocking} />
        <Route path={"/404"} component={NotFound} />
        <Route component={NotFound} />
      </Switch>
    </DashboardLayout>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
