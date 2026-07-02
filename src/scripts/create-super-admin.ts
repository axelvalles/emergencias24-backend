import * as bcrypt from 'bcrypt';

import AppDataSource from '../config/typeorm.config';
import { AmbulanceUnit } from '../ambulance-units/entities/ambulance-unit.entity';
import { User, UserRole, UserStatus } from '../users/entities/user.entity';

interface SeedUserConfig {
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  phone: string | null;
  role: UserRole;
}

const DEFAULT_USER_PASSWORD = process.env.SEED_DEFAULT_PASSWORD;

function getRequiredEnv(name: string): string {
  const value = process.env[name]?.trim();

  if (!value) {
    console.error(`Missing required environment variable: ${name}`);
    process.exit(1);
  }

  return value;
}

function getSeedUserConfig(
  role: UserRole,
  prefix: 'SUPERUSER' | 'ADMIN_USER' | 'DISPATCHER_USER' | 'PARAMEDIC_USER',
  defaults: {
    email: string;
    firstName: string;
    lastName: string;
    phone?: string;
  },
  fallbackPassword?: string,
): SeedUserConfig {
  const password =
    process.env[`${prefix}_PASSWORD`]?.trim() ||
    DEFAULT_USER_PASSWORD ||
    fallbackPassword ||
    '';

  if (!password) {
    console.error(
      `Missing password for ${prefix}. Define ${prefix}_PASSWORD or SEED_DEFAULT_PASSWORD.`,
    );
    process.exit(1);
  }

  return {
    role,
    email: process.env[`${prefix}_EMAIL`]?.trim() || defaults.email,
    firstName: process.env[`${prefix}_FIRSTNAME`]?.trim() || defaults.firstName,
    lastName: process.env[`${prefix}_LASTNAME`]?.trim() || defaults.lastName,
    phone: process.env[`${prefix}_PHONE`]?.trim() || defaults.phone || null,
    password,
  };
}

async function ensureUser(config: SeedUserConfig): Promise<User> {
  const userRepository = AppDataSource.getRepository(User);
  const passwordHash = await bcrypt.hash(config.password, 10);

  const existingUser = await userRepository.findOne({
    where: { email: config.email },
    relations: ['ambulanceUnits', 'activeAmbulanceUnit'],
  });

  if (existingUser) {
    existingUser.firstName = config.firstName;
    existingUser.lastName = config.lastName;
    existingUser.phone = config.phone;
    existingUser.passwordHash = passwordHash;
    existingUser.role = config.role;
    existingUser.status = UserStatus.ACTIVE;

    if (config.role !== UserRole.PARAMEDIC) {
      existingUser.ambulanceUnits = [];
      existingUser.activeAmbulanceUnit = null;
    }

    await userRepository.save(existingUser);
    console.log(`User updated: ${existingUser.email} (${existingUser.role})`);
    return existingUser;
  }

  const user = userRepository.create({
    email: config.email,
    firstName: config.firstName,
    lastName: config.lastName,
    phone: config.phone,
    passwordHash,
    role: config.role,
    status: UserStatus.ACTIVE,
  });

  const savedUser = await userRepository.save(user);
  console.log(`User created: ${savedUser.email} (${savedUser.role})`);
  return savedUser;
}

async function ensureAmbulanceUnit(user: User): Promise<void> {
  const userRepository = AppDataSource.getRepository(User);
  const ambulanceUnitRepository = AppDataSource.getRepository(AmbulanceUnit);
  const unitName =
    process.env.AMBULANCE_UNIT_NAME?.trim() || 'Unidad Seed Ambulancia';

  let ambulanceUnit = await ambulanceUnitRepository.findOne({
    where: { name: unitName },
    relations: ['members'],
  });

  if (!ambulanceUnit) {
    ambulanceUnit = ambulanceUnitRepository.create({
      name: unitName,
      members: [user],
    });
  } else if (!ambulanceUnit.members.some((member) => member.id === user.id)) {
    ambulanceUnit.members = [...ambulanceUnit.members, user];
  }

  ambulanceUnit = await ambulanceUnitRepository.save(ambulanceUnit);

  const ambulanceUser = await userRepository.findOne({
    where: { id: user.id },
    relations: ['ambulanceUnits', 'activeAmbulanceUnit'],
  });

  if (!ambulanceUser) {
    throw new Error(`Ambulance user with ID ${user.id} not found after save`);
  }

  ambulanceUser.activeAmbulanceUnit = ambulanceUnit;
  await userRepository.save(ambulanceUser);

  console.log(
    `Ambulance unit ensured: ${ambulanceUnit.name} -> ${ambulanceUser.email}`,
  );
}

async function main() {
  const superuserPassword = getRequiredEnv('SUPERUSER_PASSWORD');

  const usersToSeed: SeedUserConfig[] = [
    {
      role: UserRole.SUPER_ADMIN,
      email: getRequiredEnv('SUPERUSER_EMAIL'),
      firstName: getRequiredEnv('SUPERUSER_FIRSTNAME'),
      lastName: getRequiredEnv('SUPERUSER_LASTNAME'),
      phone: process.env.SUPERUSER_PHONE?.trim() || null,
      password: superuserPassword,
    },
    getSeedUserConfig(
      UserRole.ADMIN,
      'ADMIN_USER',
      {
        email: 'admin@example.com',
        firstName: 'Admin',
        lastName: 'Seed',
      },
      superuserPassword,
    ),
    getSeedUserConfig(
      UserRole.DISPATCHER,
      'DISPATCHER_USER',
      {
        email: 'dispatcher@example.com',
        firstName: 'Dispatcher',
        lastName: 'Seed',
      },
      superuserPassword,
    ),
    getSeedUserConfig(
      UserRole.PARAMEDIC,
      'PARAMEDIC_USER',
      {
        email: 'ambulance@example.com',
        firstName: 'Ambulance',
        lastName: 'Seed',
      },
      superuserPassword,
    ),
  ];

  try {
    await AppDataSource.initialize();
    console.log('Database connection established');

    const queryRunner = AppDataSource.createQueryRunner();
    const hasUsersTable = await queryRunner.hasTable('users');
    await queryRunner.release();

    if (!hasUsersTable) {
      throw new Error(
        'The database is not migrated yet. Run `pnpm migration:run` before `pnpm seed`.',
      );
    }

    const seededUsers = new Map<UserRole, User>();

    for (const config of usersToSeed) {
      const user = await ensureUser(config);
      seededUsers.set(config.role, user);
    }

    const ambulanceUser = seededUsers.get(UserRole.PARAMEDIC);

    if (!ambulanceUser) {
      throw new Error('Ambulance seed user was not created');
    }

    await ensureAmbulanceUnit(ambulanceUser);

    console.log('Seed completed successfully');
    await AppDataSource.destroy();
    console.log('Database connection closed');
  } catch (error) {
    console.error('Error seeding users:', error);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('Error running seed:', error);
  process.exit(1);
});
