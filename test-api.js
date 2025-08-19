const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testModalAPI() {
  try {
    console.log('🧪 Testing Modal API logic...\n');
    
    // Simulate what the API does
    console.log('1. Fetching modals from database...');
    const modals = await prisma.modal.findMany({
      orderBy: [
        { isLocal: 'desc' }, // Local models first
        { category: 'asc' },
        { name: 'asc' }
      ]
    });
    
    console.log(`✅ Found ${modals.length} modals in Modal table\n`);
    
    // Show breakdown by category
    const categories = {};
    modals.forEach(modal => {
      categories[modal.category] = (categories[modal.category] || 0) + 1;
    });
    
    console.log('📊 Modals by category:');
    Object.entries(categories).forEach(([category, count]) => {
      console.log(`   ${category}: ${count} models`);
    });
    
    console.log('\n🏠 Local models:');
    const localModals = modals.filter(m => m.isLocal);
    localModals.forEach(modal => {
      console.log(`   ${modal.name} (${modal.id}) - ${modal.enabled ? 'enabled' : 'disabled'}`);
    });
    
    console.log('\n☁️ First 5 cloud models:');
    const cloudModals = modals.filter(m => !m.isLocal).slice(0, 5);
    cloudModals.forEach(modal => {
      console.log(`   ${modal.name} (${modal.category}) - ${modal.enabled ? 'enabled' : 'disabled'}`);
    });
    
    // Test user settings (should be empty for new user)
    console.log('\n2. Testing user modal settings...');
    const users = await prisma.user.findMany({
      include: {
        modalSettings: true
      }
    });
    
    users.forEach(user => {
      console.log(`   User: ${user.email} has ${user.modalSettings.length} custom modal settings`);
    });
    
    // Test the combination logic (what API returns)
    console.log('\n3. Testing API response logic...');
    const testUser = users[0]; // Use first user
    
    if (testUser) {
      const userSettings = {};
      testUser.modalSettings.forEach(setting => {
        userSettings[setting.modalId] = setting.enabled;
      });
      
      const modalsWithSettings = modals.map(modal => ({
        id: modal.id,
        name: modal.name,
        description: modal.description,
        icon: modal.icon,
        color: modal.color,
        category: modal.category,
        isLocal: modal.isLocal,
        enabled: userSettings.hasOwnProperty(modal.id) ? userSettings[modal.id] : modal.enabled
      }));
      
      console.log(`   ✅ API would return ${modalsWithSettings.length} modals for user ${testUser.email}`);
      
      const enabledCount = modalsWithSettings.filter(m => m.enabled).length;
      const disabledCount = modalsWithSettings.filter(m => !m.enabled).length;
      
      console.log(`   📊 ${enabledCount} enabled, ${disabledCount} disabled`);
    }
    
  } catch (error) {
    console.error('❌ Error testing modal API:', error.message);
    console.error(error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

testModalAPI();