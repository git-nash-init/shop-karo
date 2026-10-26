import jwt from 'jsonwebtoken';
import asyncHandler from './asyncHandler.js';
import { supabaseAdmin } from '../config/supabase.js';

// User must be authenticated via Supabase JWT
const protect = asyncHandler(async (req, res, next) => {
  let token;

  // Read JWT from 'jwt' cookie OR Authorization header
  if (req.cookies && req.cookies.jwt) {
    token = req.cookies.jwt;
  } else if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer ')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    res.status(401);
    throw new Error('Not authorized, no token');
  }

  try {
    // Verify the token against Supabase
    const {
      data: { user },
      error,
    } = await supabaseAdmin.auth.getUser(token);

    if (error || !user) {
      res.status(401);
      throw new Error('Not authorized, invalid token');
    }

    // Fetch user profile (name, isAdmin)
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id, name, is_admin')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      res.status(401);
      throw new Error('Not authorized, user profile not found');
    }

    req.user = {
      _id: user.id,
      id: user.id,
      name: profile.name,
      email: user.email,
      isAdmin: profile.is_admin,
      accessToken: token,
    };

    next();
  } catch (err) {
    console.error('authMiddleware error:', err.message || err);
    if (!res.headersSent) {
      res.status(401);
      throw new Error(err.message || 'Not authorized, token failed');
    }
    throw err;
  }
});

// User must be an admin
const admin = (req, res, next) => {
  if (req.user && req.user.isAdmin) {
    next();
  } else {
    res.status(401);
    throw new Error('Not authorized as an admin');
  }
};

export { protect, admin };
