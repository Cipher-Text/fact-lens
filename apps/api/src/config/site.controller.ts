import { Controller, Get, Inject, Res } from '@nestjs/common';
import type { PublicContact, PublicSocialLinks } from '@fact-lens/contracts';
import type { FastifyReply } from 'fastify';
import { Public } from '../auth/decorators';
import { SITE_INFO, type SiteInfo } from './site';

/**
 * What the public site reads about itself. Both come from the deployment settings, so there is nothing to
 * edit in the newsroom and nothing in the database; a change needs a new start.
 */
@Public()
@Controller('public/site')
export class PublicSiteController {
  constructor(@Inject(SITE_INFO) private readonly site: SiteInfo) {}

  /** Only networks with an address; the site keeps its default link for the rest. */
  @Get('social-links')
  socialLinks(@Res({ passthrough: true }) reply: FastifyReply): PublicSocialLinks {
    void reply.header('cache-control', 'public, max-age=60, stale-while-revalidate=300');
    return this.site.social;
  }

  /** A detail that is not set is null. */
  @Get('contact')
  contact(@Res({ passthrough: true }) reply: FastifyReply): PublicContact {
    void reply.header('cache-control', 'public, max-age=60, stale-while-revalidate=300');
    return this.site.contact;
  }
}
