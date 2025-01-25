import { relations, sql } from "drizzle-orm";
import { int, integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

function createIdType(title = "id", primaryKey = true) {
  const type = text(title, { length: 255 })
    .notNull()
    .$defaultFn(() => crypto.randomUUID());

  return primaryKey ? type.primaryKey() : type;
}

const timestamps = {
  createdAt: int("created_at", { mode: "timestamp" }).default(
    sql`(unixepoch())`,
  ),
  updatedAt: int("updated_at", { mode: "timestamp" }).$onUpdate(
    () => new Date(),
  ),
  deletedAt: int("deleted_at", { mode: "timestamp" }),
};

export const users = sqliteTable("user", {
  id: createIdType(),
  email: text("email", { length: 255 }).notNull().unique(),
  isAdmin: integer("is_admin", { mode: "boolean" }).default(false).notNull(),
  firstName: text("first_name", { length: 255 }).notNull(),
  lastName: text("last_name", { length: 255 }).notNull(),
  passwordHash: text("password_hash", { length: 255 }).notNull(),
  ...timestamps,
});

export const userRelations = relations(users, ({ many }) => ({
  dashboard: many(dashboard),
  apiTokens: many(apiTokens),
}));

export const dashboard = sqliteTable("dashboard", {
  id: createIdType(),
  userId: createIdType("user_id", false)
    .notNull()
    .references(() => users.id),
  ...timestamps,
});

export const dashboardRelations = relations(dashboard, ({ one }) => ({
  user: one(users, {
    fields: [dashboard.userId],
    references: [users.id],
  }),
}));

export const apiTokens = sqliteTable("api_token", {
  id: createIdType(),
  userId: createIdType("user_id", false)
    .notNull()
    .references(() => users.id),
  ...timestamps,
});

export const apiTokenRelations = relations(apiTokens, ({ one }) => ({
  user: one(users, {
    fields: [apiTokens.userId],
    references: [users.id],
  }),
}));

export const instances = sqliteTable("instance", {
  id: createIdType(),
  bucket: text("bucket", { length: 255 }),
  ...timestamps,
});

export const csvImportLoadingSessions = sqliteTable(
  "csv_import_loading_session",
  {
    id: createIdType(),
    instanceId: createIdType("instance_id", false)
      .notNull()
      .references(() => instances.id),
    startTime: int("start_time", { mode: "timestamp" }),
    endTime: int("end_time", { mode: "timestamp" }),
    loadpoint: text("loadpoint", { length: 255 }),
    vehicle: text("vehicle", { length: 255 }),
    energy: real("energy"),
    duration: int("duration"),
    sunPercentage: real("sun_percentage"),
    price: real("price"),
    pricePerKwh: real("price_per_kwh"),
    co2PerKwh: real("co2_per_kwh"),
    lineHash: text("line_hash", { length: 255 }).notNull().unique(),
    ...timestamps,
  },
);

export const loadingSessionRelations = relations(
  csvImportLoadingSessions,
  ({ one }) => ({
    instance: one(instances, {
      fields: [csvImportLoadingSessions.instanceId],
      references: [instances.id],
    }),
  }),
);
