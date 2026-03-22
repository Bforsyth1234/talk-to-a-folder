import { z } from "zod";

export const TodoSchema = z.object({
  id: z.string(),
  text: z.string(),
  completed: z.boolean(),
  createdAt: z.string(), // ISO string for serialization
});

export type Todo = z.infer<typeof TodoSchema>;
