import ExcelJS from "exceljs";

type ReportFile = {
  filename: string;
  base64: string;
  mimeType: string;
};

const EXCEL_MIME =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

const formatDateTime = (value: Date | string | null | undefined) => {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toISOString().replace("T", " ").replace("Z", "");
};

const formatDateForFilename = (date: Date = new Date()) =>
  date.toISOString().slice(0, 10).replace(/-/g, "");

const toBase64 = async (workbook: ExcelJS.Workbook) => {
  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer as ArrayBuffer).toString("base64");
};

export async function buildInventoryReport(rows: Array<Record<string, unknown>>): Promise<ReportFile> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Inventory");

  sheet.columns = [
    { header: "Part ID", key: "id", width: 10 },
    { header: "SKU", key: "sku", width: 18 },
    { header: "Name", key: "name", width: 28 },
    { header: "Line Code", key: "lineCode", width: 14 },
    { header: "Category", key: "categoryName", width: 18 },
    { header: "Supplier", key: "supplierName", width: 18 },
    { header: "Description", key: "description", width: 30 },
    { header: "Stock Qty", key: "stockQuantity", width: 12 },
    { header: "Min Stock", key: "minStockThreshold", width: 12 },
    { header: "Order Point", key: "orderPoint", width: 12 },
    { header: "Order Qty", key: "orderQty", width: 12 },
    { header: "Order Multiple", key: "orderMultiple", width: 14 },
    { header: "List Price", key: "listPrice", width: 12 },
    { header: "Cost", key: "cost", width: 12 },
    { header: "Retail", key: "retail", width: 12 },
    { header: "Repl Cost", key: "replCost", width: 12 },
    { header: "Avg Cost", key: "avgCost", width: 12 },
    { header: "Price 1", key: "price1", width: 12 },
    { header: "Price 2", key: "price2", width: 12 },
    { header: "Price 3", key: "price3", width: 12 },
    { header: "Core Cost", key: "coreCost", width: 12 },
    { header: "Core Retail", key: "coreRetail", width: 12 },
    { header: "Unit Price", key: "unitPrice", width: 12 },
    { header: "Stocking Unit", key: "stockingUnit", width: 12 },
    { header: "Purchase Unit", key: "purchaseUnit", width: 12 },
    { header: "Unit", key: "unit", width: 10 },
    { header: "Manufacturer", key: "manufacturer", width: 18 },
    { header: "Mfg Part #", key: "mfgPartNumber", width: 16 },
    { header: "Weight", key: "weight", width: 10 },
    { header: "Archived", key: "isArchived", width: 10 },
    { header: "Created At", key: "createdAt", width: 20 },
    { header: "Updated At", key: "updatedAt", width: 20 },
  ];

  rows.forEach(row => {
    sheet.addRow({
      ...row,
      isArchived: row.isArchived ? "Yes" : "No",
      createdAt: formatDateTime(row.createdAt as Date | string | null),
      updatedAt: formatDateTime(row.updatedAt as Date | string | null),
    });
  });

  return {
    filename: `inventory-report-${formatDateForFilename()}.xlsx`,
    base64: await toBase64(workbook),
    mimeType: EXCEL_MIME,
  };
}

export async function buildPurchaseReport(data: {
  orders: Array<Record<string, unknown>>;
  items: Array<Record<string, unknown>>;
}): Promise<ReportFile> {
  const workbook = new ExcelJS.Workbook();
  const ordersSheet = workbook.addWorksheet("Orders");
  const itemsSheet = workbook.addWorksheet("Items");

  ordersSheet.columns = [
    { header: "Order Number", key: "orderNumber", width: 20 },
    { header: "Supplier", key: "supplierName", width: 18 },
    { header: "Order Date", key: "orderDate", width: 20 },
    { header: "Type", key: "type", width: 10 },
    { header: "Status", key: "status", width: 12 },
    { header: "Total Amount", key: "totalAmount", width: 14 },
    { header: "Notes", key: "notes", width: 30 },
    { header: "Created By", key: "createdByName", width: 16 },
    { header: "Created At", key: "createdAt", width: 20 },
  ];

  data.orders.forEach(order => {
    ordersSheet.addRow({
      ...order,
      orderDate: formatDateTime(order.orderDate as Date | string | null),
      createdAt: formatDateTime(order.createdAt as Date | string | null),
    });
  });

  itemsSheet.columns = [
    { header: "Order Number", key: "orderNumber", width: 20 },
    { header: "Supplier", key: "supplierName", width: 18 },
    { header: "Part SKU", key: "partSku", width: 16 },
    { header: "Part Name", key: "partName", width: 26 },
    { header: "Line Code", key: "lineCode", width: 12 },
    { header: "Quantity", key: "quantity", width: 10 },
    { header: "Unit Price", key: "unitPrice", width: 12 },
    { header: "Subtotal", key: "subtotal", width: 12 },
    { header: "Created At", key: "createdAt", width: 20 },
  ];

  data.items.forEach(item => {
    itemsSheet.addRow({
      ...item,
      createdAt: formatDateTime(item.createdAt as Date | string | null),
    });
  });

  return {
    filename: `purchase-report-${formatDateForFilename()}.xlsx`,
    base64: await toBase64(workbook),
    mimeType: EXCEL_MIME,
  };
}

export async function buildSalesReport(data: {
  invoices: Array<Record<string, unknown>>;
  items: Array<Record<string, unknown>>;
}): Promise<ReportFile> {
  const workbook = new ExcelJS.Workbook();
  const invoicesSheet = workbook.addWorksheet("Invoices");
  const itemsSheet = workbook.addWorksheet("Items");

  invoicesSheet.columns = [
    { header: "Invoice Number", key: "invoiceNumber", width: 20 },
    { header: "Customer", key: "customerName", width: 18 },
    { header: "Invoice Date", key: "invoiceDate", width: 20 },
    { header: "Type", key: "type", width: 10 },
    { header: "Status", key: "status", width: 12 },
    { header: "Total Amount", key: "totalAmount", width: 14 },
    { header: "Notes", key: "notes", width: 30 },
    { header: "Created By", key: "createdByName", width: 16 },
    { header: "Created At", key: "createdAt", width: 20 },
  ];

  data.invoices.forEach(invoice => {
    invoicesSheet.addRow({
      ...invoice,
      invoiceDate: formatDateTime(invoice.invoiceDate as Date | string | null),
      createdAt: formatDateTime(invoice.createdAt as Date | string | null),
    });
  });

  itemsSheet.columns = [
    { header: "Invoice Number", key: "invoiceNumber", width: 20 },
    { header: "Customer", key: "customerName", width: 18 },
    { header: "Part SKU", key: "partSku", width: 16 },
    { header: "Part Name", key: "partName", width: 26 },
    { header: "Line Code", key: "lineCode", width: 12 },
    { header: "Quantity", key: "quantity", width: 10 },
    { header: "Unit Price", key: "unitPrice", width: 12 },
    { header: "Subtotal", key: "subtotal", width: 12 },
    { header: "Created At", key: "createdAt", width: 20 },
  ];

  data.items.forEach(item => {
    itemsSheet.addRow({
      ...item,
      createdAt: formatDateTime(item.createdAt as Date | string | null),
    });
  });

  return {
    filename: `sales-report-${formatDateForFilename()}.xlsx`,
    base64: await toBase64(workbook),
    mimeType: EXCEL_MIME,
  };
}
