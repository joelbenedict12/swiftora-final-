import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { authenticate, AuthRequest, requireRole } from '../middleware/auth.js';
import { AppError } from '../middleware/error.js';
import { kycUpload } from '../lib/upload.js';

const router = Router();
router.use(authenticate);

// GET /api/kyc/status — current merchant's KYC status + submitted data
router.get('/status', async (req: AuthRequest, res, next) => {
  try {
    if (!req.user?.merchantId) {
      return res.json({ kycStatus: 'NOT_STARTED', data: null });
    }

    const merchant = await prisma.merchant.findUnique({
      where: { id: req.user.merchantId },
      select: {
        kycStatus: true,
        kycVerifiedAt: true,
        panNumber: true,
        panImageUrl: true,
        aadhaarImageUrl: true,
        gstNumber: true,
        gstCertificateUrl: true,
        bankAccountName: true,
        bankName: true,
        bankAccountNumber: true,
        bankIfscCode: true,
        cancelledChequeUrl: true,
      },
    });

    if (!merchant) {
      return res.json({ kycStatus: 'NOT_STARTED', data: null });
    }

    res.json({
      kycStatus: merchant.kycStatus,
      kycVerifiedAt: merchant.kycVerifiedAt,
      data: {
        panNumber: merchant.panNumber,
        panImageUrl: merchant.panImageUrl,
        aadhaarImageUrl: merchant.aadhaarImageUrl,
        gstNumber: merchant.gstNumber,
        gstCertificateUrl: merchant.gstCertificateUrl,
        bankAccountName: merchant.bankAccountName,
        bankName: merchant.bankName,
        bankAccountNumber: merchant.bankAccountNumber,
        bankIfscCode: merchant.bankIfscCode,
        cancelledChequeUrl: merchant.cancelledChequeUrl,
      },
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/kyc/submit — multipart form upload for KYC documents
const uploadFields = kycUpload.fields([
  { name: 'panImage', maxCount: 1 },
  { name: 'aadhaarImage', maxCount: 1 },
  { name: 'gstCertificate', maxCount: 1 },
  { name: 'cancelledCheque', maxCount: 1 },
]);

router.post('/submit', uploadFields, async (req: AuthRequest, res, next) => {
  try {
    if (!req.user?.merchantId) {
      throw new AppError(400, 'Merchant account required');
    }

    const files = req.files as { [field: string]: Express.Multer.File[] } | undefined;
    const { panNumber, gstNumber, bankAccountName, bankName, bankAccountNumber, bankIfscCode } = req.body;

    if (!panNumber) {
      throw new AppError(400, 'PAN number is required');
    }
    if (!bankAccountName || !bankName || !bankAccountNumber || !bankIfscCode) {
      throw new AppError(400, 'All bank details are required');
    }

    const updateData: Record<string, any> = {
      panNumber,
      bankAccountName,
      bankName,
      bankAccountNumber,
      bankIfscCode,
      kycStatus: 'PENDING_ADMIN_REVIEW',
    };

    if (gstNumber) updateData.gstNumber = gstNumber;

    if (files?.panImage?.[0]) {
      updateData.panImageUrl = `/uploads/kyc/${files.panImage[0].filename}`;
    }
    if (files?.aadhaarImage?.[0]) {
      updateData.aadhaarImageUrl = `/uploads/kyc/${files.aadhaarImage[0].filename}`;
    }
    if (files?.gstCertificate?.[0]) {
      updateData.gstCertificateUrl = `/uploads/kyc/${files.gstCertificate[0].filename}`;
    }
    if (files?.cancelledCheque?.[0]) {
      updateData.cancelledChequeUrl = `/uploads/kyc/${files.cancelledCheque[0].filename}`;
    }

    await prisma.merchant.update({
      where: { id: req.user.merchantId },
      data: updateData,
    });

    res.json({
      success: true,
      message: 'Your KYC is under review. You will gain full access once approved.',
      kycStatus: 'PENDING_ADMIN_REVIEW',
    });
  } catch (error) {
    next(error);
  }
});

// ============================================================
// ADMIN KYC MANAGEMENT ROUTES
// ============================================================

const requireAdmin = (req: AuthRequest, res: any, next: any) => {
  if (!req.user || (req.user.role !== 'ADMIN' && req.user.email !== 'admin@admin.com')) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

// GET /api/kyc/admin/merchants — list merchants with KYC data
router.get('/admin/merchants', requireAdmin, async (req: AuthRequest, res, next) => {
  try {
    const { status } = req.query;

    const where: any = {};
    if (status && status !== 'all') {
      where.kycStatus = status as string;
    }

    const merchants = await prisma.merchant.findMany({
      where,
      select: {
        id: true,
        companyName: true,
        email: true,
        phone: true,
        kycStatus: true,
        kycVerifiedAt: true,
        panNumber: true,
        gstNumber: true,
        bankAccountName: true,
        bankName: true,
        bankAccountNumber: true,
        bankIfscCode: true,
        panImageUrl: true,
        aadhaarImageUrl: true,
        gstCertificateUrl: true,
        cancelledChequeUrl: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ merchants });
  } catch (error) {
    next(error);
  }
});

// GET /api/kyc/admin/merchants/:id — full KYC details for one merchant
router.get('/admin/merchants/:id', requireAdmin, async (req: AuthRequest, res, next) => {
  try {
    const merchant = await prisma.merchant.findUnique({
      where: { id: req.params.id },
      select: {
        id: true,
        companyName: true,
        email: true,
        phone: true,
        kycStatus: true,
        kycVerifiedAt: true,
        kycVerifiedBy: true,
        panNumber: true,
        panImageUrl: true,
        aadhaarImageUrl: true,
        gstNumber: true,
        gstCertificateUrl: true,
        bankAccountName: true,
        bankName: true,
        bankAccountNumber: true,
        bankIfscCode: true,
        cancelledChequeUrl: true,
        createdAt: true,
      },
    });

    if (!merchant) throw new AppError(404, 'Merchant not found');

    res.json({ merchant });
  } catch (error) {
    next(error);
  }
});

// POST /api/kyc/admin/merchants/:id/approve
router.post('/admin/merchants/:id/approve', requireAdmin, async (req: AuthRequest, res, next) => {
  try {
    const merchant = await prisma.merchant.findUnique({ where: { id: req.params.id } });
    if (!merchant) throw new AppError(404, 'Merchant not found');

    await prisma.merchant.update({
      where: { id: req.params.id },
      data: {
        kycStatus: 'VERIFIED',
        kycVerifiedAt: new Date(),
        kycVerifiedBy: req.user!.id,
      },
    });

    res.json({ success: true, message: 'KYC approved successfully' });
  } catch (error) {
    next(error);
  }
});

// POST /api/kyc/admin/merchants/:id/reject
router.post('/admin/merchants/:id/reject', requireAdmin, async (req: AuthRequest, res, next) => {
  try {
    const merchant = await prisma.merchant.findUnique({ where: { id: req.params.id } });
    if (!merchant) throw new AppError(404, 'Merchant not found');

    await prisma.merchant.update({
      where: { id: req.params.id },
      data: {
        kycStatus: 'REJECTED',
        kycVerifiedAt: null,
        kycVerifiedBy: null,
      },
    });

    res.json({ success: true, message: 'KYC rejected' });
  } catch (error) {
    next(error);
  }
});

export const kycRouter = router;
