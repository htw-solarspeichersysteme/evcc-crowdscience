ALTER TABLE `instance` ADD `ignored` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `instance` DROP COLUMN `last_job_run`;