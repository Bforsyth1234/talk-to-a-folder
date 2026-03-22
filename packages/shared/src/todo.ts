import { z } from "zod";

export const TodoSchema = z.object({
  id: z.number(),
  text: z.string().min(1).max(200),
  completed: z.boolean(),
  createdAt: z.string(),
});

export const CreateTodoRequestSchema = z.object({
  text: z.string().min(1).max(200),
});

export const UpdateTodoRequestSchema = z.object({
  id: z.number(),
  text: z.string().min(1).max(200).optional(),
  completed: z.boolean().optional(),
});

export const DeleteTodoRequestSchema = z.object({
  id: z.number(),
});

export const TodoListResponseSchema = z.object({
  todos: z.array(TodoSchema),
  total: z.number(),
  completed: z.number(),
});

export type Todo = z.infer<typeof TodoSchema>;
export type CreateTodoRequest = z.infer<typeof CreateTodoRequestSchema>;
export type UpdateTodoRequest = z.infer<typeof UpdateTodoRequestSchema>;
export type DeleteTodoRequest = z.infer<typeof DeleteTodoRequestSchema>;
export type TodoListResponse = z.infer<typeof TodoListResponseSchema>;
