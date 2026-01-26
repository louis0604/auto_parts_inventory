ALTER TABLE `parts` ADD `listPrice` decimal(15,2);--> statement-breakpoint
ALTER TABLE `parts` ADD `cost` decimal(15,2);--> statement-breakpoint
ALTER TABLE `parts` ADD `retail` decimal(15,2);--> statement-breakpoint
ALTER TABLE `parts` ADD `coreCost` decimal(15,2);--> statement-breakpoint
ALTER TABLE `parts` ADD `coreRetail` decimal(15,2);--> statement-breakpoint
ALTER TABLE `parts` ADD `orderQty` int DEFAULT 0;--> statement-breakpoint
ALTER TABLE `parts` ADD `orderMultiple` int DEFAULT 1;--> statement-breakpoint
ALTER TABLE `parts` ADD `stockingUnit` varchar(20) DEFAULT 'EA';--> statement-breakpoint
ALTER TABLE `parts` ADD `purchaseUnit` varchar(20) DEFAULT 'EA';--> statement-breakpoint
ALTER TABLE `parts` ADD `manufacturer` varchar(200);--> statement-breakpoint
ALTER TABLE `parts` ADD `mfgPartNumber` varchar(100);--> statement-breakpoint
ALTER TABLE `parts` ADD `weight` decimal(10,2);