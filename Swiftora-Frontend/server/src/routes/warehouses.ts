import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';
import { AppError } from '../middleware/error.js';
import { delhivery } from '../services/delhivery.js';

const router = Router();

router.use(authenticate);

const CreateWarehouseSchema = z.object({
  name: z.string(),
  contactPerson: z.string().optional(),
  phone: z.string(),
  email: z.string().email().optional(),
  address: z.string(),
  city: z.string(),
  state: z.string(),
  pincode: z.string(),
  isDefault: z.boolean().optional(),
  syncToDelhivery: z.boolean().optional().default(true),
});

// List warehouses (deduplicate "Default Warehouse" so only one per merchant is shown)
router.get('/', async (req: AuthRequest, res, next) => {
  try {
    // Handle users without merchantId
    if (!req.user?.merchantId) {
      return res.json([]);
    }

    const warehouses = await prisma.warehouse.findMany({
      where: {
        merchantId: req.user.merchantId,
        isActive: true,
      },
      orderBy: [
        { isDefault: 'desc' },
        { createdAt: 'asc' },
        { name: 'asc' },
      ],
    });

    // Deduplicate: if multiple "Default Warehouse" exist, show only one (first/default)
    let defaultIncluded = false;
    const deduped = warehouses.filter((w) => {
      if (w.name === 'Default Warehouse') {
        if (defaultIncluded) return false;
        defaultIncluded = true;
      }
      return true;
    });

    res.json(deduped);
  } catch (error) {
    next(error);
  }
});

// Get single warehouse
router.get('/:id', async (req: AuthRequest, res, next) => {
  try {
    const warehouse = await prisma.warehouse.findFirst({
      where: {
        id: req.params.id,
        merchantId: req.user!.merchantId!,
      },
    });

    if (!warehouse) {
      throw new AppError(404, 'Warehouse not found');
    }

    res.json(warehouse);
  } catch (error) {
    next(error);
  }
});

// Create warehouse
router.post('/', async (req: AuthRequest, res, next) => {
  try {
    const data = CreateWarehouseSchema.parse(req.body);

    if (!req.user!.merchantId) {
      throw new AppError(400, 'Merchant account required');
    }

    // If this is set as default, unset other defaults
    if (data.isDefault) {
      await prisma.warehouse.updateMany({
        where: {
          merchantId: req.user!.merchantId,
          isDefault: true,
        },
        data: { isDefault: false },
      });
    }

    // Create warehouse in Swiftora
    const warehouse = await prisma.warehouse.create({
      data: {
        name: data.name,
        contactPerson: data.contactPerson,
        phone: data.phone,
        email: data.email,
        address: data.address,
        city: data.city,
        state: data.state,
        pincode: data.pincode,
        isDefault: data.isDefault,
        merchantId: req.user!.merchantId,
        delhiverySynced: false,
        delhiveryName: null,
      },
    });

    // Sync to Delhivery if enabled
    let delhiverySync = { success: false, message: '' };
    if (data.syncToDelhivery) {
      try {
        const delhiveryData = {
          name: data.name, // This is the pickup_location name to use in shipments
          phone: data.phone,
          address: data.address,
          city: data.city,
          state: data.state,
          pin: data.pincode,
          country: 'India',
          return_name: data.name,
          return_address: data.address,
          return_city: data.city,
          return_state: data.state,
          return_pin: data.pincode,
        };

        await delhivery.createWarehouse(delhiveryData, req.user!.merchantId!);

        // Update warehouse with sync status - CRITICAL: Store exact name
        await prisma.warehouse.update({
          where: { id: warehouse.id },
          data: {
            delhiverySynced: true,
            delhiveryName: data.name, // IMPORTANT: This is the pickup_location for shipments
          },
        });

        delhiverySync = { success: true, message: 'Synced to Delhivery' };
        console.log('Warehouse synced to Delhivery:', data.name);
      } catch (err: any) {
        console.error('Delhivery warehouse sync error:', err.response?.data || err.message);
        delhiverySync = {
          success: false,
          message: err.response?.data?.message || err.message || 'Failed to sync to Delhivery'
        };
      }
    }

    // Re-fetch with updated sync status
    const updatedWarehouse = await prisma.warehouse.findUnique({ where: { id: warehouse.id } });

    res.status(201).json({
      ...updatedWarehouse,
      delhiverySync
    });
  } catch (error) {
    next(error);
  }
});

