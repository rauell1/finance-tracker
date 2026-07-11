import { MetadataRoute } from 'next'

const DISALLOW = [
  '/dashboard',
  '/transactions',
  '/budgets',
  '/analytics',
  '/settings',
  '/debts',
  '/goals',
  '/recurring',
  '/reports',
  '/admin',
  '/webhook-logs',
  '/api/',
  '/auth/callback',
  '/_next/',
]

const ALLOW = ['/', '/login', '/register', '/privacy', '/terms']

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ALLOW,
        disallow: DISALLOW,
      },
      {
        userAgent: 'Googlebot',
        allow: ALLOW,
        disallow: DISALLOW,
      },
    ],
    sitemap: 'https://finance.rauell.systems/sitemap.xml',
    host: 'https://finance.rauell.systems',
  }
}
