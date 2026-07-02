import bcrypt from "bcrypt";
import { prisma } from "../shared/config/prisma.js";
import { env } from "../shared/config/env.js";
import { DEFAULT_ROLE_PERMISSIONS, ROLES } from "../shared/constants/permissions.js";
import { logger } from "../shared/utils/logger.js";

const email = process.env.SUPERADMIN_EMAIL || "superadmin@restaurant.local";
const password = process.env.SUPERADMIN_PASSWORD || "SuperAdmin123!";
const name = process.env.SUPERADMIN_NAME || "Super Admin";

const run = async () => {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    logger.info({ message: "Super admin already exists", email });
    return;
  }

  await prisma.user.create({
    data: {
      restaurantId: null,
      name,
      email,
      password: await bcrypt.hash(password, env.bcryptSaltRounds),
      role: ROLES.SUPER_ADMIN,
      permissions: DEFAULT_ROLE_PERMISSIONS.SUPER_ADMIN,
    },
  });

  logger.info({ message: "Super admin created", email });
};

run()
  .catch((error) => {
    logger.error({ message: "Super admin seed failed", error });
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