// Update warehouse
router.put('/:id', async (req: AuthRequest, res, next) => {
  try {
    const data = CreateWarehouseSchema.partial().parse(req.body);

    const warehouse = await prisma.warehouse.findFirst({
      where: {
        id: req.params.id,
        merchantId: req.user!.merchantId!,
      },
    });

    if (!warehouse) {
      throw new AppError(404, 'Warehouse not found');
    }

    // If setting as default, unset other defaults
    if (data.isDefault) {
      await prisma.warehouse.updateMany({
        where: {
          merchantId: req.user!.merchantId!,
          isDefault: true,
          id: { not: warehouse.id },
        },
        data: { isDefault: false },
      });
    }

    const updated = await prisma.warehouse.update({
      where: { id: warehouse.id },
      data,
    });

    res.json(updated);
  } catch (error) {
    next(error);
  }
});

// Delete warehouse
router.delete('/:id', async (req: AuthRequest, res, next) => {
  try {
    const warehouse = await prisma.warehouse.findFirst({
      where: {
        id: req.params.id,
        merchantId: req.user!.merchantId!,
      },
    });

    if (!warehouse) {
      throw new AppError(404, 'Warehouse not found');
    }

    // Soft delete
    await prisma.warehouse.update({
      where: { id: warehouse.id },
      data: { isActive: false },
    });

    res.json({ message: 'Warehouse deleted successfully' });
  } catch (error) {
    next(error);
  }
});

// Link an existing Delhivery warehouse name to a Swiftora warehouse
router.post('/:id/link-delhivery', async (req: AuthRequest, res, next) => {
  try {
    const { delhiveryName } = req.body;

    if (!delhiveryName || typeof delhiveryName !== 'string') {
      throw new AppError(400, 'delhiveryName is required');
    }

    const warehouse = await prisma.warehouse.findFirst({
      where: {
        id: req.params.id,
        merchantId: req.user!.merchantId!,
      },
    });

    if (!warehouse) {
      throw new AppError(404, 'Warehouse not found');
    }

    // Update with the exact Delhivery name
    const updated = await prisma.warehouse.update({
      where: { id: warehouse.id },
      data: {
        delhiverySynced: true,
        delhiveryName: delhiveryName.trim(),
      },
    });

    res.json({
      success: true,
      message: `Warehouse linked to Delhivery pickup location "${delhiveryName}"`,
      warehouse: updated,
    });
  } catch (error) {
    next(error);
  }
});

