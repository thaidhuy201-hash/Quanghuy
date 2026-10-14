CREATE TABLE `closings` (
	`id` text PRIMARY KEY NOT NULL,
	`day` text NOT NULL,
	`opening` integer NOT NULL,
	`actual` integer NOT NULL,
	`expected` integer NOT NULL,
	`username` text NOT NULL,
	`created` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `records` (
	`id` text PRIMARY KEY NOT NULL,
	`day` text NOT NULL,
	`type` text NOT NULL,
	`method` text NOT NULL,
	`amount` integer NOT NULL,
	`note` text NOT NULL,
	`username` text NOT NULL,
	`created` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `sessions` (
	`token` text PRIMARY KEY NOT NULL,
	`username` text NOT NULL,
	`expires` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `users` (
	`username` text PRIMARY KEY NOT NULL,
	`hash` text NOT NULL,
	`salt` text NOT NULL,
	`role` text NOT NULL,
	`active` integer DEFAULT 1 NOT NULL
);
