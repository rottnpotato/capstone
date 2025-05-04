import { db } from './connection';
import { Roles, Users } from './schema';
import { eq } from 'drizzle-orm';

/**
 * Seed an admin user with a specific password hash
 */
async function SeedAdmin() {
  try {
    console.log('Starting admin user seeding...');

    // Check if Administrator role exists
    console.log('Finding admin role...');
    let adminRole = await db.query.Roles.findFirst({ where: eq(Roles.Name, 'Administrator') });

    // Create Admin role if it doesn't exist
    if (!adminRole) {
      console.log('Admin role not found, creating it...');
      const [insertedRole] = await db.insert(Roles).values({ Name: 'Administrator', Description: 'Full system access' }).returning();
      adminRole = insertedRole;
      console.log(`Created Administrator role with ID: ${adminRole.RoleId}`);
    } else {
      console.log(`Found existing Administrator role with ID: ${adminRole.RoleId}`);
    }

    // Check if the superadmin user already exists to avoid duplicates
    const existingUser = await db.query.Users.findFirst({
      where: eq(Users.Email, 'superadmin@pandol.coop')
    });

    if (existingUser) {
      console.log(`User with email superadmin@pandol.coop already exists`);
    } else {
      // Add admin with provided password hash
      console.log('Seeding admin with provided credentials...');
      const providedPasswordHash = '$2y$10$BJPzAATCmSqAu8yNIj7EEOKNXnyg97fW.Ar84MYboefZ2h1S5JxPm';
      
      const [superAdmin] = await db.insert(Users).values({
        Name: 'Super Admin',
        Email: 'superadmin@pandol.coop',
        PasswordHash: providedPasswordHash,
        RoleId: adminRole.RoleId,
      }).returning();
      
      console.log(`Created super admin user: ${superAdmin.Email}`);
    }

    console.log('Admin user seeding completed successfully');
  } catch (error) {
    console.error('Error seeding admin user:', error);
    throw error;
  }
}

// Run the seed function
SeedAdmin()
  .then(() => {
    console.log('Admin seed completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Admin seed failed:', error);
    process.exit(1);
  }); 