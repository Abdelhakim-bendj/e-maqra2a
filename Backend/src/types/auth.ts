export const Roles = {
  ADMIN: 'ADMIN',
  TEACHER: 'TEACHER',
  STUDENT: 'STUDENT',
} as const;

export type Role = (typeof Roles)[keyof typeof Roles];
