import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import crypto from 'crypto';
import { prisma } from '../lib/prisma.js';
import { AppError } from '../middleware/error.js';
import { sendPasswordResetEmail } from '../lib/email.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';

const router = Router();
const JWT_SECRET: string = process.env.JWT_SECRET || 'dev-secret-change-in-production';
const JWT_EXPIRES_IN: string = process.env.JWT_EXPIRES_IN || '7d';

const RegisterSchema = z.object({
  email: z.string().email(),
  phone: z.string().min(10).max(15),
  name: z.string().min(2),
  password: z.string().min(6),
  companyName: z.string().optional(),
});

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

const ForgotPasswordSchema = z.object({
  email: z.string().email(),
});

const ResetPasswordSchema = z.object({
  token: z.string(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

router.post('/register', async (req, res, next) => {
  try {
    console.log('Registration request received:', JSON.stringify(req.body, null, 2));
    const data = RegisterSchema.parse(req.body);
    console.log('Validation passed, data:', JSON.stringify(data, null, 2));

    const existing = await prisma.user.findFirst({
      where: {
        OR: [
          { email: data.email },
          { phone: data.phone },
        ],
      },
    });

    if (existing) {
      throw new AppError(400, 'User with this email or phone already exists');
    }

    const passwordHash = await bcrypt.hash(data.password, 10);

    // Create merchant if company name provided
    let merchant;
    if (data.companyName) {
      console.log('Creating merchant for:', data.companyName);
      merchant = await prisma.merchant.create({
        data: {
          companyName: data.companyName,
          email: data.email,
          phone: data.phone,
        },
      });
      console.log('Merchant created:', merchant.id);
    }

    console.log('Creating user...');
    const user = await prisma.user.create({
      data: {
        email: data.email,
        phone: data.phone,
        name: data.name,
        passwordHash,
        merchantId: merchant?.id,
        role: merchant ? 'MANAGER' : 'USER',
      },
    });
    console.log('User created:', user.id);

    const token = jwt.sign(
      { userId: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN } as jwt.SignOptions
    );

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await prisma.session.create({
      data: {
        userId: user.id,
        token,
        expiresAt,
      },
    });

    console.log('Registration successful for:', user.email);
    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        merchantId: user.merchantId,
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    next(error);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const data = LoginSchema.parse(req.body);

    const user = await prisma.user.findUnique({
      where: { email: data.email },
      include: { merchant: true },
    });

    if (!user || !user.passwordHash) {
      throw new AppError(401, 'Invalid credentials');
    }

    const validPassword = await bcrypt.compare(data.password, user.passwordHash);
    if (!validPassword) {
      throw new AppError(401, 'Invalid credentials');
    }

    if (!user.isActive) {
      throw new AppError(403, 'Account is inactive');
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN } as jwt.SignOptions
    );

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await prisma.session.create({
      data: {
        userId: user.id,
        token,
        expiresAt,
      },
    });

    // Check if user is admin
    const isAdmin = user.email === 'admin@admin.com';

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        merchantId: user.merchantId,
        isAdmin,
        merchant: user.merchant ? {
          id: user.merchant.id,
          companyName: user.merchant.companyName,
          walletBalance: user.merchant.walletBalance,
        } : null,
      },
    });
  } catch (error) {
    next(error);
  }
});

router.post('/logout', async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      await prisma.session.delete({ where: { token } }).catch(() => { });
    }
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    next(error);
  }
});

// Get current user (session verification)
router.get('/me', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      include: {
        merchant: {
          select: {
            id: true,
            companyName: true,
            walletBalance: true,
            delhiveryEnabled: true,
          },
        },
      },
    });

    if (!user) {
      throw new AppError(404, 'User not found');
    }

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        merchantId: user.merchantId,
        isActive: user.isActive,
        merchant: user.merchant,
      },
    });
  } catch (error) {
    next(error);
  }
});

// Refresh token
router.post('/refresh', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const oldToken = req.headers.authorization?.substring(7);

    if (!oldToken) {
      throw new AppError(401, 'No token provided');
    }

    // Delete old session
    await prisma.session.delete({ where: { token: oldToken } }).catch(() => { });

    // Create new token
    const newToken = jwt.sign(
      { userId: req.user!.id, email: req.user!.email },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN } as jwt.SignOptions
    );

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await prisma.session.create({
      data: {
        userId: req.user!.id,
        token: newToken,
        expiresAt,
      },
    });

    res.json({ token: newToken });
  } catch (error) {
    next(error);
  }
});

// Forgot password - send reset email
router.post('/forgot-password', async (req, res, next) => {
  try {
    const data = ForgotPasswordSchema.parse(req.body);

    const user = await prisma.user.findUnique({
      where: { email: data.email },
    });

    // Always return success even if user doesn't exist (security best practice)
    if (!user) {
      return res.json({
        message: 'If an account exists with this email, a password reset link has been sent.',
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    // Save to database (expires in 1 hour)
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1);

    await prisma.passwordReset.create({
      data: {
        userId: user.id,
        token: hashedToken,
        expiresAt,
      },
    });

    // Send email
    await sendPasswordResetEmail(user.email, resetToken, user.name);

    res.json({
      message: 'If an account exists with this email, a password reset link has been sent.',
    });
  } catch (error) {
    next(error);
  }
});

// Reset password with token
router.post('/reset-password', async (req, res, next) => {
  try {
    const data = ResetPasswordSchema.parse(req.body);

    // Hash the token to compare with database
    const hashedToken = crypto.createHash('sha256').update(data.token).digest('hex');

    const resetRecord = await prisma.passwordReset.findUnique({
      where: { token: hashedToken },
      include: { user: true },
    });

    if (!resetRecord || resetRecord.used || resetRecord.expiresAt < new Date()) {
      throw new AppError(400, 'Invalid or expired reset token');
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(data.password, 10);

    // Update password and mark reset token as used
    await prisma.$transaction([
      prisma.user.update({
        where: { id: resetRecord.userId },
        data: { passwordHash },
      }),
      prisma.passwordReset.update({
        where: { token: hashedToken },
        data: { used: true },
      }),
      // Delete all existing sessions to force re-login
      prisma.session.deleteMany({
        where: { userId: resetRecord.userId },
      }),
    ]);

    res.json({ message: 'Password reset successful. Please login with your new password.' });
  } catch (error) {
    next(error);
  }
});

// Seed admin user endpoint
router.post('/seed-admin', async (req, res, next) => {
  try {
    const adminEmail = 'admin@admin.com';
    const adminPassword = 'nthspacesolutions';

    // Check if admin already exists
    const existing = await prisma.user.findUnique({
      where: { email: adminEmail },
    });

    if (existing) {
      return res.json({ message: 'Admin user already exists', email: adminEmail });
    }

    const passwordHash = await bcrypt.hash(adminPassword, 10);

    const admin = await prisma.user.create({
      data: {
        email: adminEmail,
        phone: '0000000000',
        name: 'System Admin',
        passwordHash,
        role: 'ADMIN',
        isActive: true,
      },
    });

    res.json({
      message: 'Admin user created successfully',
      email: adminEmail,
      userId: admin.id
    });
  } catch (error) {
    next(error);
  }
});

export const authRouter = router;
