import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import DashboardLayout from "./components/DashboardLayout";
import Dashboard from "./pages/Dashboard";
import PartsNew from "./pages/PartsNew";
import PartHistory from "./pages/PartHistory";
import Suppliers from "./pages/Suppliers";
import Customers from "./pages/Customers";
import PurchaseOrders from "./pages/PurchaseOrders";
import SalesInvoices from "./pages/SalesInvoices";
import InventoryLedger from "./pages/InventoryLedger";
import AIRestocking from "./pages/AIRestocking";
import Credits from "./pages/Credits";
import Warranties from "./pages/Warranties";
import SalesHistoryDemo from "./pages/SalesHistoryDemo";

function Router() {
  return (
    <DashboardLayout>
      <Switch>
        <Route path={"/"} component={Dashboard} />
        <Route path={"/parts"} component={PartsNew} />
        <Route path={"/parts/:id/history"} component={PartHistory} />
        <Route path={"/suppliers"} component={Suppliers} />
        <Route path={"/customers"} component={Customers} />
        <Route path={"/purchase-orders"} component={PurchaseOrders} />
        <Route path={"/sales-invoices"} component={SalesInvoices} />
        <Route path={"/inventory-ledger"} component={InventoryLedger} />
        <Route path={"/credits"} component={Credits} />
        <Route path={"/warranties"} component={Warranties} />
        <Route path={"/sales-history-demo"} component={SalesHistoryDemo} />
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
