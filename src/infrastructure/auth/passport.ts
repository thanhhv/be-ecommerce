import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';

export function configurePassport(): void {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID || '',
        clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
        callbackURL:
          process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3001/api/v1/auth/google/callback',
      },
      (_accessToken, _refreshToken, profile, done) => {
        done(null, profile);
      },
    ),
  );
}
