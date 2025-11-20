import { db } from './connection';
import { Roles, Users, Categories, Products, Members, Transactions, TransactionItems, Events, MemberActivities } from './schema';
import bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

/**
 * Seed the database with initial data
 */
async function seed() {
  try {
    console.log('Starting database seed...');
    
    // Check if we already have data
    const existingRoles = await db.select().from(Roles);
    if (existingRoles.length > 0) {
      console.log('Database already has data. Skipping seed.');
      return;
    }
    
    // Seed roles
    console.log('Seeding roles...');
    const roles = await db.insert(Roles).values([
      { Name: 'Administrator', Description: 'System administrator with full access' },
      { Name: 'Manager', Description: 'Manager with access to admin functions' },
      { Name: 'Cashier', Description: 'Cashier with access to POS system' },
      { Name: 'Member', Description: 'Cooperative member' }
    ]).returning();
    console.log(`Seeded ${roles.length} roles`);
    
    // Get role IDs
    const adminRoleId = roles.find(r => r.Name === 'Administrator')?.RoleId;
    const cashierRoleId = roles.find(r => r.Name === 'Cashier')?.RoleId;
    const memberRoleId = roles.find(r => r.Name === 'Member')?.RoleId;
    
    if (!adminRoleId || !cashierRoleId || !memberRoleId) {
      throw new Error('Failed to retrieve role IDs');
    }
    
    // Seed users
    console.log('Seeding users...');
    const passwordHash = await bcrypt.hash('password123', 10);
    
    const users = await db.insert(Users).values([
      { 
        Name: 'Admin User', 
        Email: 'admin@example.com',
        PasswordHash: passwordHash,
        RoleId: adminRoleId
      },
      { 
        Name: 'Cashier User', 
        Email: 'cashier@example.com',
        PasswordHash: passwordHash,
        RoleId: cashierRoleId
      },
      { 
        Name: 'Juan Dela Cruz', 
        Email: 'juan@example.com',
        PasswordHash: passwordHash,
        RoleId: memberRoleId
      },
      { 
        Name: 'Maria Santos', 
        Email: 'maria@example.com',
        PasswordHash: passwordHash,
        RoleId: memberRoleId
      }
    ]).returning();
    console.log(`Seeded ${users.length} users`);
    
    // Get user IDs
    const adminUserId = users.find(u => u.Email === 'admin@example.com')?.UserId;
    const cashierUserId = users.find(u => u.Email === 'cashier@example.com')?.UserId;
    const juanUserId = users.find(u => u.Email === 'juan@example.com')?.UserId;
    const mariaUserId = users.find(u => u.Email === 'maria@example.com')?.UserId;
    
    if (!adminUserId || !cashierUserId || !juanUserId || !mariaUserId) {
      throw new Error('Failed to retrieve user IDs');
    }
    
    // Seed members
    console.log('Seeding members...');
    const members = await db.insert(Members).values([
      {
        Name: 'Juan Dela Cruz',
        Email: 'juan@example.com',
        Phone: '+63 912 345 6789',
        Address: '123 Main St, Manila',
        CreditBalance: '500.00',
        UserId: juanUserId
      },
      {
        Name: 'Maria Santos',
        Email: 'maria@example.com',
        Phone: '+63 923 456 7890',
        Address: '456 Oak St, Quezon City',
        CreditBalance: '750.50',
        UserId: mariaUserId
      }
    ]).returning();
    console.log(`Seeded ${members.length} members`);
    
    // Get member IDs
    const juanMemberId = members.find(m => m.Email === 'juan@example.com')?.MemberId;
    const mariaMemberId = members.find(m => m.Email === 'maria@example.com')?.MemberId;
    
    if (!juanMemberId || !mariaMemberId) {
      throw new Error('Failed to retrieve member IDs');
    }
    
    // Seed categories
    console.log('Seeding categories...');
    const categories = await db.insert(Categories).values([
      { Name: 'Grocery', Description: 'Grocery items' },
      { Name: 'Electronics', Description: 'Electronic devices and accessories' },
      { Name: 'Household', Description: 'Household items and supplies' },
      { Name: 'School Supplies', Description: 'Educational materials and office supplies' },
      { Name: 'Beverages', Description: 'Drinks and liquid refreshments' }
    ]).returning();
    console.log(`Seeded ${categories.length} categories`);
    
    // Get category IDs
    const groceryCategoryId = categories.find(c => c.Name === 'Grocery')?.CategoryId;
    const electronicsCategoryId = categories.find(c => c.Name === 'Electronics')?.CategoryId;
    const householdCategoryId = categories.find(c => c.Name === 'Household')?.CategoryId;
    const schoolCategoryId = categories.find(c => c.Name === 'School Supplies')?.CategoryId;
    const beveragesCategoryId = categories.find(c => c.Name === 'Beverages')?.CategoryId;
    
    if (!groceryCategoryId || !electronicsCategoryId || !householdCategoryId || !schoolCategoryId || !beveragesCategoryId) {
      throw new Error('Failed to retrieve category IDs');
    }
    
    // Seed products
    console.log('Seeding products...');
    const products = await db.insert(Products).values([
      {
        Name: 'Rice',
        Description: 'Premium white rice, 5kg',
        Sku: 'GRO-001',
        Price: '250.00',
        BasePrice: '200.00',
        StockQuantity: 100,
        CategoryId: groceryCategoryId,
        Supplier: 'ABC Farm Supplies',
        Image: '/products/rice.jpg'
      },
      {
        Name: 'USB Flash Drive',
        Description: '16GB USB 3.0 Flash Drive',
        Sku: 'ELE-001',
        Price: '350.00',
        BasePrice: '280.00',
        StockQuantity: 30,
        CategoryId: electronicsCategoryId,
        Supplier: 'Tech Gadgets Inc',
        Image: '/products/usb.jpg'
      },
      {
        Name: 'Dish Soap',
        Description: 'Liquid dish soap, 500ml',
        Sku: 'HOU-001',
        Price: '75.50',
        BasePrice: '60.00',
        StockQuantity: 50,
        CategoryId: householdCategoryId,
        Supplier: 'Home Clean Supplies',
        Image: '/products/dish-soap.jpg'
      },
      {
        Name: 'Notebook',
        Description: 'College-ruled notebook, 100 pages',
        Sku: 'SCH-001',
        Price: '45.00',
        BasePrice: '30.00',
        StockQuantity: 200,
        CategoryId: schoolCategoryId,
        Supplier: 'ABC School Supplies',
        Image: '/products/notebook.jpg'
      },
      {
        Name: 'Bottled Water',
        Description: 'Purified water, 500ml',
        Sku: 'BEV-001',
        Price: '15.00',
        BasePrice: '10.00',
        StockQuantity: 500,
        CategoryId: beveragesCategoryId,
        Supplier: 'Clean Waters Inc',
        Image: '/products/water.jpg'
      }
    ]).returning();
    console.log(`Seeded ${products.length} products`);
    
    // Get product IDs
    const riceProductId = products.find(p => p.Sku === 'GRO-001')?.ProductId;
    const usbProductId = products.find(p => p.Sku === 'ELE-001')?.ProductId;
    const dishSoapProductId = products.find(p => p.Sku === 'HOU-001')?.ProductId;
    const notebookProductId = products.find(p => p.Sku === 'SCH-001')?.ProductId;
    const waterProductId = products.find(p => p.Sku === 'BEV-001')?.ProductId;
    
    if (!riceProductId || !usbProductId || !dishSoapProductId || !notebookProductId || !waterProductId) {
      throw new Error('Failed to retrieve product IDs');
    }
    
    // Seed transactions
    console.log('Seeding transactions...');
    const transactions = await db.insert(Transactions).values([
      {
        Timestamp: new Date(Date.now() - 86400000 * 2), // 2 days ago
        UserId: cashierUserId,
        MemberId: juanMemberId,
        TotalAmount: '545.00',
        PaymentMethod: 'Cash'
      },
      {
        Timestamp: new Date(Date.now() - 86400000), // 1 day ago
        UserId: cashierUserId,
        MemberId: mariaMemberId,
        TotalAmount: '1250.00',
        PaymentMethod: 'Credit'
      },
      {
        Timestamp: new Date(), // Today
        UserId: cashierUserId,
        TotalAmount: '90.00',
        PaymentMethod: 'Cash'
      }
    ]).returning();
    console.log(`Seeded ${transactions.length} transactions`);
    
    // Seed transaction items
    console.log('Seeding transaction items...');
    const transactionItems = await db.insert(TransactionItems).values([
      {
        TransactionId: transactions[0].TransactionId,
        ProductId: riceProductId,
        Quantity: 1,
        PriceAtTimeOfSale: '250.00',
        BasePriceAtTimeOfSale: '200.00',
        Profit: '50.00'
      },
      {
        TransactionId: transactions[0].TransactionId,
        ProductId: waterProductId,
        Quantity: 2,
        PriceAtTimeOfSale: '15.00',
        BasePriceAtTimeOfSale: '10.00',
        Profit: '10.00'
      },
      {
        TransactionId: transactions[0].TransactionId,
        ProductId: notebookProductId,
        Quantity: 1,
        PriceAtTimeOfSale: '45.00',
        BasePriceAtTimeOfSale: '30.00',
        Profit: '15.00'
      },
      {
        TransactionId: transactions[0].TransactionId,
        ProductId: dishSoapProductId,
        Quantity: 1,
        PriceAtTimeOfSale: '75.50',
        BasePriceAtTimeOfSale: '60.00',
        Profit: '15.50'
      },
      {
        TransactionId: transactions[1].TransactionId,
        ProductId: usbProductId,
        Quantity: 1,
        PriceAtTimeOfSale: '350.00',
        BasePriceAtTimeOfSale: '280.00',
        Profit: '70.00'
      },
      {
        TransactionId: transactions[1].TransactionId,
        ProductId: riceProductId,
        Quantity: 2,
        PriceAtTimeOfSale: '250.00',
        BasePriceAtTimeOfSale: '200.00',
        Profit: '100.00'
      },
      {
        TransactionId: transactions[2].TransactionId,
        ProductId: waterProductId,
        Quantity: 6,
        PriceAtTimeOfSale: '15.00',
        BasePriceAtTimeOfSale: '10.00',
        Profit: '30.00'
      }
    ]).returning();
    console.log(`Seeded ${transactionItems.length} transaction items`);

    // Seed upcoming events
    console.log('Seeding events...');
    const now = new Date();
    const events = await db.insert(Events).values([
      {
        Title: "Inventory Restocking",
        Description: "Regular inventory restocking of all products",
        EventDate: new Date(now.getFullYear(), now.getMonth() + 1, 15), // Next month, day 15
        Type: "Operation"
      },
      {
        Title: "Financial Literacy Workshop",
        Description: "Workshop to help members understand financial management",
        EventDate: new Date(now.getFullYear(), now.getMonth() + 1, 20), // Next month, day 20
        Type: "Community"
      },
      {
        Title: "Monthly Financial Review",
        Description: "Regular monthly financial review meeting",
        EventDate: new Date(now.getFullYear(), now.getMonth() + 1, 30), // Next month, day 30
        Type: "Management"
      },
      {
        Title: "Member Assembly",
        Description: "Annual general assembly for all cooperative members",
        EventDate: new Date(now.getFullYear(), now.getMonth() + 2, 5), // Two months from now, day 5
        Type: "Community"
      }
    ]).returning();
    console.log(`Seeded ${events.length} events`);

    // Seed member activities
    console.log('Seeding member activities...');
    const memberActivities = await db.insert(MemberActivities).values([
      {
        MemberId: mariaMemberId,
        Action: "Made a purchase",
        Amount: "1250.00",
        Timestamp: new Date(Date.now() - 3600000 * 2), // 2 hours ago
        RelatedTransactionId: transactions[1].TransactionId
      },
      {
        MemberId: juanMemberId,
        Action: "Paid credit balance",
        Amount: "500.00",
        Timestamp: new Date(Date.now() - 3600000 * 5) // 5 hours ago
      },
      {
        MemberId: mariaMemberId,
        Action: "Updated profile information",
        Timestamp: new Date(Date.now() - 86400000) // Yesterday
      },
      {
        MemberId: juanMemberId,
        Action: "Made a purchase",
        Amount: "450.25",
        Timestamp: new Date(Date.now() - 86400000) // Yesterday
      },
      {
        MemberId: mariaMemberId,
        Action: "Requested credit increase",
        Timestamp: new Date(Date.now() - 86400000 * 2) // 2 days ago
      }
    ]).returning();
    console.log(`Seeded ${memberActivities.length} member activities`);
    
    console.log('Database seed completed successfully!');
  } catch (error) {
    console.error('Error seeding database:', error);
  }
}

// Run the seed function
seed(); 