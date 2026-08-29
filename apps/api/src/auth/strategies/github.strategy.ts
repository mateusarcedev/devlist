import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, Profile } from 'passport-github2';

export interface GithubUser {
  githubId: number;
  name: string;
  email: string;
  avatar: string;
}

@Injectable()
export class GithubStrategy extends PassportStrategy(Strategy, 'github') {
  constructor() {
    super({
      clientID: process.env.GITHUB_ID!,
      clientSecret: process.env.GITHUB_SECRET!,
      callbackURL: `${process.env.API_URL ?? 'http://localhost:3001'}/auth/callback/github`,
      scope: ['user:email'],
    });
  }

  async validate(
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
  ): Promise<GithubUser> {
    return {
      githubId: parseInt(profile.id),
      name: profile.displayName ?? profile.username ?? 'Unknown',
      email: profile.emails?.[0]?.value ?? '',
      avatar: profile.photos?.[0]?.value ?? '',
    };
  }
}
