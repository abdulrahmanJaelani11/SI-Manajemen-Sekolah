import prisma from '../src/lib/prisma';

async function syncRoleMenus() {
  console.log('=== MEMULAI SINKRONISASI ROLE MENUS ===');

  const [roles, menus] = await Promise.all([
    prisma.secRole.findMany({ orderBy: { id: 'asc' } }),
    prisma.secMenu.findMany({ orderBy: { urutan: 'asc' } }),
  ]);

  console.log(`Ditemukan ${roles.length} Role dan ${menus.length} Menu.`);

  let totalInserted = 0;

  for (const role of roles) {
    const isAdmin = role.namaRole.toLowerCase() === 'administrator' || role.id === 1;
    const existingRoleMenus = await prisma.secRoleMenu.findMany({
      where: { roleId: role.id },
      select: { menuId: true },
    });

    const existingMenuIdSet = new Set(existingRoleMenus.map((rm) => rm.menuId));
    const missingMenus = menus.filter((m) => !existingMenuIdSet.has(m.id));

    if (missingMenus.length > 0) {
      console.log(`Role [${role.id}] "${role.namaRole}": ${missingMenus.length} menu belum terdaftar. Melakukan sinkronisasi...`);

      for (const menu of missingMenus) {
        await prisma.secRoleMenu.create({
          data: {
            roleId: role.id,
            menuId: menu.id,
            canView: isAdmin,
            canCreate: isAdmin,
            canEdit: isAdmin,
            canDelete: isAdmin,
          },
        });
        totalInserted++;
      }
    } else {
      console.log(`Role [${role.id}] "${role.namaRole}": Lengkap (${menus.length}/${menus.length} menu).`);
    }
  }

  console.log(`\n=== SINKRONISASI SELESAI ===`);
  console.log(`Total record SecRoleMenu baru ditambahkan: ${totalInserted}`);

  process.exit(0);
}

syncRoleMenus().catch((err) => {
  console.error('Error saat sinkronisasi role menus:', err);
  process.exit(1);
});
