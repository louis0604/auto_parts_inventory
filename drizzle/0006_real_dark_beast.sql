ALTER TABLE `purchase_orders` ADD `orderTime` varchar(10);--> statement-breakpoint
ALTER TABLE `purchase_orders` ADD `type` enum('purchase','return') DEFAULT 'purchase' NOT NULL;--> statement-breakpoint
ALTER TABLE `sales_invoices` ADD `customerNumber` varchar(50);--> statement-breakpoint
ALTER TABLE `sales_invoices` ADD `invoiceTime` varchar(10);--> statement-breakpoint
ALTER TABLE `sales_invoices` ADD `type` enum('invoice','return','credit') DEFAULT 'invoice' NOT NULL;