// Setup JS Enterprises warehouse (quick fix for user)
router.post('/setup-js-enterprises', async (req: AuthRequest, res, next) => {
  try {
    if (!req.user?.merchantId) {
      throw new AppError(400, 'Merchant account required');
    }

    // JS Enterprises warehouse details from Delhivery
    const jsEnterprisesData = {
      name: 'JS Enterprises',
      contactPerson: 'Samsudinbasha Jagirusen',
      phone: '9344268276',
      email: 'bashasam25@gmail.com',
      address: '1610 Ground Ground Bengaluru 41st Cross 18th main road 4th T block',
      city: 'Bengaluru',
      state: 'Karnataka',
      pincode: '560068',
      isDefault: true,
      isActive: true,
    };

    // Check if JS Enterprises warehouse already exists
    let warehouse = await prisma.warehouse.findFirst({
      where: {
        merchantId: req.user.merchantId,
        name: 'JS Enterprises',
      },
    });

    if (warehouse) {
      // Update existing
      warehouse = await prisma.warehouse.update({
        where: { id: warehouse.id },
        data: jsEnterprisesData,
      });
    } else {
      // Unset other defaults
      await prisma.warehouse.updateMany({
        where: {
          merchantId: req.user.merchantId,
          isDefault: true,
        },
        data: { isDefault: false },
      });

      // Create new
      warehouse = await prisma.warehouse.create({
        data: {
          ...jsEnterprisesData,
          merchantId: req.user.merchantId,
        },
      });
    }

    // Also register with Delhivery
    let delhiveryResult = { success: false, message: '' };
    try {
      const delhiveryData = {
        name: jsEnterprisesData.name,
        phone: jsEnterprisesData.phone,
        address: jsEnterprisesData.address,
        city: jsEnterprisesData.city,
        state: jsEnterprisesData.state,
        pin: jsEnterprisesData.pincode,
        country: 'India',
        return_name: jsEnterprisesData.name,
        return_address: jsEnterprisesData.address,
        return_city: jsEnterprisesData.city,
        return_state: jsEnterprisesData.state,
        return_pin: jsEnterprisesData.pincode,
      };

      const delhiveryResponse = await delhivery.createWarehouse(delhiveryData, req.user.merchantId);
      console.log('Delhivery warehouse response:', JSON.stringify(delhiveryResponse, null, 2));
      delhiveryResult = { success: true, message: 'Registered with Delhivery' };
    } catch (err: any) {
      console.error('Delhivery warehouse registration error:', err.response?.data || err.message);
      delhiveryResult = {
        success: false,
        message: err.response?.data?.message || err.message || 'Failed to register with Delhivery'
      };
    }

    res.json({
      success: true,
      message: 'JS Enterprises warehouse set up successfully',
      warehouse,
      delhiveryResult,
    });
  } catch (error) {
    next(error);
  }
});

// Sync warehouse to Delhivery
router.post('/:id/sync-to-delhivery', async (req: AuthRequest, res, next) => {
  try {
    if (!req.user?.merchantId) {
      throw new AppError(400, 'Merchant account required');
    }

    const warehouse = await prisma.warehouse.findFirst({
      where: {
        id: req.params.id,
        merchantId: req.user.merchantId,
      },
    });

    if (!warehouse) {
      throw new AppError(404, 'Warehouse not found');
    }

    const delhiveryData = {
      name: warehouse.name,
      phone: warehouse.phone,
      address: warehouse.address,
      city: warehouse.city,
      state: warehouse.state,
      pin: warehouse.pincode,
      country: 'India',
      return_name: warehouse.name,
      return_address: warehouse.address,
      return_city: warehouse.city,
      return_state: warehouse.state,
      return_pin: warehouse.pincode,
    };

    const delhiveryResponse = await delhivery.createWarehouse(delhiveryData, req.user.merchantId);
    console.log('Delhivery warehouse response:', JSON.stringify(delhiveryResponse, null, 2));

    res.json({
      success: true,
      message: 'Warehouse registered with Delhivery',
      delhiveryResponse,
    });
  } catch (error: any) {
    console.error('Delhivery sync error:', error.response?.data || error.message);
    res.status(400).json({
      success: false,
      error: error.response?.data?.message || error.message || 'Failed to sync to Delhivery',
    });
  }
});

