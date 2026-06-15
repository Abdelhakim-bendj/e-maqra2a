import { z } from "zod";

const schema = z.object({
  studentId: z.string().uuid(),
  taskType: z.enum(['NEW', 'REVISION']),
  surahNumber: z.number().int().min(1).max(114),
  ayahStart: z.number().int().min(1),
  ayahEnd: z.number().int().min(1),
  dueDate: z.string().datetime(),
  notes: z.string().max(500).optional(),
}).refine((d) => d.ayahEnd >= d.ayahStart, {
  message: 'آية النهاية يجب أن تكون بعد أو مساوية لآية البداية',
  path: ['ayahEnd'],
});

const payload = {
  studentId: "123e4567-e89b-12d3-a456-426614174000",
  taskType: "NEW",
  surahNumber: 1,
  ayahStart: 1,
  ayahEnd: 7,
  dueDate: new Date("2026-06-15").toISOString(),
};

try {
  schema.parse(payload);
  console.log("Valid!");
} catch (e) {
  console.log(e);
}
