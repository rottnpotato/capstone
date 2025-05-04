import { db } from './connection';
import { Roles, Users, Categories, Products, Members } from './schema';
import * as bcrypt from 'bcrypt';
import { eq } from 'drizzle-orm';

/**
 * Seed the database with initial data
 */
async function Seed() {
  try {
    console.log('Starting database seeding...');

    console.log('Seeding roles...');
    let adminRoleItem = await db.query.Roles.findFirst({ where: eq(Roles.Name, 'Administrator') });
    if (!adminRoleItem) {
      const [inserted] = await db.insert(Roles).values({ Name: 'Administrator', Description: 'Full system access' }).returning();
      adminRoleItem = inserted;
      console.log(`Created role Administrator (ID ${adminRoleItem.RoleId})`);
    } else {
      console.log(`Role Administrator already exists (ID ${adminRoleItem.RoleId})`);
    }

    let cashierRoleItem = await db.query.Roles.findFirst({ where: eq(Roles.Name, 'Cashier') });
    if (!cashierRoleItem) {
      const [inserted] = await db.insert(Roles).values({ Name: 'Cashier', Description: 'Day-to-day operations access' }).returning();
      cashierRoleItem = inserted;
      console.log(`Created role Cashier (ID ${cashierRoleItem.RoleId})`);
    } else {
      console.log(`Role Cashier already exists (ID ${cashierRoleItem.RoleId})`);
    }

    let managerRoleItem = await db.query.Roles.findFirst({ where: eq(Roles.Name, 'Manager') });
    if (!managerRoleItem) {
      const [inserted] = await db.insert(Roles).values({ Name: 'Manager', Description: 'Department management access' }).returning();
      managerRoleItem = inserted;
      console.log(`Created role Manager (ID ${managerRoleItem.RoleId})`);
    } else {
      console.log(`Role Manager already exists (ID ${managerRoleItem.RoleId})`);
    }

    let memberRoleItem = await db.query.Roles.findFirst({ where: eq(Roles.Name, 'Member') });
    if (!memberRoleItem) {
      const [inserted] = await db.insert(Roles).values({ Name: 'Member', Description: 'Member access' }).returning();
      memberRoleItem = inserted;
      console.log(`Created role Member (ID ${memberRoleItem.RoleId})`);
    } else {
      console.log(`Role Member already exists (ID ${memberRoleItem.RoleId})`);
    }

    console.log('Seeding default admin user...');
    let adminUserItem = await db.query.Users.findFirst({ where: eq(Users.Email, 'admin@pandol.coop') });
    if (!adminUserItem) {
      const passwordHash = await bcrypt.hash('admin123', 10);
      const [inserted] = await db.insert(Users).values({
        Name: 'Admin User',
        Email: 'admin@pandol.coop',
        PasswordHash: passwordHash,
        RoleId: adminRoleItem.RoleId
      }).returning();
      adminUserItem = inserted;
      console.log(`Created admin user: ${adminUserItem.Email}`);
    } else {
      console.log(`Admin user already exists: ${adminUserItem.Email}`);
    }

    console.log('Seeding super admin user...');
    let superAdminItem = await db.query.Users.findFirst({ where: eq(Users.Email, 'superadmin@pandol.coop') });
    if (!superAdminItem) {
      const providedHash = '$2y$10$BJPzAATCmSqAu8yNIj7EEOKNXnyg97fW.Ar84MYboefZ2h1S5JxPm';
      const [inserted] = await db.insert(Users).values({
        Name: 'Super Admin',
        Email: 'superadmin@pandol.coop',
        PasswordHash: providedHash,
        RoleId: adminRoleItem.RoleId
      }).returning();
      superAdminItem = inserted;
      console.log(`Created super admin user: ${superAdminItem.Email}`);
    } else {
      console.log(`Super admin user already exists: ${superAdminItem.Email}`);
    }

    console.log('Seeding product categories...');
    const categoryData = [
      { name: 'Grocery', desc: 'Basic grocery items' },
      { name: 'Dairy', desc: 'Milk, cheese, and other dairy products' },
      { name: 'Beverages', desc: 'Drinks, juices, and water' },
      { name: 'Personal Care', desc: 'Personal hygiene and care products' },
      { name: 'Household', desc: 'Cleaning supplies and household essentials' }
    ];
    const categoryItems: Record<string, any> = {};
    for (const { name, desc } of categoryData) {
      let cat = await db.query.Categories.findFirst({ where: eq(Categories.Name, name) });
      if (!cat) {
        const [inserted] = await db.insert(Categories).values({ Name: name, Description: desc }).returning();
        cat = inserted;
        console.log(`Created category ${name}`);
      } else {
        console.log(`Category ${name} already exists`);
      }
      categoryItems[name] = cat;
    }

    console.log('Seeding initial products...');
    const productData = [
      { name: 'Organic Rice', sku: 'GRO-RICE-001', price: '500.00', qty: 50, cat: 'Grocery', desc: 'Locally sourced organic rice' },
      { name: 'Fresh Eggs', sku: 'DAI-EGGS-001', price: '180.00', qty: 30, cat: 'Dairy', desc: 'Farm fresh eggs (1 tray)' },
      { name: 'Coconut Oil', sku: 'GRO-OIL-001', price: '250.00', qty: 25, cat: 'Grocery', desc: 'Virgin coconut oil (1L)' },
      { name: 'Coffee Beans', sku: 'BEV-COF-001', price: '300.00', qty: 15, cat: 'Beverages', desc: 'Locally grown coffee beans (500g)' },
      { name: 'Honey', sku: 'GRO-HON-001', price: '280.00', qty: 20, cat: 'Grocery', desc: 'Pure organic honey (500ml)' }
    ];
    for (const p of productData) {
      let prod = await db.query.Products.findFirst({ where: eq(Products.Sku, p.sku) });
      if (!prod) {
        await db.insert(Products).values({
          Name: p.name,
          Description: p.desc,
          Sku: p.sku,
          Price: p.price,
          StockQuantity: p.qty,
          CategoryId: categoryItems[p.cat].CategoryId
        });
        console.log(`Created product ${p.name}`);
      } else {
        console.log(`Product ${prod.Sku} already exists`);
      }
    }

    console.log('Seeding initial members...');
    const memberData = [
      { name: 'Maria Santos', email: 'maria@example.com', phone: '+639123456789', address: '123 Main St, Metro Manila', credit: '1000.00' },
      { name: 'Juan Dela Cruz', email: 'juan@example.com', phone: '+639234567890', address: '456 Second St, Metro Manila', credit: '500.00' },
      { name: 'Ana Reyes', email: 'ana@example.com', phone: '+639345678901', address: '789 Third St, Metro Manila', credit: '1500.00' },
      { name: 'Pedro Lim', email: 'pedro@example.com', phone: '+639456789012', address: '246 Fourth St, Metro Manila', credit: '750.00' },
      { name: 'Sofia Garcia', email: 'sofia@example.com', phone: '+639567890123', address: '135 Fifth St, Metro Manila', credit: '2000.00' }
    ];
    for (const m of memberData) {
      let mem = await db.query.Members.findFirst({ where: eq(Members.Email, m.email) });
      if (!mem) {
        await db.insert(Members).values({
          Name: m.name,
          Email: m.email,
          Phone: m.phone,
          Address: m.address,
          CreditBalance: m.credit
        });
        console.log(`Created member ${m.name}`);
      } else {
        console.log(`Member ${m.email} already exists`);
      }
    }

    console.log('Database seeding completed successfully');
  } catch (error) {
    console.error('Error seeding database:', error);
    throw error;
  }
}

// Run the seed function
Seed()
  .then(() => {
    console.log('Seed completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exit(1);
  }); 