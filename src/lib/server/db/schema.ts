import { mysqlTable, int, varchar, datetime, time, boolean } from 'drizzle-orm/mysql-core';
import { relations } from 'drizzle-orm';

// --- ROLES ---

export const role = mysqlTable('role', {
    id: varchar('id', { length: 255 }).primaryKey(),
    uprawnienia: varchar('uprawnienia', { length: 255 })
});

export const roleRelations = relations(role, ({ many }) => ({
  gracze: many(user),
}));

// --- USER (GRACZ) ---

export const user = mysqlTable('user', {
    id: varchar('id', { length: 255 }).primaryKey(),
    nazwa: varchar('nazwa', { length: 32 }).notNull().unique(),
    email: varchar('email', { length: 255 }).notNull().unique(),
    passwordHash: varchar('password_hash', { length: 255 }).notNull(),
    role: varchar('role_id', { length: 255 }).references(() => role.id).default('#player#'),
    elo: int('elo').default(1000),
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

// --- SESSION ---

export const session = mysqlTable('session', {
    id: varchar('id', { length: 255 }).primaryKey(),
    userId: varchar('user_id', { length: 255 })
        .notNull()
        .references(() => user.id),
    expiresAt: datetime('expires_at').notNull()
});

// --- MIEJSCA ---

export const miejsca = mysqlTable('miejsca', {
  miejscaID: varchar('miejsca_id', { length: 255 }).primaryKey(),
  nazwa: varchar('nazwa', { length: 255 }),
  adres: varchar('adres', { length: 255 }),
  miasto: varchar('miasto', { length: 255 }),
});

export const miejscaRelations = relations(miejsca, ({ many }) => ({
  gry: many(gra),
  turnieje: many(turniej),
}));

// --- TURNIEJE ---

export const turniej = mysqlTable('turniej', {
  turniejID: varchar('turniej_id', { length: 255 }).primaryKey(),
  nazwa: varchar('nazwa', { length: 255 }),
  miejsceID: varchar('miejsce_id', { length: 255 }).references(() => miejsca.miejscaID),
  data: datetime('data'), 
  tworcaID: varchar('tworca_id', { length: 255 }).references(() => user.id),
  godzina: time('godzina'), 
  zwyciezcaID: varchar('zwyciezca_id', { length: 255 }).references(() => user.id),
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

// --- GRA ---

export const gra = mysqlTable('gra', {
  graID: varchar('gra_id', { length: 255 }).primaryKey(),
  graczID1: varchar('gracz_id_1', { length: 255 }).references(() => user.id),
  graczID2: varchar('gracz_id_2', { length: 255 }).references(() => user.id),
  graczID3: varchar('gracz_id_3', { length: 255 }).references(() => user.id),
  zwyciezca: varchar('zwyciezca_id', { length: 255 }).references(() => user.id),
  isRanked: boolean('is_ranked').default(false),
  data: datetime('data'), 
  miejsceID: varchar('miejsce_id', { length: 255 }).references(() => miejsca.miejscaID),
  turniejID: varchar('turniej_id', { length: 255 }).references(() => turniej.turniejID),
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

// --- ZAPROSZENIA ---

export const zaproszenia = mysqlTable('zaproszenia', {
  primeID: varchar('prime_id', { length: 255 }).primaryKey(),
  graczID: varchar('gracz_id', { length: 255 }).references(() => user.id),
  turniejID: varchar('turniej_id', { length: 255 }).references(() => turniej.turniejID),
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

// --- LISTA UCZESTNIKÓW ---

export const listaUczestnikowTurniej = mysqlTable('lista_uczestnikow_turniej', {
  primeID: varchar('prime_id', { length: 255 }).primaryKey(),
  turniejID: varchar('turniej_id', { length: 255 }).references(() => turniej.turniejID),
  graczID: varchar('gracz_id', { length: 255 }).references(() => user.id),
  miejsce: int('miejsce'), 
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

// --- TYPE EXPORTS ---

export type Session = typeof session.$inferSelect;
export type User = typeof user.$inferSelect;
export type Role = typeof role.$inferSelect;
export type Gra = typeof gra.$inferSelect;
export type Turniej = typeof turniej.$inferSelect;
export type Zaproszenia = typeof zaproszenia.$inferSelect;
export type Miejsca = typeof miejsca.$inferSelect;
export type ListaUczestnikowTurniej = typeof listaUczestnikowTurniej.$inferSelect;