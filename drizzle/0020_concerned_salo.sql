CREATE TABLE `part_vehicle_fitments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`partId` int NOT NULL,
	`vehicleEngineId` int,
	`yearFrom` int,
	`yearTo` int,
	`makeId` int,
	`modelId` int,
	`engineNote` varchar(200),
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `part_vehicle_fitments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `parts` ADD `partGroupId` int;--> statement-breakpoint
ALTER TABLE `part_vehicle_fitments` ADD CONSTRAINT `part_vehicle_fitments_partId_parts_id_fk` FOREIGN KEY (`partId`) REFERENCES `parts`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `part_vehicle_fitments` ADD CONSTRAINT `part_vehicle_fitments_vehicleEngineId_vehicle_engines_id_fk` FOREIGN KEY (`vehicleEngineId`) REFERENCES `vehicle_engines`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `part_vehicle_fitments` ADD CONSTRAINT `part_vehicle_fitments_makeId_vehicle_makes_id_fk` FOREIGN KEY (`makeId`) REFERENCES `vehicle_makes`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `part_vehicle_fitments` ADD CONSTRAINT `part_vehicle_fitments_modelId_vehicle_models_id_fk` FOREIGN KEY (`modelId`) REFERENCES `vehicle_models`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `parts` ADD CONSTRAINT `parts_partGroupId_part_groups_id_fk` FOREIGN KEY (`partGroupId`) REFERENCES `part_groups`(`id`) ON DELETE no action ON UPDATE no action;