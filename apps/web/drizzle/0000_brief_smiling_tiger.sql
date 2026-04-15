CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`password_hash` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);
--> statement-breakpoint
CREATE TABLE `settings` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `projects` (
	`id` text PRIMARY KEY NOT NULL,
	`slug` text NOT NULL,
	`name` text NOT NULL,
	`compose_dir` text NOT NULL,
	`status` text DEFAULT 'stopped' NOT NULL,
	`kong_host` text,
	`studio_host` text,
	`tls_enabled` integer DEFAULT true NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `projects_slug_unique` ON `projects` (`slug`);
--> statement-breakpoint
CREATE TABLE `audit_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`action` text NOT NULL,
	`detail` text,
	`user_id` text,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `cloud_storage` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`endpoint` text NOT NULL,
	`region` text,
	`bucket` text NOT NULL,
	`access_key_enc` text NOT NULL,
	`secret_key_enc` text NOT NULL,
	`use_ssl` integer DEFAULT true NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `tasks` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text,
	`type` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`payload` text,
	`result` text,
	`error` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `backups` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`schedule_cron` text,
	`retention_days` integer,
	`storage_id` text,
	`enabled` integer DEFAULT true NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE no action
);
