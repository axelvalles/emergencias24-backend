import * as bcrypt from 'bcrypt';

async function main() {
  // Cambia los valores por lo que quieras
  const email = process.env.SUPERUSER_EMAIL || '';
  const rawPassword = process.env.SUPERUSER_PASSWORD || '';
  const firstName = process.env.SUPERUSER_FIRSTNAME || '';
  const lastName = process.env.SUPERUSER_LASTNAME || '';

  // Crear usuario
  const saltRounds = 10;
  const passwordHash = await bcrypt.hash(rawPassword, saltRounds);

  console.log({
    email,
    password_hash: passwordHash,
    roles: 'super_admin',
    is_active: true,
    first_name: firstName,
    last_name: lastName,
    phone: process.env.SUPERUSER_PHONE || null,
  });
}

main().catch((err) => {
  console.error('Error creating superuser:', err);
  process.exit(1);
});
