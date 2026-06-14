import { describe, it, expect, vi, beforeEach } from 'vitest';
import { register, login } from '../auth.controller';
import { Request, Response } from 'express';
import prisma from '../../utils/prisma';
import { createClient } from '@supabase/supabase-js';

// Mock Prisma
vi.mock('../../utils/prisma', () => ({
  default: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
  },
}));

// Mock Supabase
vi.mock('@supabase/supabase-js', () => {
  const mSupabaseAuth = {
    admin: {
      createUser: vi.fn(),
    },
    signInWithPassword: vi.fn(),
  };
  return {
    createClient: vi.fn(() => ({
      auth: mSupabaseAuth,
    })),
  };
});

describe('Auth Controller', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let statusMock: any;
  let jsonMock: any;
  let cookieMock: any;

  beforeEach(() => {
    vi.clearAllMocks();
    
    jsonMock = vi.fn();
    statusMock = vi.fn().mockReturnValue({ json: jsonMock });
    cookieMock = vi.fn();
    
    mockRes = {
      status: statusMock,
      json: jsonMock,
      cookie: cookieMock,
    };
  });

  describe('register', () => {
    it('should validate inputs and return 400 for invalid data', async () => {
      mockReq = {
        body: {
          email: 'not-an-email',
          password: 'short',
        },
      };

      await register(mockReq as Request, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({
        error: expect.any(Array),
      }));
    });

    // We could add more tests for successful registration
  });

  describe('login', () => {
    it('should validate inputs and return 400 for invalid data', async () => {
      mockReq = {
        body: {
          email: 'not-an-email',
        },
      };

      await login(mockReq as Request, mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
    });
  });
});
