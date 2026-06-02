// ERD 문서(docs/erd.md) 기반으로 정의된 Drizzle ORM 데이터베이스 스키마
import {
  pgTable,
  pgEnum,
  uuid,
  text,
  varchar,
  integer,
  doublePrecision,
  timestamp,
  primaryKey,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ============================================================
// Enum 타입 정의
// ============================================================

/** 유저 역할 (admin: 관리자, user: 일반 유저) */
export const userRoleEnum = pgEnum("user_role", ["admin", "user"]);

/** Studios, Rooms, Equipments 공통 상태 값 */
export const statusEnum = pgEnum("status", ["pending", "active", "deny"]);

/** 합주실 정보 수정 요청 상태 값 */
export const studioUpdateRequestStatusEnum = pgEnum("studio_update_request_status", [
  "pending",
  "approved",
  "rejected",
]);

// ============================================================
// 테이블 정의
// ============================================================

/** 유저 테이블 */
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  username: varchar("username", { length: 100 }).notNull().unique(),
  passwordHashed: text("password_hashed").notNull(),
  nickname: varchar("nickname", { length: 100 }).notNull().unique(),
  role: userRoleEnum("role").notNull().default("user"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

/** 합주실(스튜디오) 테이블 */
export const studios = pgTable("studios", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 200 }).notNull(),
  mapUrl: text("map_url"),
  description: text("description"),
  images: text("images").array().notNull().default([]),
  lat: doublePrecision("lat").notNull(),
  lng: doublePrecision("lng").notNull(),
  status: statusEnum("status").notNull().default("pending"),
  denyReason: text("deny_reason"),
  createdBy: uuid("created_by")
    .notNull()
    .references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

/** 방(룸) 테이블 */
export const rooms = pgTable("rooms", {
  id: uuid("id").primaryKey().defaultRandom(),
  studioId: uuid("studio_id")
    .notNull()
    .references(() => studios.id),
  name: varchar("name", { length: 200 }).notNull(),
  images: text("images").array().notNull().default([]),
  pricePerHour: integer("price_per_hour").notNull(),
  minCapacity: integer("min_capacity").notNull(),
  maxCapacity: integer("max_capacity").notNull(),
  description: text("description"),
  status: statusEnum("status").notNull().default("pending"),
  denyReason: text("deny_reason"),
  createdBy: uuid("created_by")
    .notNull()
    .references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

/** 장비 카테고리 테이블 (어드민이 동적으로 관리) */
export const equipmentCategories = pgTable("equipment_categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  typeName: varchar("type_name", { length: 100 }).notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

/** 장비 테이블 */
export const equipments = pgTable("equipments", {
  id: uuid("id").primaryKey().defaultRandom(),
  roomId: uuid("room_id")
    .notNull()
    .references(() => rooms.id),
  categoryId: uuid("category_id")
    .notNull()
    .references(() => equipmentCategories.id),
  name: varchar("name", { length: 200 }).notNull(),
  imageUrl: text("image_url"),
  status: statusEnum("status").notNull().default("pending"),
  denyReason: text("deny_reason"),
  createdBy: uuid("created_by")
    .notNull()
    .references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

/**
 * 북마크 교차 테이블 (Users - Studios 다대다 해소)
 * 복합 기본 키(user_id, studio_id)로 중복 북마크를 DB 레벨에서 방지.
 */
export const bookmarks = pgTable(
  "bookmarks",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
    studioId: uuid("studio_id")
      .notNull()
      .references(() => studios.id),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [primaryKey({ columns: [table.userId, table.studioId] })]
);

/** 합주실 정보 수정 요청 테이블 */
export const studioUpdateRequests = pgTable("studio_update_requests", {
  id: uuid("id").primaryKey().defaultRandom(),
  studioId: uuid("studio_id")
    .notNull()
    .references(() => studios.id),
  name: varchar("name", { length: 200 }).notNull(),
  mapUrl: text("map_url").notNull(),
  description: text("description"),
  lat: doublePrecision("lat").notNull(),
  lng: doublePrecision("lng").notNull(),
  status: studioUpdateRequestStatusEnum("status").notNull().default("pending"),
  denyReason: text("deny_reason"),
  createdBy: uuid("created_by")
    .notNull()
    .references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ============================================================
// Relations 정의 (Drizzle ORM 쿼리 빌더용)
// ============================================================

export const usersRelations = relations(users, ({ many }) => ({
  studios: many(studios),
  bookmarks: many(bookmarks),
  studioUpdateRequests: many(studioUpdateRequests),
}));

export const studiosRelations = relations(studios, ({ one, many }) => ({
  createdBy: one(users, {
    fields: [studios.createdBy],
    references: [users.id],
  }),
  rooms: many(rooms),
  bookmarks: many(bookmarks),
  studioUpdateRequests: many(studioUpdateRequests),
}));

export const roomsRelations = relations(rooms, ({ one, many }) => ({
  studio: one(studios, {
    fields: [rooms.studioId],
    references: [studios.id],
  }),
  createdBy: one(users, {
    fields: [rooms.createdBy],
    references: [users.id],
  }),
  equipments: many(equipments),
}));

export const equipmentCategoriesRelations = relations(
  equipmentCategories,
  ({ many }) => ({
    equipments: many(equipments),
  })
);

export const equipmentsRelations = relations(equipments, ({ one }) => ({
  room: one(rooms, {
    fields: [equipments.roomId],
    references: [rooms.id],
  }),
  category: one(equipmentCategories, {
    fields: [equipments.categoryId],
    references: [equipmentCategories.id],
  }),
  createdBy: one(users, {
    fields: [equipments.createdBy],
    references: [users.id],
  }),
}));

export const bookmarksRelations = relations(bookmarks, ({ one }) => ({
  user: one(users, {
    fields: [bookmarks.userId],
    references: [users.id],
  }),
  studio: one(studios, {
    fields: [bookmarks.studioId],
    references: [studios.id],
  }),
}));

export const studioUpdateRequestsRelations = relations(
  studioUpdateRequests,
  ({ one }) => ({
    studio: one(studios, {
      fields: [studioUpdateRequests.studioId],
      references: [studios.id],
    }),
    createdBy: one(users, {
      fields: [studioUpdateRequests.createdBy],
      references: [users.id],
    }),
  })
);
