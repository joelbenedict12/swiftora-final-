import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { authenticate, AuthRequest, requireRole } from '../middleware/auth.js';
import { AppError } from '../middleware/error.js';

const router = Router();

// All support routes require authentication + SUPPORT or ADMIN role
router.use(authenticate);
router.use(requireRole(['SUPPORT', 'ADMIN']));

// ============================================================
// SUPPORT DASHBOARD STATS
// ============================================================

router.get('/dashboard-stats', async (req: AuthRequest, res, next) => {
    try {
        const userId = req.user!.id;

        const [openCount, inProgressCount, resolvedToday, totalAssigned] = await Promise.all([
            prisma.ticket.count({
                where: { assignedTo: userId, status: 'OPEN' },
            }),
            prisma.ticket.count({
                where: { assignedTo: userId, status: 'IN_PROGRESS' },
            }),
            prisma.ticket.count({
                where: {
                    assignedTo: userId,
                    status: { in: ['RESOLVED', 'CLOSED'] },
                    resolvedAt: {
                        gte: new Date(new Date().setHours(0, 0, 0, 0)),
                    },
                },
            }),
            prisma.ticket.count({
                where: { assignedTo: userId },
            }),
        ]);

        res.json({
            openTickets: openCount,
            inProgressTickets: inProgressCount,
            resolvedToday,
            totalAssigned,
        });
    } catch (error) {
        next(error);
    }
});

// ============================================================
// SUPPORT TICKET ROUTES
// ============================================================

// List tickets assigned to current user
router.get('/tickets', async (req: AuthRequest, res, next) => {
    try {
        const userId = req.user!.id;
        const { status, priority } = req.query;

        const where: any = { assignedTo: userId };

        if (status && status !== 'all') {
            where.status = status;
        }
        if (priority && priority !== 'all') {
            where.priority = priority;
        }

        const tickets = await prisma.ticket.findMany({
            where,
            include: {
                merchant: {
                    select: { companyName: true, email: true },
                },
                user: {
                    select: { name: true, email: true },
                },
                order: {
                    select: { orderNumber: true, customerName: true, status: true },
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        // Calculate SLA status
        const ticketsWithSLA = tickets.map(ticket => {
            const now = new Date();
            const hoursRemaining = Math.max(0, Math.ceil((ticket.dueAt.getTime() - now.getTime()) / (1000 * 60 * 60)));
            const isOverdue = ticket.status !== 'RESOLVED' && ticket.status !== 'CLOSED' && ticket.dueAt < now;

            return {
                ...ticket,
                sla: isOverdue
                    ? 'Overdue'
                    : ticket.status === 'RESOLVED' || ticket.status === 'CLOSED'
                        ? 'Resolved'
                        : `${hoursRemaining} hours remaining`,
            };
        });

        res.json({ tickets: ticketsWithSLA });
    } catch (error) {
        next(error);
    }
});

// Get single ticket (only if assigned to current user)
router.get('/tickets/:id', async (req: AuthRequest, res, next) => {
    try {
        const userId = req.user!.id;
        const isAdmin = req.user!.role === 'ADMIN';

        const where: any = { id: req.params.id };
        if (!isAdmin) {
            where.assignedTo = userId;
        }

        const ticket = await prisma.ticket.findFirst({
            where,
            include: {
                merchant: {
                    select: { companyName: true, email: true },
                },
                user: {
                    select: { name: true, email: true },
                },
                order: {
                    include: {
                        warehouse: true,
                        trackingEvents: {
                            orderBy: { timestamp: 'desc' as const },
                            take: 5,
                        },
                    },
                },
                notes: {
                    include: {
                        user: {
                            select: { name: true, email: true, role: true },
                        },
                    },
                    orderBy: { createdAt: 'desc' as const },
                },
            },
        });

        if (!ticket) {
            throw new AppError(404, 'Ticket not found or not assigned to you');
        }

        res.json({ ticket });
    } catch (error) {
        next(error);
    }
});

// Update ticket (status, resolution, priority — no reassignment)
const UpdateTicketSchema = z.object({
    status: z.enum(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']).optional(),
    resolution: z.string().optional(),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
});

router.put('/tickets/:id', async (req: AuthRequest, res, next) => {
    try {
        const userId = req.user!.id;
        const isAdmin = req.user!.role === 'ADMIN';

        // Verify ticket is assigned to this support user
        const existingTicket = await prisma.ticket.findFirst({
            where: isAdmin
                ? { id: req.params.id }
                : { id: req.params.id, assignedTo: userId },
        });

        if (!existingTicket) {
            throw new AppError(404, 'Ticket not found or not assigned to you');
        }

        const data = UpdateTicketSchema.parse(req.body);
        const updateData: any = {};

        if (data.status) {
            updateData.status = data.status;
            if (data.status === 'RESOLVED' || data.status === 'CLOSED') {
                updateData.resolvedAt = new Date();
                updateData.resolvedBy = userId;
            }
        }

        if (data.resolution) {
            updateData.resolution = data.resolution;
        }

        if (data.priority) {
            updateData.priority = data.priority;
        }

        const ticket = await prisma.ticket.update({
            where: { id: req.params.id },
            data: updateData,
            include: {
                merchant: {
                    select: { companyName: true, email: true },
                },
                user: {
                    select: { name: true, email: true },
                },
                order: {
                    select: { orderNumber: true, customerName: true },
                },
            },
        });

        res.json({ success: true, ticket });
    } catch (error: any) {
        if (error.name === 'ZodError') {
            return res.status(400).json({
                error: 'Validation failed',
                details: error.errors,
            });
        }
        next(error);
    }
});

// ============================================================
// TICKET NOTES
// ============================================================

const CreateNoteSchema = z.object({
    content: z.string().min(1),
    isInternal: z.boolean().default(true),
});

// Add a note to a ticket
router.post('/tickets/:id/notes', async (req: AuthRequest, res, next) => {
    try {
        const userId = req.user!.id;
        const isAdmin = req.user!.role === 'ADMIN';

        // Verify ticket is assigned to this user
        const ticket = await prisma.ticket.findFirst({
            where: isAdmin
                ? { id: req.params.id }
                : { id: req.params.id, assignedTo: userId },
        });

        if (!ticket) {
            throw new AppError(404, 'Ticket not found or not assigned to you');
        }

        const data = CreateNoteSchema.parse(req.body);

        const note = await prisma.ticketNote.create({
            data: {
                ticketId: req.params.id,
                userId,
                content: data.content,
                isInternal: data.isInternal,
            },
            include: {
                user: {
                    select: { name: true, email: true, role: true },
                },
            },
        });

        res.status(201).json({ success: true, note });
    } catch (error: any) {
        if (error.name === 'ZodError') {
            return res.status(400).json({
                error: 'Validation failed',
                details: error.errors,
            });
        }
        next(error);
    }
});

// Get notes for a ticket
router.get('/tickets/:id/notes', async (req: AuthRequest, res, next) => {
    try {
        const userId = req.user!.id;
        const isAdmin = req.user!.role === 'ADMIN';

        // Verify ticket is assigned to this user
        const ticket = await prisma.ticket.findFirst({
            where: isAdmin
                ? { id: req.params.id }
                : { id: req.params.id, assignedTo: userId },
        });

        if (!ticket) {
            throw new AppError(404, 'Ticket not found or not assigned to you');
        }

        const notes = await prisma.ticketNote.findMany({
            where: { ticketId: req.params.id },
            include: {
                user: {
                    select: { name: true, email: true, role: true },
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        res.json({ notes });
    } catch (error) {
        next(error);
    }
});

export const supportRouter = router;
