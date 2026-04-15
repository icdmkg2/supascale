CREATE TABLE `task_schedules` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text,
	`name` text NOT NULL,
	`enabled` integer DEFAULT true NOT NULL,
	`kind` text NOT NULL,
	`schedule_cron` text NOT NULL,
	`timezone` text DEFAULT 'UTC' NOT NULL,
	`config` text,
	`last_status` text,
	`last_run_at` integer,
	`next_run_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON DELETE CASCADE ON UPDATE no action
);