// Fix all orders to use JS Enterprises warehouse
router.post('/fix-orders-warehouse', async (req: AuthRequest, res, next) => {
  try {
    if (!req.user?.merchantId) {
      throw new AppError(400, 'Merchant account required');
    }

    // Find the JS Enterprises warehouse
    let jsWarehouse = await prisma.warehouse.findFirst({
      where: {
        merchantId: req.user.merchantId,
        name: 'JS Enterprises',
      },
    });

    // If not found, create it
    if (!jsWarehouse) {
      jsWarehouse = await prisma.warehouse.create({
        data: {
          name: 'JS Enterprises',
          contactPerson: 'Samsudinbasha Jagirusen',
          phone: '9344268276',
          email: 'bashasam25@gmail.com',
          address: '1610 Ground Ground Bengaluru 41st Cross 18th main road 4th T block',
          city: 'Bengaluru',
          state: 'Karnataka',
          pincode: '560068',
          isDefault: true,
          isActive: true,
          merchantId: req.user.merchantId,
        },
      });
    }

    // Set JS Enterprises as the only default
    await prisma.warehouse.updateMany({
      where: {
        merchantId: req.user.merchantId,
        id: { not: jsWarehouse.id },
      },
      data: { isDefault: false },
    });

    await prisma.warehouse.update({
      where: { id: jsWarehouse.id },
      data: { isDefault: true },
    });

    // Update all orders to use this warehouse
    const updateResult = await prisma.order.updateMany({
      where: {
        merchantId: req.user.merchantId,
        awbNumber: null, // Only update orders without AWB (not yet shipped)
      },
      data: {
        warehouseId: jsWarehouse.id,
      },
    });

    res.json({
      success: true,
      message: `Fixed ${updateResult.count} orders to use JS Enterprises warehouse`,
      warehouse: jsWarehouse,
      ordersUpdated: updateResult.count,
    });
  } catch (error) {
    next(error);
  }
});

// Cleanup duplicate "Default Warehouse" entries: keep one per merchant, soft-delete the rest
router.post('/cleanup-default-duplicates', async (req: AuthRequest, res, next) => {
  try {
    if (!req.user?.merchantId) {
      throw new AppError(400, 'Merchant account required');
    }

    const defaults = await prisma.warehouse.findMany({
      where: {
        merchantId: req.user.merchantId,
        name: 'Default Warehouse',
        isActive: true,
      },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
    });

    if (defaults.length <= 1) {
      return res.json({
        success: true,
        message: 'No duplicate Default Warehouse entries to clean',
        kept: defaults.length,
        removed: 0,
      });
    }

    const [keep, ...duplicates] = defaults;
    const idsToDeactivate = duplicates.map((w) => w.id);
    await prisma.warehouse.updateMany({
      where: { id: { in: idsToDeactivate } },
      data: { isActive: false },
    });

    res.json({
      success: true,
      message: `Kept one Default Warehouse, removed ${duplicates.length} duplicate(s)`,
      kept: keep.id,
      removed: duplicates.length,
    });
  } catch (error) {
    next(error);
  }
});

// Cleanup placeholder/duplicate warehouses
router.post('/cleanup-duplicates', async (req: AuthRequest, res, next) => {
  try {
    if (!req.user?.merchantId) {
      throw new AppError(400, 'Merchant account required');
    }

    // Delete placeholder warehouses (soft delete)
    const placeholderNames = ['Main Warehouse', 'Secondary Warehouse', 'Default Warehouse'];

    const result = await prisma.warehouse.updateMany({
      where: {
        merchantId: req.user.merchantId,
        name: { in: placeholderNames },
      },
      data: { isActive: false },
    });

    res.json({
      success: true,
      message: `Removed ${result.count} placeholder warehouses`,
      removed: result.count,
    });
  } catch (error) {
    next(error);
  }
});

// Fetch pickup locations from Delhivery account
router.get('/delhivery/fetch', async (req: AuthRequest, res, next) => {
  try {
    if (!req.user?.merchantId) {
      throw new AppError(400, 'Merchant account required');
    }

    // Check if Delhivery is connected
    const merchant = await prisma.merchant.findUnique({
      where: { id: req.user.merchantId },
      select: { delhiveryEnabled: true, delhiveryApiKey: true },
    });

    if (!merchant?.delhiveryEnabled || !merchant?.delhiveryApiKey) {
      throw new AppError(400, 'Delhivery account not connected. Please connect your Delhivery account first.');
    }

    const delhiveryWarehouses = await delhivery.fetchDelhiveryWarehouses(req.user.merchantId);

    res.json({
      success: true,
      warehouses: delhiveryWarehouses,
    });
  } catch (error: any) {
    console.error('Error fetching Delhivery warehouses:', error.response?.data || error.message);
    next(error);
  }
});

