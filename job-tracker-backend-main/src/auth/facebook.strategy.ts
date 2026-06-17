import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-facebook';
import { Injectable } from '@nestjs/common';
import { AuthService } from './auth.service';

@Injectable()
export class FacebookStrategy extends PassportStrategy(Strategy, 'facebook') {
  constructor(private authService: AuthService) {
    super({
      clientID: process.env.FACEBOOK_CLIENT_ID || 'dummy_client_id',
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET || 'dummy_client_secret',
      callbackURL: process.env.FACEBOOK_CALLBACK_URL || 'http://localhost:3000/api/auth/facebook/callback',
      profileFields: ['id', 'emails', 'name'],
      scope: ['email'],
    });
  }

  async validate(accessToken: string, refreshToken: string, profile: any, done: (err: any, user: any, info?: any) => void): Promise<any> {
    const { name, emails } = profile;
    const email = emails && emails.length > 0 ? emails[0].value : `${profile.id}@facebook.com`;
    const firstName = name?.givenName || 'Facebook';
    const lastName = name?.familyName || 'User';

    const user = {
      email,
      firstName,
      lastName,
      accessToken,
    };
    
    // Attempt to register or login the OAuth user
    const dbUser = await this.authService.validateOAuthLogin(user, 'facebook');
    done(null, dbUser);
  }
}
