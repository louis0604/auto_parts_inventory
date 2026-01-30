ALTER TABLE `parts` ADD `isArchived` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `parts` ADD `archivedAt` timestamp;