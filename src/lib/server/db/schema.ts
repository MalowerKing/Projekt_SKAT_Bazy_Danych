import { mysqlTable, serial, int, varchar, datetime, time, boolean } from 'drizzle-orm/mysql-core';
import { relations } from 'drizzle-orm'

//user(gracz)

export const user = mysqlTable('user', {
	id: varchar('id', { length: 255 }).primaryKey(),
	age: int('age'),
	username: varchar('username', { length: 32 }).notNull().unique(),
	passwordHash: varchar('password_hash', { length: 255 }).notNull(),
	nazwa: varchar('Nazwa', { length: 255 }).notNull(),
	role: int('Role').references(() => role.id),
	elo: int('ELO').default(1000),
});

export const graczRelations = relations(user, ({ one, many }) => ({
  roleReference: one(role, {
    fields: [user.role],
    references: [role.id],
  }),
  // Relationships for games
  gryJakoGracz1: many(gra, { relationName: 'gracz1' }),
  gryJakoGracz2: many(gra, { relationName: 'gracz2' }),
  gryJakoGracz3: many(gra, { relationName: 'gracz3' }),
  gryWygrane: many(gra, { relationName: 'zwyciezcaGry' }),
  // Relationships for tournaments
  turniejeUtworzone: many(turniej, { relationName: 'tworcaTurnieju' }),
  turniejeWygrane: many(turniej, { relationName: 'zwyciezcaTurnieju' }),
  zaproszenia: many(zaproszenia),
  uczestnictwoWTurniejach: many(listaUczestnikowTurniej),
}));

//sesja

export const session = mysqlTable('session', {
	id: varchar('id', { length: 255 }).primaryKey(),
	userId: varchar('user_id', { length: 255 })
		.notNull()
		.references(() => user.id),
	expiresAt: datetime('expires_at').notNull()
});

//role i uprawnienia

export const role = mysqlTable('role', {
	id: varchar('id', { length: 255 }).primaryKey(),
	uprawnienia: varchar('Uprawnienia', { length: 255 })
});

export const roleRelations = relations(role, ({ many }) => ({
  gracze: many(user),
}));

//Miejsca

export const miejsca = mysqlTable('Miejsca', {
  miejscaID: int('MiejscaID').autoincrement().primaryKey(),
  nazwa: varchar('Nazwa', { length: 255 }),
  adres: varchar('Adres', { length: 255 }),
  miasto: varchar('Miasto', { length: 255 }),
});

export const miejscaRelations = relations(miejsca, ({ many }) => ({
  gry: many(gra),
  turnieje: many(turniej),
}));

//Turnieje

export const turniej = mysqlTable('Turniej', {
  turniejID: int('TurniejID').autoincrement().primaryKey(),
  nazwa: varchar('Nazwa', { length: 255 }),
  miejsceID: int('MiejsceID').references(() => miejsca.miejscaID),
  data: datetime('Data'), 
  tworcaID: int('TwórcaID').references(() => user.id),
  godzina: time(), 
  zwyciezcaID: int('ZwycięzcaID').references(() => user.id),
});

export const turniejRelations = relations(turniej, ({ one, many }) => ({
  miejsce: one(miejsca, {
    fields: [turniej.miejsceID],
    references: [miejsca.miejscaID],
  }),
  tworca: one(user, {
    fields: [turniej.tworcaID],
    references: [user.id],
    relationName: 'tworcaTurnieju',
  }),
  zwyciezca: one(user, {
    fields: [turniej.zwyciezcaID],
    references: [user.id],
    relationName: 'zwyciezcaTurnieju',
  }),
  gry: many(gra),
  zaproszenia: many(zaproszenia),
  uczestnicy: many(listaUczestnikowTurniej),
}));

//Gra

export const gra = mysqlTable('Gra', {
  graID: int('GraID').autoincrement().primaryKey(),
  // Note: Drizzle will handle the escaping of column names with spaces automatically
  graczID1: int('GraczID 1').references(() => user.id),
  graczID2: int('GraczID 2').references(() => user.id),
  graczID3: int('GraczID 3').references(() => user.id),
  zwyciezca: int('Zwycięzca').references(() => user.id),
  isRanked: boolean('is_ranked').default(false),
  data: time('Data'), 
  miejsceID: int('MiejsceID').references(() => miejsca.miejscaID),
  turniejID: int('TurniejID').references(() => turniej.turniejID),
});

export const graRelations = relations(gra, ({ one }) => ({
  gracz1: one(user, {
    fields: [gra.graczID1],
    references: [user.id],
    relationName: 'gracz1',
  }),
  gracz2: one(user, {
    fields: [gra.graczID2],
    references: [user.id],
    relationName: 'gracz2',
  }),
  gracz3: one(user, {
    fields: [gra.graczID3],
    references: [user.id],
    relationName: 'gracz3',
  }),
  wygrany: one(user, {
    fields: [gra.zwyciezca],
    references: [user.id],
    relationName: 'zwyciezcaGry',
  }),
  miejsce: one(miejsca, {
    fields: [gra.miejsceID],
    references: [miejsca.miejscaID],
  }),
  turniej: one(turniej, {
    fields: [gra.turniejID],
    references: [turniej.turniejID],
  }),
}));

//Zaproszenia

export const zaproszenia = mysqlTable('Zaproszenia', {
  primeID: int('PrimeID').autoincrement().primaryKey(),
  graczID: int('GraczID').references(() => user.id),
  turniejID: int('TurniejID').references(() => turniej.turniejID),
});

export const zaproszeniaRelations = relations(zaproszenia, ({ one }) => ({
  gracz: one(user, {
    fields: [zaproszenia.graczID],
    references: [user.id],
  }),
  turniej: one(turniej, {
    fields: [zaproszenia.turniejID],
    references: [turniej.turniejID],
  }),
}));

//Lista uczestników

export const listaUczestnikowTurniej = mysqlTable('Lista Uczestników Turniej', {
  primeID: int('PrimeID').autoincrement().primaryKey(),
  turniejID: int('TurniejID').references(() => turniej.turniejID),
  graczID: int('GraczID').references(() => user.id),
  miejsce: int('Miejsce'), 
});

export const listaUczestnikowRelations = relations(listaUczestnikowTurniej, ({ one }) => ({
  turniej: one(turniej, {
    fields: [listaUczestnikowTurniej.turniejID],
    references: [turniej.turniejID],
  }),
  gracz: one(user, {
    fields: [listaUczestnikowTurniej.graczID],
    references: [user.id],
  }),
}));

export type Session = typeof session.$inferSelect;
export type User = typeof user.$inferSelect;
export type gra = typeof gra.$inferSelect
export type turniej = typeof turniej.$inferSelect
export type zaproszenia = typeof zaproszenia.$inferSelect
export type miejsca = typeof miejsca.$inferSelect


