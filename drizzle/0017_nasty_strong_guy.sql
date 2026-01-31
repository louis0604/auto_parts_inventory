ALTER TABLE `parts` MODIFY COLUMN `sku` varchar(100);--> statement-breakpoint
ALTER TABLE `parts` MODIFY COLUMN `name` varchar(200);--> statement-breakpoint
ALTER TABLE `parts` MODIFY COLUMN `lineCodeId` int;--> statement-breakpoint
ALTER TABLE `parts` MODIFY COLUMN `retail` decimal(15,2);--> statement-breakpoint
ALTER TABLE `parts` MODIFY COLUMN `replCost` decimal(15,2);--> statement-breakpoint
ALTER TABLE `parts` MODIFY COLUMN `unitPrice` decimal(15,2);--> statement-breakpoint
ALTER TABLE `parts` MODIFY COLUMN `stockQuantity` int;--> statement-breakpoint
ALTER TABLE `parts` MODIFY COLUMN `minStockThreshold` int DEFAULT 10;--> statement-breakpoint
ALTER TABLE `parts` MODIFY COLUMN `unit` varchar(50) DEFAULT '件';--> statement-breakpoint
ALTER TABLE `parts` MODIFY COLUMN `isArchived` boolean;