// Sync pickup locations from Delhivery to Swiftora
router.post('/delhivery/sync', async (req: AuthRequest, res, next) => {
  try {
    if (!req.user?.merchantId) {
      throw new AppError(400, 'Merchant account required');
    }

    // Check if Delhivery is connected
    const merchant = await prisma.merchant.findUnique({
      where: { id: req.user.merchantId },
      select: { delhiveryEnabled: true, delhiveryApiKey: true },
    });

    if (!merchant?.delhiveryEnabled || !merchant?.delhiveryApiKey) {
      throw new AppError(400, 'Delhivery account not connected. Please connect your Delhivery account first.');
    }

    // Fetch warehouses from Delhivery
    const delhiveryResponse = await delhivery.fetchDelhiveryWarehouses(req.user.merchantId);

    // Handle different response formats from Delhivery
    let delhiveryWarehouses: any[] = [];
    if (Array.isArray(delhiveryResponse)) {
      delhiveryWarehouses = delhiveryResponse;
    } else if (delhiveryResponse?.data) {
      delhiveryWarehouses = Array.isArray(delhiveryResponse.data) ? delhiveryResponse.data : [];
    } else if (delhiveryResponse?.warehouses) {
      delhiveryWarehouses = delhiveryResponse.warehouses;
    }

    if (delhiveryWarehouses.length === 0) {
      return res.json({
        success: true,
        message: 'No pickup locations found in your Delhivery account',
        synced: 0,
        warehouses: [],
      });
    }

    const syncedWarehouses = [];
    let created = 0;
    let updated = 0;

    for (const dw of delhiveryWarehouses) {
      // Map Delhivery warehouse fields to our schema
      const warehouseData = {
        name: dw.name || dw.warehouse_name || dw.pickup_location || 'Unknown',
        contactPerson: dw.contact_person || dw.name || null,
        phone: dw.phone || dw.contact_phone || dw.registered_phone || '',
        email: dw.email || null,
        address: dw.address || dw.address_line1 || dw.add || '',
        city: dw.city || '',
        state: dw.state || '',
        pincode: dw.pin || dw.pincode || dw.pin_code || '',
        isActive: true,
        merchantId: req.user!.merchantId!,
      };

      // Check if warehouse with this name already exists
      const existingWarehouse = await prisma.warehouse.findFirst({
        where: {
          merchantId: req.user!.merchantId!,
          name: warehouseData.name,
        },
      });

      if (existingWarehouse) {
        // Update existing warehouse
        const updatedWarehouse = await prisma.warehouse.update({
          where: { id: existingWarehouse.id },
          data: warehouseData,
        });
        syncedWarehouses.push(updatedWarehouse);
        updated++;
      } else {
        // Create new warehouse
        const newWarehouse = await prisma.warehouse.create({
          data: warehouseData,
        });
        syncedWarehouses.push(newWarehouse);
        created++;
      }
    }

    // If this is the first sync and we have warehouses, set the first one as default
    if (created > 0) {
      const hasDefault = await prisma.warehouse.findFirst({
        where: {
          merchantId: req.user!.merchantId!,
          isDefault: true,
          isActive: true,
        },
      });

      if (!hasDefault && syncedWarehouses.length > 0) {
        await prisma.warehouse.update({
          where: { id: syncedWarehouses[0].id },
          data: { isDefault: true },
        });
      }
    }

    res.json({
      success: true,
      message: `Synced ${delhiveryWarehouses.length} pickup locations from Delhivery`,
      created,
      updated,
      synced: delhiveryWarehouses.length,
      warehouses: syncedWarehouses,
    });
  } catch (error: any) {
    console.error('Error syncing Delhivery warehouses:', error.response?.data || error.message);
    res.status(400).json({
      success: false,
      error: error.response?.data?.message || error.message || 'Failed to sync warehouses from Delhivery',
    });
  }
});

export const warehousesRouter = router;
