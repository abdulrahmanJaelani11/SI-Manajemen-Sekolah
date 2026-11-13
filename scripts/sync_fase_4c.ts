import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🔄 Menyinkronkan menu Laporan Arus Kas Terpadu...')

  const menu = await prisma.secMenu.upsert({
    where: { path: '/keuangan/laporan' },
    update: {
      namaMenu: 'Laporan Arus Kas Terpadu',
      icon: 'IconReportAnalytics',
      groupMenu: 'Keuangan & SPP',
      urutan: 25,
    },
    create: {
      namaMenu: 'Laporan Arus Kas Terpadu',
      path: '/keuangan/laporan',
      icon: 'IconReportAnalytics',
      groupMenu: 'Keuangan & SPP',
      urutan: 25,
    },
  })

  // Role Administrator
  const adminRole = await prisma.secRole.findUnique({ where: { namaRole: 'Administrator' } })
  if (adminRole) {
    await prisma.secRoleMenu.upsert({
      where: {
        roleId_menuId: {
          roleId: adminRole.id,
          menuId: menu.id,
        },
      },
      update: {
        canView: true,
        canCreate: true,
        canEdit: true,
        canDelete: true,
      },
      create: {
        roleId: adminRole.id,
        menuId: menu.id,
        canView: true,
        canCreate: true,
        canEdit: true,
        canDelete: true,
      },
    })
    console.log('✅ Menu ditautkan ke role Administrator')
  }

  // Role Bendahara
  const bendaharaRole = await prisma.secRole.findUnique({ where: { namaRole: 'Bendahara' } })
  if (bendaharaRole) {
    await prisma.secRoleMenu.upsert({
      where: {
        roleId_menuId: {
          roleId: bendaharaRole.id,
          menuId: menu.id,
        },
      },
      update: {
        canView: true,
        canCreate: true,
        canEdit: true,
        canDelete: true,
      },
      create: {
        roleId: bendaharaRole.id,
        menuId: menu.id,
        canView: true,
        canCreate: true,
        canEdit: true,
        canDelete: true,
      },
    })
    console.log('✅ Menu ditautkan ke role Bendahara')
  }

  console.log('🎉 Sinkronisasi RBAC Fase 4C selesai!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

