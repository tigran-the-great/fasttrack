import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  const shipments = [
    {
      orderId: 'ORD-2024-001',
      customerName: 'John Doe',
      destination: '123 Main St, New York, NY 10001',
      status: 'PENDING' as const,
    },
    {
      orderId: 'ORD-2024-002',
      customerName: 'Jane Smith',
      destination: '456 Oak Ave, Los Angeles, CA 90001',
      status: 'IN_TRANSIT' as const,
    },
    {
      orderId: 'ORD-2024-003',
      customerName: 'Bob Wilson',
      destination: '789 Pine Rd, Chicago, IL 60601',
      status: 'DELIVERED' as const,
    },
    {
      orderId: 'ORD-2024-004',
      customerName: 'Alice Brown',
      destination: '321 Elm St, Houston, TX 77001',
      status: 'PENDING' as const,
    },
    {
      orderId: 'ORD-2024-005',
      customerName: 'Charlie Davis',
      destination: '654 Maple Dr, Phoenix, AZ 85001',
      status: 'IN_TRANSIT' as const,
    },
  ];

  for (const shipment of shipments) {
    await prisma.shipment.upsert({
      where: { orderId: shipment.orderId },
      update: {},
      create: shipment,
    });
  }

  console.log(`Seeded ${shipments.length} shipments`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
