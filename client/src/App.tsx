import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import DashboardLayout from "./components/DashboardLayout";
import Dashboard from "./pages/Dashboard";
import PartsNew from "./pages/PartsNew";
import PartDetail from "./pages/PartDetail";
import PartHistory from "./pages/PartHistory";
import AddPart from "./pages/AddPart";
import { BulkImportPartsPage } from "./pages/BulkImportParts";
import LineCodes from "./pages/LineCodes";
import AddLineCode from "./pages/AddLineCode";
import EditLineCode from "./pages/EditLineCode";
import Suppliers from "./pages/Suppliers";
import AddSupplier from "./pages/AddSupplier";
import EditSupplier from "./pages/EditSupplier";
import Customers from "./pages/Customers";
import AddCustomer from "./pages/AddCustomer";
import EditCustomer from "./pages/EditCustomer";
import PurchaseOrders from "./pages/PurchaseOrders";
import SalesInvoices from "./pages/SalesInvoices";
import InventoryLedger from "./pages/InventoryLedger";
import AIRestocking from "./pages/AIRestocking";
import Credits from "./pages/Credits";
import Warranties from "./pages/Warranties";
import OperationHistory from "./pages/OperationHistory";

function Router() {
  return (
    <DashboardLayout>
      <Switch>
        <Route path={"/"} component={Dashboard} />
        <Route path={"/line-codes/add"} component={AddLineCode} />
        <Route path={"/line-codes/:id/edit"} component={EditLineCode} />
        <Route path={"/line-codes"} component={LineCodes} />
        <Route path={"/parts/import"} component={BulkImportPartsPage} />
        <Route path={"/parts/add"} component={AddPart} />
        <Route path={"/parts/:id/history"} component={PartHistory} />
        <Route path={"/parts/:id"} component={PartDetail} />
        <Route path={"/parts"} component={PartsNew} />
        <Route path={"/suppliers/add"} component={AddSupplier} />
        <Route path={"/suppliers/:id/edit"} component={EditSupplier} />
        <Route path={"/suppliers"} component={Suppliers} />
        <Route path={"/customers/add"} component={AddCustomer} />
        <Route path={"/customers/:id/edit"} component={EditCustomer} />
        <Route path={"/customers"} component={Customers} />
        <Route path={"/purchase-orders/:id"} component={PurchaseOrders} />
        <Route path={"/purchase-orders"} component={PurchaseOrders} />
        <Route path={"/sales-invoices/:id"} component={SalesInvoices} />
        <Route path={"/sales-invoices"} component={SalesInvoices} />
        <Route path={"/inventory-ledger"} component={InventoryLedger} />
        <Route path={"/credits/:id"} component={Credits} />
        <Route path={"/credits"} component={Credits} />
        <Route path={"/warranties/:id"} component={Warranties} />
        <Route path={"/warranties"} component={Warranties} />
        <Route path={"/operation-history/:partId?"} component={OperationHistory} />
        <Route path={"/operation-history"} component={OperationHistory} />
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
