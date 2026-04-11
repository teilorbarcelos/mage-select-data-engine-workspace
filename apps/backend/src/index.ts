import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';

const app = express();
app.use(cors());
app.use(express.json());

const prisma = new PrismaClient();

app.get('/users', async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const pageSize = 50;
  const search = req.query.search as string | undefined;
  const columns = (req.query.columns as string | undefined)?.split(',') || [];

  try {
    let whereClause = {};

    if (search && columns.length > 0) {
      whereClause = {
        OR: columns.map(col => ({
          [col]: {
            contains: search,
          }
        }))
      };
    }

    const users = await prisma.user.findMany({
      where: whereClause,
      take: pageSize + 1, // Fetch one more to check if there is a next page
      skip: (page - 1) * pageSize,
      orderBy: { id: 'asc' },
    });

    let hasMore = false;
    if (users.length > pageSize) {
      hasMore = true;
      users.pop(); // Remove the extra item
    }

    res.json({ items: users, hasMore });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

app.get('/users/by-ids', async (req, res) => {
  const idsParam = req.query.ids as string | undefined;
  
  if (!idsParam) {
    return res.json([]);
  }

  const ids = idsParam.split(',').filter(Boolean);

  try {
    const users = await prisma.user.findMany({
      where: {
        id: {
          in: ids,
        },
      },
    });

    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch users by ids' });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Backend server listening natively on port ${PORT}`);
});
