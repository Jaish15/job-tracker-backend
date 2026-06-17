import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { Injectable } from '@nestjs/common';
import { AuthService } from './auth.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(private authService: AuthService) {
    super({
      clientID: process.env.GOOGLE_CLIENT_ID || 'dummy_client_id',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'dummy_client_secret',
      callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3000/api/auth/google/callback',
      scope: ['email', 'profile'],
    });
  }

  async validate(accessToken: string, refreshToken: string, profile: any, done: VerifyCallback): Promise<any> {
    const { name, emails } = profile;
    const email = emails && emails.length > 0 ? emails[0].value : `${profile.id}@gmail.com`;
    const firstName = name?.givenName || 'Google';
    const lastName = name?.familyName || 'User';

    const user = {
      email,
      firstName,
      lastName,
      accessToken,
    };
    
    // Attempt to register or login the OAuth user
    const dbUser = await this.authService.validateOAuthLogin(user, 'google');
    done(null, dbUser);
  }
}
