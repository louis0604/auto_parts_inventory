CREATE TABLE `line_codes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(50) NOT NULL,
	`description` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `line_codes_id` PRIMARY KEY(`id`),
	CONSTRAINT `line_codes_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
ALTER TABLE `parts` DROP INDEX `parts_sku_unique`;--> statement-breakpoint
ALTER TABLE `parts` ADD `lineCodeId` int;--> statement-breakpoint
ALTER TABLE `parts` ADD CONSTRAINT `parts_lineCodeId_line_codes_id_fk` FOREIGN KEY (`lineCodeId`) REFERENCES `line_codes`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `parts` DROP COLUMN `lineCode`;