ALTER TABLE `parts` MODIFY COLUMN `sku` varchar(100) NOT NULL;--> statement-breakpoint
ALTER TABLE `parts` MODIFY COLUMN `name` varchar(200) NOT NULL;--> statement-breakpoint
ALTER TABLE `parts` MODIFY COLUMN `lineCodeId` int NOT NULL;--> statement-breakpoint
ALTER TABLE `parts` MODIFY COLUMN `retail` decimal(15,2) NOT NULL;--> statement-breakpoint
ALTER TABLE `parts` MODIFY COLUMN `replCost` decimal(15,2) NOT NULL;