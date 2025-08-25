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

export const instances = sqliteTable("instance", {
  id: createIdType(),
  lastJobRun: int("last_job_run", { mode: "timestamp" }).default(sql`0`),
  ...timestamps,
});

export const extractedLoadingSessions = sqliteTable(
  "extracted_loading_session",
  {
    id: createIdType("id", true),
    startTime: int("start_time", { mode: "timestamp" }).notNull(),
    endTime: int("end_time", { mode: "timestamp" }).notNull(),
    duration: int("duration").notNull(),
    instanceId: createIdType("instance_id", false)
      .notNull()
      .references(() => instances.id),
    componentId: text("component_id", { length: 255 }).notNull(),
    startSoc: real("start_soc"),
    endSoc: real("end_soc"),
    startRange: real("start_range"),
    endRange: real("end_range"),
    limitSoc: real("limit_soc"),
    chargedEnergy: real("charged_energy"),
    sessionEnergy: real("session_energy"),
    maxChargePower: real("max_charge_power"),
    maxPhasesActive: real("max_phases_active"),
    mode: text("mode", { length: 255 }),
    price: real("price"),
    solarPercentage: real("solar_percentage"),
    ...timestamps,
  },
);

export const extractedLoadingSessionRelations = relations(
  extractedLoadingSessions,
  ({ one }) => ({
    instance: one(instances, {
      fields: [extractedLoadingSessions.instanceId],
      references: [instances.id],
    }),
  }),
);

export const csvImportLoadingSessions = sqliteTable(
  "csv_import_loading_session",
  {
    id: createIdType(),
    instanceId: createIdType("instance_id", false)
      .notNull()
      .references(() => instances.id),
    startTime: int("start_time", { mode: "timestamp" }).notNull(),
    endTime: int("end_time", { mode: "timestamp" }).notNull(),
    startKwh: real("start_kwh"),
    endKwh: real("end_kwh"),
    kilometers: real("kilometers"),
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

export const csvImportLoadingSessionRelations = relations(
  csvImportLoadingSessions,
  ({ one }) => ({
    instance: one(instances, {
      fields: [csvImportLoadingSessions.instanceId],
      references: [instances.id],
    }),
  }),
);
