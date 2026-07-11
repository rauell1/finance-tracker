import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/login', '/register', '/privacy', '/terms'],
        disallow: [
          '/dashboard',
          '/transactions',
          '/budgets',
          '/analytics',
          '/settings',
          '/api/',
          '/auth/callback',
          '/_next/',
        ],
      },
      {
        userAgent: 'Googlebot',
        allow: ['/', '/login', '/register', '/privacy', '/terms'],
        disallow: [
          '/api/',
          '/auth/callback',
        ],
      },
    ],
    sitemap: 'https://finance.rauell.systems/sitemap.xml',
    host: 'https://finance.rauell.systems',
  }
}
