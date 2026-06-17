import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-github2';
import { Injectable } from '@nestjs/common';
import { AuthService } from './auth.service';

@Injectable()
export class GithubStrategy extends PassportStrategy(Strategy, 'github') {
  constructor(private authService: AuthService) {
    super({
      clientID: process.env.GITHUB_CLIENT_ID || 'dummy_github_client_id',
      clientSecret: process.env.GITHUB_CLIENT_SECRET || 'dummy_github_client_secret',
      callbackURL: process.env.GITHUB_CALLBACK_URL || 'http://localhost:3000/api/auth/github/callback',
      scope: ['user:email'],
    });
  }

  async validate(accessToken: string, refreshToken: string, profile: any, done: any): Promise<any> {
    const { username, displayName, emails } = profile;
    
    // Fallback if email is private or not provided
    const email = emails && emails.length > 0 ? emails[0].value : `${profile.id}@github.com`;
    
    // Split name or default
    const nameParts = displayName ? displayName.split(' ') : [username || 'GitHub', 'User'];
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(' ') || '';

    const user = {
      email,
      firstName,
      lastName,
      accessToken,
    };
    
    const dbUser = await this.authService.validateOAuthLogin(user, 'github');
    done(null, dbUser);
  }
}
