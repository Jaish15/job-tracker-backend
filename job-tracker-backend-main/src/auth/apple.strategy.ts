import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-apple';
import { Injectable } from '@nestjs/common';
import { AuthService } from './auth.service';

@Injectable()
export class AppleStrategy extends PassportStrategy(Strategy, 'apple') {
  constructor(private authService: AuthService) {
    super({
      clientID: process.env.APPLE_CLIENT_ID || 'dummy_client_id',
      teamID: process.env.APPLE_TEAM_ID || 'dummy_team_id',
      keyID: process.env.APPLE_KEY_ID || 'dummy_key_id',
      privateKeyLocation: process.env.APPLE_PRIVATE_KEY_LOCATION || '', // Path to the private key
      callbackURL: process.env.APPLE_CALLBACK_URL || 'http://localhost:3000/api/auth/apple/callback',
      passReqToCallback: false,
    });
  }

  async validate(accessToken: string, refreshToken: string, idToken: string, profile: any, done: (err: any, user: any, info?: any) => void): Promise<any> {
    // Apple only returns name and email the very first time the user logs in
    // Otherwise it just returns the provider id.
    // Decoding the idToken (JWT) gets the email
    let email = '';
    if (idToken) {
      const decoded: any = require('jsonwebtoken').decode(idToken);
      email = decoded.email;
    }
    
    const user = {
      email: email || (profile && profile.email) || 'apple_user_no_email@apple.com',
      firstName: profile?.name?.firstName || 'Apple',
      lastName: profile?.name?.lastName || 'User',
      accessToken,
    };
    
    // Attempt to register or login the OAuth user
    const dbUser = await this.authService.validateOAuthLogin(user, 'apple');
    done(null, dbUser);
  }
}
