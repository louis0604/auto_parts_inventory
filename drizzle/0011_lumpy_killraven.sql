ALTER TABLE `parts` ADD `replCost` decimal(15,2);--> statement-breakpoint
ALTER TABLE `parts` ADD `avgCost` decimal(15,2);--> statement-breakpoint
ALTER TABLE `parts` ADD `price1` decimal(15,2);--> statement-breakpoint
ALTER TABLE `parts` ADD `price2` decimal(15,2);--> statement-breakpoint
ALTER TABLE `parts` ADD `price3` decimal(15,2);--> statement-breakpoint
ALTER TABLE `parts` ADD `orderPoint` int DEFAULT 0;