const { MongoClient } = require('mongodb');

async function verifyUserEmail() {
  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    await client.connect();
    const db = client.db(process.env.MONGODB_DB || 'expenses');
    const users = db.collection('users');
    
    // Replace with the actual email you're testing with
    const testEmail = 'keresifon.isidore@gmail.com'; // Updated with your email
    
    const result = await users.updateOne(
      { email: testEmail.toLowerCase() },
      { 
        $set: { 
          emailVerified: true,
          emailVerifiedAt: new Date()
        },
        $unset: { 
          emailVerificationToken: 1,
          emailVerificationExpires: 1
        }
      }
    );
    
    if (result.matchedCount === 0) {
      console.log('❌ User not found');
    } else if (result.modifiedCount === 0) {
      console.log('ℹ️ User email was already verified');
    } else {
      console.log('✅ User email verified successfully');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

verifyUserEmail();
