ALTER TABLE `user` DROP INDEX `user_username_unique`;--> statement-breakpoint
ALTER TABLE `gra` MODIFY COLUMN `data` datetime;--> statement-breakpoint
ALTER TABLE `user` MODIFY COLUMN `nazwa` varchar(32) NOT NULL;--> statement-breakpoint
ALTER TABLE `user` MODIFY COLUMN `role_id` varchar(255) DEFAULT '#player#';--> statement-breakpoint
ALTER TABLE `user` ADD `email` varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE `user` ADD CONSTRAINT `user_nazwa_unique` UNIQUE(`nazwa`);--> statement-breakpoint
ALTER TABLE `user` ADD CONSTRAINT `user_email_unique` UNIQUE(`email`);--> statement-breakpoint
ALTER TABLE `user` DROP COLUMN `age`;--> statement-breakpoint
ALTER TABLE `user` DROP COLUMN `username`;