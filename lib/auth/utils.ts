import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { getUserById } from '@/lib/database/queries';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export async function getCurrentUser() {
  try {
    const token = (await cookies()).get('auth-token')?.value;

    if (!token) {
      return null;
    }

    // Verify token
    let decoded: any;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (error) {
      return null;
    }

    // Get user
    const user = await getUserById(decoded.userId);

    if (!user) {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      avatar: user.avatar,
      accountId: user.id,
      $id: user.id, // For compatibility
    };
  } catch (error) {
    console.error('Get current user error:', error);
    return null;
  }
}

