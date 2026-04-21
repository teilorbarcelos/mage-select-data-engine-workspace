import { PrismaClient } from '@prisma/client';
import cors from 'cors';
import express from 'express';
import { handlePrismaMageHydration, handlePrismaMageRequest } from 'mage-select-data-engine/server';

const app = express();
app.use(cors());
app.use(express.json());

const prisma = new PrismaClient();

app.get('/users', async (req, res) => {
  try {
    const result = await handlePrismaMageRequest(prisma.user, req.query, {
      orderBy: { name: 'asc' },
      searchFields: ['name', 'email'], // Define default fields to search
      mappings: {
        pageSize: 'size', // Frontend sends 'size' instead of 'pageSize'
      }
    });
    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

app.get('/users/by-ids', async (req, res) => {
  try {
    const result = await handlePrismaMageHydration(prisma.user, req.query);
    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch users by ids' });
  }
});

const PORT = process.env.PORT || 8888;
app.listen(PORT, () => {
  console.log(`Backend server listening natively on port ${PORT}`);
});
