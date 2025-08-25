PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_csv_import_loading_session` (
	`id` text(255) PRIMARY KEY NOT NULL,
	`instance_id` text(255) NOT NULL,
	`start_time` integer,
	`end_time` integer,
	`loadpoint` text(255),
	`vehicle` text(255),
	`energy` real,
	`duration` integer,
	`sun_percentage` real,
	`price` real,
	`price_per_kwh` real,
	`co2_per_kwh` real,
	`created_at` integer DEFAULT (unixepoch()),
	`updated_at` integer,
	`deleted_at` integer,
	FOREIGN KEY (`instance_id`) REFERENCES `instance`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_csv_import_loading_session`("id", "instance_id", "start_time", "end_time", "loadpoint", "vehicle", "energy", "duration", "sun_percentage", "price", "price_per_kwh", "co2_per_kwh", "created_at", "updated_at", "deleted_at") SELECT "id", "instance_id", "start_time", "end_time", "loadpoint", "vehicle", "energy", "duration", "sun_percentage", "price", "price_per_kwh", "co2_per_kwh", "created_at", "updated_at", "deleted_at" FROM `csv_import_loading_session`;--> statement-breakpoint
DROP TABLE `csv_import_loading_session`;--> statement-breakpoint
ALTER TABLE `__new_csv_import_loading_session` RENAME TO `csv_import_loading_session`;--> statement-breakpoint
PRAGMA foreign_keys=ON;