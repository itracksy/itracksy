import { TimeEntryWithRelations } from "@/types/projects";

export const getTitleTimeEntry = (entry: TimeEntryWithRelations) => {
  return entry.item?.title || entry.description || "Untitled";
};
