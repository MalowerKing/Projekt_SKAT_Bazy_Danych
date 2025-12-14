CREATE TABLE `Gra` (
	`GraID` int AUTO_INCREMENT NOT NULL,
	`GraczID 1` int,
	`GraczID 2` int,
	`GraczID 3` int,
	`Zwycięzca` int,
	`is_ranked` boolean DEFAULT false,
	`Data` time,
	`MiejsceID` int,
	`TurniejID` int,
	CONSTRAINT `Gra_GraID` PRIMARY KEY(`GraID`)
);
--> statement-breakpoint
CREATE TABLE `Lista Uczestników Turniej` (
	`PrimeID` int AUTO_INCREMENT NOT NULL,
	`TurniejID` int,
	`GraczID` int,
	`Miejsce` int,
	CONSTRAINT `Lista Uczestników Turniej_PrimeID` PRIMARY KEY(`PrimeID`)
);
--> statement-breakpoint
CREATE TABLE `Miejsca` (
	`MiejscaID` int AUTO_INCREMENT NOT NULL,
	`Nazwa` varchar(255),
	`Adres` varchar(255),
	`Miasto` varchar(255),
	CONSTRAINT `Miejsca_MiejscaID` PRIMARY KEY(`MiejscaID`)
);
--> statement-breakpoint
CREATE TABLE `role` (
	`id` varchar(255) NOT NULL,
	`Uprawnienia` varchar(255),
	CONSTRAINT `role_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `session` (
	`id` varchar(255) NOT NULL,
	`user_id` varchar(255) NOT NULL,
	`expires_at` datetime NOT NULL,
	CONSTRAINT `session_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `Turniej` (
	`TurniejID` int AUTO_INCREMENT NOT NULL,
	`Nazwa` varchar(255),
	`MiejsceID` int,
	`Data` datetime,
	`TwórcaID` int,
	`godzina` time,
	`ZwycięzcaID` int,
	CONSTRAINT `Turniej_TurniejID` PRIMARY KEY(`TurniejID`)
);
--> statement-breakpoint
CREATE TABLE `user` (
	`id` int AUTO_INCREMENT NOT NULL,
	`age` int,
	`username` varchar(32) NOT NULL,
	`password_hash` varchar(255) NOT NULL,
	`Nazwa` varchar(255) NOT NULL,
	`Role` int,
	`ELO` int DEFAULT 1000,
	CONSTRAINT `user_id` PRIMARY KEY(`id`),
	CONSTRAINT `user_username_unique` UNIQUE(`username`)
);
--> statement-breakpoint
CREATE TABLE `Zaproszenia` (
	`PrimeID` int AUTO_INCREMENT NOT NULL,
	`GraczID` int,
	`TurniejID` int,
	CONSTRAINT `Zaproszenia_PrimeID` PRIMARY KEY(`PrimeID`)
);
--> statement-breakpoint
ALTER TABLE `Gra` ADD CONSTRAINT `Gra_GraczID 1_user_id_fk` FOREIGN KEY (`GraczID 1`) REFERENCES `user`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `Gra` ADD CONSTRAINT `Gra_GraczID 2_user_id_fk` FOREIGN KEY (`GraczID 2`) REFERENCES `user`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `Gra` ADD CONSTRAINT `Gra_GraczID 3_user_id_fk` FOREIGN KEY (`GraczID 3`) REFERENCES `user`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `Gra` ADD CONSTRAINT `Gra_Zwycięzca_user_id_fk` FOREIGN KEY (`Zwycięzca`) REFERENCES `user`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `Gra` ADD CONSTRAINT `Gra_MiejsceID_Miejsca_MiejscaID_fk` FOREIGN KEY (`MiejsceID`) REFERENCES `Miejsca`(`MiejscaID`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `Gra` ADD CONSTRAINT `Gra_TurniejID_Turniej_TurniejID_fk` FOREIGN KEY (`TurniejID`) REFERENCES `Turniej`(`TurniejID`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `Lista Uczestników Turniej` ADD CONSTRAINT `Lista Uczestników Turniej_TurniejID_Turniej_TurniejID_fk` FOREIGN KEY (`TurniejID`) REFERENCES `Turniej`(`TurniejID`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `Lista Uczestników Turniej` ADD CONSTRAINT `Lista Uczestników Turniej_GraczID_user_id_fk` FOREIGN KEY (`GraczID`) REFERENCES `user`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `session` ADD CONSTRAINT `session_user_id_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `Turniej` ADD CONSTRAINT `Turniej_MiejsceID_Miejsca_MiejscaID_fk` FOREIGN KEY (`MiejsceID`) REFERENCES `Miejsca`(`MiejscaID`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `Turniej` ADD CONSTRAINT `Turniej_TwórcaID_user_id_fk` FOREIGN KEY (`TwórcaID`) REFERENCES `user`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `Turniej` ADD CONSTRAINT `Turniej_ZwycięzcaID_user_id_fk` FOREIGN KEY (`ZwycięzcaID`) REFERENCES `user`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `user` ADD CONSTRAINT `user_Role_role_id_fk` FOREIGN KEY (`Role`) REFERENCES `role`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `Zaproszenia` ADD CONSTRAINT `Zaproszenia_GraczID_user_id_fk` FOREIGN KEY (`GraczID`) REFERENCES `user`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `Zaproszenia` ADD CONSTRAINT `Zaproszenia_TurniejID_Turniej_TurniejID_fk` FOREIGN KEY (`TurniejID`) REFERENCES `Turniej`(`TurniejID`) ON DELETE no action ON UPDATE no action;