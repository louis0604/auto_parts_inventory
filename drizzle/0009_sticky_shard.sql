CREATE TABLE `credit_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`creditId` int NOT NULL,
	`partId` int NOT NULL,
	`quantity` int NOT NULL,
	`unitPrice` decimal(15,2) NOT NULL,
	`subtotal` decimal(15,2) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `credit_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `credits` (
	`id` int AUTO_INCREMENT NOT NULL,
	`creditNumber` varchar(100) NOT NULL,
	`customerId` int NOT NULL,
	`customerNumber` varchar(50),
	`creditDate` timestamp NOT NULL DEFAULT (now()),
	`creditTime` varchar(10),
	`originalInvoiceId` int,
	`originalInvoiceNumber` varchar(100),
	`totalAmount` decimal(15,2) NOT NULL,
	`status` enum('pending','completed','cancelled') NOT NULL DEFAULT 'pending',
	`reason` text,
	`notes` text,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `credits_id` PRIMARY KEY(`id`),
	CONSTRAINT `credits_creditNumber_unique` UNIQUE(`creditNumber`)
);
--> statement-breakpoint
CREATE TABLE `warranties` (
	`id` int AUTO_INCREMENT NOT NULL,
	`warrantyNumber` varchar(100) NOT NULL,
	`customerId` int NOT NULL,
	`customerNumber` varchar(50),
	`warrantyDate` timestamp NOT NULL DEFAULT (now()),
	`warrantyTime` varchar(10),
	`originalInvoiceId` int,
	`originalInvoiceNumber` varchar(100),
	`totalAmount` decimal(15,2) NOT NULL,
	`status` enum('pending','approved','rejected','completed') NOT NULL DEFAULT 'pending',
	`claimReason` text,
	`notes` text,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `warranties_id` PRIMARY KEY(`id`),
	CONSTRAINT `warranties_warrantyNumber_unique` UNIQUE(`warrantyNumber`)
);
--> statement-breakpoint
CREATE TABLE `warranty_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`warrantyId` int NOT NULL,
	`partId` int NOT NULL,
	`quantity` int NOT NULL,
	`unitPrice` decimal(15,2) NOT NULL,
	`subtotal` decimal(15,2) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `warranty_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `inventory_ledger` MODIFY COLUMN `transactionType` enum('purchase','sale','credit','warranty','adjustment') NOT NULL;--> statement-breakpoint
ALTER TABLE `credit_items` ADD CONSTRAINT `credit_items_creditId_credits_id_fk` FOREIGN KEY (`creditId`) REFERENCES `credits`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `credit_items` ADD CONSTRAINT `credit_items_partId_parts_id_fk` FOREIGN KEY (`partId`) REFERENCES `parts`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `credits` ADD CONSTRAINT `credits_customerId_customers_id_fk` FOREIGN KEY (`customerId`) REFERENCES `customers`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `credits` ADD CONSTRAINT `credits_originalInvoiceId_sales_invoices_id_fk` FOREIGN KEY (`originalInvoiceId`) REFERENCES `sales_invoices`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `credits` ADD CONSTRAINT `credits_createdBy_users_id_fk` FOREIGN KEY (`createdBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `warranties` ADD CONSTRAINT `warranties_customerId_customers_id_fk` FOREIGN KEY (`customerId`) REFERENCES `customers`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `warranties` ADD CONSTRAINT `warranties_originalInvoiceId_sales_invoices_id_fk` FOREIGN KEY (`originalInvoiceId`) REFERENCES `sales_invoices`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `warranties` ADD CONSTRAINT `warranties_createdBy_users_id_fk` FOREIGN KEY (`createdBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `warranty_items` ADD CONSTRAINT `warranty_items_warrantyId_warranties_id_fk` FOREIGN KEY (`warrantyId`) REFERENCES `warranties`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `warranty_items` ADD CONSTRAINT `warranty_items_partId_parts_id_fk` FOREIGN KEY (`partId`) REFERENCES `parts`(`id`) ON DELETE no action ON UPDATE no action;