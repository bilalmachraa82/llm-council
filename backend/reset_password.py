
import asyncio
import os
from prisma import Prisma
import bcrypt

async def reset_password(email: str, new_password: str):
    print(f"🔄 Connecting to database...")
    db = Prisma()
    await db.connect()
    
    print(f"🔍 Searching for user: {email}")
    user = await db.user.find_unique(where={"email": email})
    
    if not user:
        print(f"❌ User not found: {email}")
        await db.disconnect()
        return

    print(f"✅ User found: {user.id}")
    
    # Hash new password
    hashed = bcrypt.hashpw(new_password.encode(), bcrypt.gensalt()).decode()
    
    print(f"🔑 Updating password...")
    await db.user.update(
        where={"id": user.id},
        data={"passwordHash": hashed}
    )
    
    print(f"✅ Password SUCCESSFULLY reset for {email}")
    await db.disconnect()

if __name__ == "__main__":
    email = "bilal.machraa@gmail.com"
    new_password = "Mudar123!"
    asyncio.run(reset_password(email, new_password))
