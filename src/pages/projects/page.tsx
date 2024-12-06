import { useState } from "react";
import { useMutation, useQuery } from "convex/react";

import { DragDropContext, Droppable, Draggable, Id } from "react-beautiful-dnd";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { api } from "../../../convex/_generated/api";

export default function ProjectsPage() {
  return (
    <div>
      <h1>Projects</h1>
    </div>
  );
}
