// scripts/create-superuser.ts
import 'reflect-metadata';
import * as bcrypt from 'bcrypt';

// Ajusta las importaciones según tu estructura real
import { User, UserRole } from '../src/users/entities/user.entity';
import ScriptDataSource from 'src/config/typeorm-cli.config';
// Si tus entidades están en otras rutas, actualiza las rutas de importación.

async function main() {
  const { DB_HOST, DB_USERNAME, DB_PASSWORD, DB_NAME } = process.env;

  if (!DB_HOST || !DB_USERNAME || !DB_PASSWORD || !DB_NAME) {
    console.error(
      'Please set DB_HOST, DB_PORT, DB_USER, DB_PASS and DB_NAME in your .env',
    );
    process.exit(1);
  }

  await ScriptDataSource.initialize();

  console.log('DataSource initialized');

  const userRepo = ScriptDataSource.getRepository(User);

  // Cambia los valores por lo que quieras
  const email = process.env.SUPERUSER_EMAIL || 'superadmin@example.com';
  const rawPassword = process.env.SUPERUSER_PASSWORD || 'SuperSecret123!';
  const firstName = process.env.SUPERUSER_FIRSTNAME || 'Super';
  const lastName = process.env.SUPERUSER_LASTNAME || 'Admin';

  // Verificar si ya existe
  const existing = await userRepo.findOne({ where: { email } });
  if (existing) {
    console.log(
      `User with email ${email} already exists (id=${existing.id}). Exiting.`,
    );
    await ScriptDataSource.destroy();
    process.exit(0);
  }

  // Crear usuario
  const saltRounds = 10;
  const passwordHash = await bcrypt.hash(rawPassword, saltRounds);

  const user = userRepo.create({
    email,
    password_hash: passwordHash,
    roles: [UserRole.SUPER_ADMIN],
    is_active: true,
    first_name: firstName,
    last_name: lastName,
    phone: process.env.SUPERUSER_PHONE || null,
  });

  const savedUser = await userRepo.save(user);

  console.log(
    `Admin profile created with id=${savedUser.id} linked to user.id=${savedUser.id}`,
  );

  console.log('Superuser creation complete:');
  console.log(`  email: ${email}`);
  console.log(`  password: ${rawPassword}`);
  console.log('IMPORTANT: Change this password after first login.');

  await ScriptDataSource.destroy();
  process.exit(0);
}

main().catch((err) => {
  console.error('Error creating superuser:', err);
  process.exit(1);
});
