CREATE TABLE `part_groups` (
	`id` int AUTO_INCREMENT NOT NULL,
	`categoryId` int NOT NULL,
	`name` varchar(100) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `part_groups_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `vehicle_engines` (
	`id` int AUTO_INCREMENT NOT NULL,
	`year` int NOT NULL,
	`makeId` int NOT NULL,
	`modelId` int NOT NULL,
	`engineCode` varchar(50),
	`displacement` varchar(50),
	`cylinders` int,
	`fuelType` varchar(30),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `vehicle_engines_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `vehicle_makes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `vehicle_makes_id` PRIMARY KEY(`id`),
	CONSTRAINT `vehicle_makes_name_unique` UNIQUE(`name`)
);
--> statement-breakpoint
CREATE TABLE `vehicle_models` (
	`id` int AUTO_INCREMENT NOT NULL,
	`makeId` int NOT NULL,
	`name` varchar(100) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `vehicle_models_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `sales_invoice_items` ADD `codes` varchar(50);--> statement-breakpoint
ALTER TABLE `sales_invoice_items` ADD `suggPrice` decimal(15,2);--> statement-breakpoint
ALTER TABLE `sales_invoices` ADD `poNumber` varchar(100);--> statement-breakpoint
ALTER TABLE `sales_invoices` ADD `jobNumber` varchar(100);--> statement-breakpoint
ALTER TABLE `sales_invoices` ADD `ref` varchar(200);--> statement-breakpoint
ALTER TABLE `sales_invoices` ADD `vehicleYear` int;--> statement-breakpoint
ALTER TABLE `sales_invoices` ADD `vehicleMake` varchar(100);--> statement-breakpoint
ALTER TABLE `sales_invoices` ADD `vehicleModel` varchar(100);--> statement-breakpoint
ALTER TABLE `sales_invoices` ADD `vehicleEngine` varchar(100);--> statement-breakpoint
ALTER TABLE `sales_invoices` ADD `vehicleVin` varchar(50);--> statement-breakpoint
ALTER TABLE `part_groups` ADD CONSTRAINT `part_groups_categoryId_part_categories_id_fk` FOREIGN KEY (`categoryId`) REFERENCES `part_categories`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `vehicle_engines` ADD CONSTRAINT `vehicle_engines_makeId_vehicle_makes_id_fk` FOREIGN KEY (`makeId`) REFERENCES `vehicle_makes`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `vehicle_engines` ADD CONSTRAINT `vehicle_engines_modelId_vehicle_models_id_fk` FOREIGN KEY (`modelId`) REFERENCES `vehicle_models`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `vehicle_models` ADD CONSTRAINT `vehicle_models_makeId_vehicle_makes_id_fk` FOREIGN KEY (`makeId`) REFERENCES `vehicle_makes`(`id`) ON DELETE cascade ON UPDATE no action;