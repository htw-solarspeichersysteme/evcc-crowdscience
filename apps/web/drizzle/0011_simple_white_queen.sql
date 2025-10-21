PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_csv_import_loading_session` (
	`id` text(255) PRIMARY KEY NOT NULL,
	`instance_id` text(255) NOT NULL,
	`start_time` integer NOT NULL,
	`end_time` integer NOT NULL,
	`start_kwh` real,
	`end_kwh` real,
	`kilometers` real,
	`loadpoint` text(255),
	`vehicle` text(255),
	`energy` real,
	`duration` integer,
	`sun_percentage` real,
	`price` real,
	`price_per_kwh` real,
	`co2_per_kwh` real,
	`line_hash` text(255) NOT NULL,
	`created_at` integer DEFAULT (unixepoch()),
	`updated_at` integer,
	`deleted_at` integer,
	FOREIGN KEY (`instance_id`) REFERENCES `instance`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_csv_import_loading_session`("id", "instance_id", "start_time", "end_time", "start_kwh", "end_kwh", "kilometers", "loadpoint", "vehicle", "energy", "duration", "sun_percentage", "price", "price_per_kwh", "co2_per_kwh", "line_hash", "created_at", "updated_at", "deleted_at") SELECT "id", "instance_id", "start_time", "end_time", "start_kwh", "end_kwh", "kilometers", "loadpoint", "vehicle", "energy", "duration", "sun_percentage", "price", "price_per_kwh", "co2_per_kwh", "line_hash", "created_at", "updated_at", "deleted_at" FROM `csv_import_loading_session`;--> statement-breakpoint
DROP TABLE `csv_import_loading_session`;--> statement-breakpoint
ALTER TABLE `__new_csv_import_loading_session` RENAME TO `csv_import_loading_session`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `csv_import_loading_session_line_hash_unique` ON `csv_import_loading_session` (`line_hash`);--> statement-breakpoint
ALTER TABLE `instance` ADD `public_name` text(255);--> statement-breakpoint
CREATE UNIQUE INDEX `public_name_idx` ON `instance` (`public_name`);