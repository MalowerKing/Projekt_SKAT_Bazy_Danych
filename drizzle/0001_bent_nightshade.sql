RENAME TABLE `Gra` TO `gra`;--> statement-breakpoint
RENAME TABLE `Lista Uczestników Turniej` TO `lista_uczestnikow_turniej`;--> statement-breakpoint
RENAME TABLE `Miejsca` TO `miejsca`;--> statement-breakpoint
RENAME TABLE `Turniej` TO `turniej`;--> statement-breakpoint
RENAME TABLE `Zaproszenia` TO `zaproszenia`;--> statement-breakpoint
ALTER TABLE `gra` RENAME COLUMN `GraID` TO `gra_id`;--> statement-breakpoint
ALTER TABLE `gra` RENAME COLUMN `GraczID 1` TO `gracz_id_1`;--> statement-breakpoint
ALTER TABLE `gra` RENAME COLUMN `GraczID 2` TO `gracz_id_2`;--> statement-breakpoint
ALTER TABLE `gra` RENAME COLUMN `GraczID 3` TO `gracz_id_3`;--> statement-breakpoint
ALTER TABLE `gra` RENAME COLUMN `Zwycięzca` TO `zwyciezca_id`;--> statement-breakpoint
ALTER TABLE `gra` RENAME COLUMN `Data` TO `data`;--> statement-breakpoint
ALTER TABLE `gra` RENAME COLUMN `MiejsceID` TO `miejsce_id`;--> statement-breakpoint
ALTER TABLE `gra` RENAME COLUMN `TurniejID` TO `turniej_id`;--> statement-breakpoint
ALTER TABLE `lista_uczestnikow_turniej` RENAME COLUMN `PrimeID` TO `prime_id`;--> statement-breakpoint
ALTER TABLE `lista_uczestnikow_turniej` RENAME COLUMN `TurniejID` TO `turniej_id`;--> statement-breakpoint
ALTER TABLE `lista_uczestnikow_turniej` RENAME COLUMN `GraczID` TO `gracz_id`;--> statement-breakpoint
ALTER TABLE `lista_uczestnikow_turniej` RENAME COLUMN `Miejsce` TO `miejsce`;--> statement-breakpoint
ALTER TABLE `miejsca` RENAME COLUMN `MiejscaID` TO `miejsca_id`;--> statement-breakpoint
ALTER TABLE `miejsca` RENAME COLUMN `Nazwa` TO `nazwa`;--> statement-breakpoint
ALTER TABLE `miejsca` RENAME COLUMN `Adres` TO `adres`;--> statement-breakpoint
ALTER TABLE `miejsca` RENAME COLUMN `Miasto` TO `miasto`;--> statement-breakpoint
ALTER TABLE `role` RENAME COLUMN `Uprawnienia` TO `uprawnienia`;--> statement-breakpoint
ALTER TABLE `turniej` RENAME COLUMN `TurniejID` TO `turniej_id`;--> statement-breakpoint
ALTER TABLE `turniej` RENAME COLUMN `Nazwa` TO `nazwa`;--> statement-breakpoint
ALTER TABLE `turniej` RENAME COLUMN `MiejsceID` TO `miejsce_id`;--> statement-breakpoint
ALTER TABLE `turniej` RENAME COLUMN `Data` TO `data`;--> statement-breakpoint
ALTER TABLE `turniej` RENAME COLUMN `TwórcaID` TO `tworca_id`;--> statement-breakpoint
ALTER TABLE `turniej` RENAME COLUMN `ZwycięzcaID` TO `zwyciezca_id`;--> statement-breakpoint
ALTER TABLE `user` RENAME COLUMN `Nazwa` TO `nazwa`;--> statement-breakpoint
ALTER TABLE `user` RENAME COLUMN `Role` TO `role_id`;--> statement-breakpoint
ALTER TABLE `user` RENAME COLUMN `ELO` TO `elo`;--> statement-breakpoint
ALTER TABLE `zaproszenia` RENAME COLUMN `PrimeID` TO `prime_id`;--> statement-breakpoint
ALTER TABLE `zaproszenia` RENAME COLUMN `GraczID` TO `gracz_id`;--> statement-breakpoint
ALTER TABLE `zaproszenia` RENAME COLUMN `TurniejID` TO `turniej_id`;--> statement-breakpoint
ALTER TABLE `gra` DROP FOREIGN KEY `Gra_GraczID 1_user_id_fk`;
--> statement-breakpoint
ALTER TABLE `gra` DROP FOREIGN KEY `Gra_GraczID 2_user_id_fk`;
--> statement-breakpoint
ALTER TABLE `gra` DROP FOREIGN KEY `Gra_GraczID 3_user_id_fk`;
--> statement-breakpoint
ALTER TABLE `gra` DROP FOREIGN KEY `Gra_Zwycięzca_user_id_fk`;
--> statement-breakpoint
ALTER TABLE `gra` DROP FOREIGN KEY `Gra_MiejsceID_Miejsca_MiejscaID_fk`;
--> statement-breakpoint
ALTER TABLE `gra` DROP FOREIGN KEY `Gra_TurniejID_Turniej_TurniejID_fk`;
--> statement-breakpoint
ALTER TABLE `lista_uczestnikow_turniej` DROP FOREIGN KEY `Lista Uczestników Turniej_TurniejID_Turniej_TurniejID_fk`;
--> statement-breakpoint
ALTER TABLE `lista_uczestnikow_turniej` DROP FOREIGN KEY `Lista Uczestników Turniej_GraczID_user_id_fk`;
--> statement-breakpoint
ALTER TABLE `turniej` DROP FOREIGN KEY `Turniej_MiejsceID_Miejsca_MiejscaID_fk`;
--> statement-breakpoint
ALTER TABLE `turniej` DROP FOREIGN KEY `Turniej_TwórcaID_user_id_fk`;
--> statement-breakpoint
ALTER TABLE `turniej` DROP FOREIGN KEY `Turniej_ZwycięzcaID_user_id_fk`;
--> statement-breakpoint
ALTER TABLE `user` DROP FOREIGN KEY `user_Role_role_id_fk`;
--> statement-breakpoint
ALTER TABLE `zaproszenia` DROP FOREIGN KEY `Zaproszenia_GraczID_user_id_fk`;
--> statement-breakpoint
ALTER TABLE `zaproszenia` DROP FOREIGN KEY `Zaproszenia_TurniejID_Turniej_TurniejID_fk`;
--> statement-breakpoint
ALTER TABLE `gra` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `lista_uczestnikow_turniej` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `miejsca` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `turniej` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `zaproszenia` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `gra` MODIFY COLUMN `gra_id` varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE `gra` MODIFY COLUMN `gracz_id_1` varchar(255);--> statement-breakpoint
ALTER TABLE `gra` MODIFY COLUMN `gracz_id_2` varchar(255);--> statement-breakpoint
ALTER TABLE `gra` MODIFY COLUMN `gracz_id_3` varchar(255);--> statement-breakpoint
ALTER TABLE `gra` MODIFY COLUMN `zwyciezca_id` varchar(255);--> statement-breakpoint
ALTER TABLE `gra` MODIFY COLUMN `miejsce_id` varchar(255);--> statement-breakpoint
ALTER TABLE `gra` MODIFY COLUMN `turniej_id` varchar(255);--> statement-breakpoint
ALTER TABLE `lista_uczestnikow_turniej` MODIFY COLUMN `prime_id` varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE `lista_uczestnikow_turniej` MODIFY COLUMN `turniej_id` varchar(255);--> statement-breakpoint
ALTER TABLE `lista_uczestnikow_turniej` MODIFY COLUMN `gracz_id` varchar(255);--> statement-breakpoint
ALTER TABLE `miejsca` MODIFY COLUMN `miejsca_id` varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE `turniej` MODIFY COLUMN `turniej_id` varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE `turniej` MODIFY COLUMN `miejsce_id` varchar(255);--> statement-breakpoint
ALTER TABLE `turniej` MODIFY COLUMN `tworca_id` varchar(255);--> statement-breakpoint
ALTER TABLE `turniej` MODIFY COLUMN `zwyciezca_id` varchar(255);--> statement-breakpoint
ALTER TABLE `user` MODIFY COLUMN `id` varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE `user` MODIFY COLUMN `role_id` varchar(255);--> statement-breakpoint
ALTER TABLE `zaproszenia` MODIFY COLUMN `prime_id` varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE `zaproszenia` MODIFY COLUMN `gracz_id` varchar(255);--> statement-breakpoint
ALTER TABLE `zaproszenia` MODIFY COLUMN `turniej_id` varchar(255);--> statement-breakpoint
ALTER TABLE `gra` ADD PRIMARY KEY(`gra_id`);--> statement-breakpoint
ALTER TABLE `lista_uczestnikow_turniej` ADD PRIMARY KEY(`prime_id`);--> statement-breakpoint
ALTER TABLE `miejsca` ADD PRIMARY KEY(`miejsca_id`);--> statement-breakpoint
ALTER TABLE `turniej` ADD PRIMARY KEY(`turniej_id`);--> statement-breakpoint
ALTER TABLE `zaproszenia` ADD PRIMARY KEY(`prime_id`);--> statement-breakpoint
ALTER TABLE `gra` ADD CONSTRAINT `gra_gracz_id_1_user_id_fk` FOREIGN KEY (`gracz_id_1`) REFERENCES `user`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `gra` ADD CONSTRAINT `gra_gracz_id_2_user_id_fk` FOREIGN KEY (`gracz_id_2`) REFERENCES `user`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `gra` ADD CONSTRAINT `gra_gracz_id_3_user_id_fk` FOREIGN KEY (`gracz_id_3`) REFERENCES `user`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `gra` ADD CONSTRAINT `gra_zwyciezca_id_user_id_fk` FOREIGN KEY (`zwyciezca_id`) REFERENCES `user`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `gra` ADD CONSTRAINT `gra_miejsce_id_miejsca_miejsca_id_fk` FOREIGN KEY (`miejsce_id`) REFERENCES `miejsca`(`miejsca_id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `gra` ADD CONSTRAINT `gra_turniej_id_turniej_turniej_id_fk` FOREIGN KEY (`turniej_id`) REFERENCES `turniej`(`turniej_id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `lista_uczestnikow_turniej` ADD CONSTRAINT `lista_uczestnikow_turniej_turniej_id_turniej_turniej_id_fk` FOREIGN KEY (`turniej_id`) REFERENCES `turniej`(`turniej_id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `lista_uczestnikow_turniej` ADD CONSTRAINT `lista_uczestnikow_turniej_gracz_id_user_id_fk` FOREIGN KEY (`gracz_id`) REFERENCES `user`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `turniej` ADD CONSTRAINT `turniej_miejsce_id_miejsca_miejsca_id_fk` FOREIGN KEY (`miejsce_id`) REFERENCES `miejsca`(`miejsca_id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `turniej` ADD CONSTRAINT `turniej_tworca_id_user_id_fk` FOREIGN KEY (`tworca_id`) REFERENCES `user`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `turniej` ADD CONSTRAINT `turniej_zwyciezca_id_user_id_fk` FOREIGN KEY (`zwyciezca_id`) REFERENCES `user`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `user` ADD CONSTRAINT `user_role_id_role_id_fk` FOREIGN KEY (`role_id`) REFERENCES `role`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `zaproszenia` ADD CONSTRAINT `zaproszenia_gracz_id_user_id_fk` FOREIGN KEY (`gracz_id`) REFERENCES `user`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `zaproszenia` ADD CONSTRAINT `zaproszenia_turniej_id_turniej_turniej_id_fk` FOREIGN KEY (`turniej_id`) REFERENCES `turniej`(`turniej_id`) ON DELETE no action ON UPDATE no action;