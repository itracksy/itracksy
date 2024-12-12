import { defineSchema, defineTable } from "convex/server";
import { type Infer, v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

const schema = defineSchema({
  ...authTables,
  messages: defineTable({
    userId: v.id("users"),
    body: v.string(),
  }),
  boards: defineTable({
    id: v.string(),
    name: v.string(),
    color: v.string(),
    clientId: v.optional(v.string()),
    hourlyRate: v.optional(v.number()),
    currency: v.optional(v.string()),
  }).index("id", ["id"]),

  columns: defineTable({
    id: v.string(),
    boardId: v.string(),
    name: v.string(),
    order: v.number(),
  })
    .index("id", ["id"])
    .index("board", ["boardId"]),

  items: defineTable({
    id: v.string(),
    title: v.string(),
    content: v.optional(v.string()),
    order: v.number(),
    columnId: v.string(),
    boardId: v.string(),
  })
    .index("id", ["id"])
    .index("column", ["columnId"])
    .index("board", ["boardId"]),

  clients: defineTable({
    id: v.string(),
    name: v.string(),
    email: v.optional(v.string()),
    address: v.optional(v.string()),
    taxId: v.optional(v.string()),
    defaultHourlyRate: v.optional(v.number()),
    defaultCurrency: v.optional(v.string()),
  }).index("id", ["id"]),

  invoices: defineTable({
    id: v.string(),
    clientId: v.string(),
    boardId: v.string(),
    number: v.string(),
    status: v.string(), // draft, sent, paid
    issueDate: v.number(),
    dueDate: v.number(),
    subtotal: v.number(),
    tax: v.optional(v.number()),
    total: v.number(),
    notes: v.optional(v.string()),
  })
    .index("id", ["id"])
    .index("client", ["clientId"])
    .index("board", ["boardId"])
    .index("status", ["status"]),

  timeEntries: defineTable({
    id: v.string(),
    itemId: v.string(),
    boardId: v.string(),
    duration: v.optional(v.number()),
    start: v.number(), // timestamp
    end: v.optional(v.number()), // timestamp
    description: v.optional(v.string()),
    invoiceId: v.optional(v.string()),
    userId: v.string(),
  })
    .index("id", ["id"])
    .index("item", ["itemId"])
    .index("board", ["boardId"])
    .index("invoice", ["invoiceId"]),
});
export default schema;

const board = schema.tables.boards.validator;
const column = schema.tables.columns.validator;
const item = schema.tables.items.validator;

export const updateBoardSchema = v.object({
  id: board.fields.id,
  name: v.optional(board.fields.name),
  color: v.optional(v.string()),
});

export const updateColumnSchema = v.object({
  id: column.fields.id,
  boardId: column.fields.boardId,
  name: v.optional(column.fields.name),
  order: v.optional(column.fields.order),
});

export const deleteItemSchema = v.object({
  id: item.fields.id,
  boardId: item.fields.boardId,
});
const { order, id, ...rest } = column.fields;
export const newColumnsSchema = v.object(rest);
export const deleteColumnSchema = v.object({
  boardId: column.fields.boardId,
  id: column.fields.id,
});
export type Board = Infer<typeof board>;
export type Column = Infer<typeof column>;
export type Item = Infer<typeof item>;

export type Client = Infer<typeof schema.tables.clients.validator>;
export type Invoice = Infer<typeof schema.tables.invoices.validator>;
export type TimeEntry = Infer<typeof schema.tables.timeEntries.validator>;
