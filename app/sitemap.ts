import { MetadataRoute } from 'next'

const BASE_URL = 'https://finance.rauell.systems'

const TERMS_UPDATED = new Date('2026-07-10')
const PRIVACY_UPDATED = new Date('2026-07-10')

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/login`,
      lastModified: new Date('2026-07-10'),
      changeFrequency: 'yearly',
      priority: 0.4,
    },
    {
      url: `${BASE_URL}/register`,
      lastModified: new Date('2026-07-10'),
      changeFrequency: 'yearly',
      priority: 0.4,
    },
    {
      url: `${BASE_URL}/privacy`,
      lastModified: PRIVACY_UPDATED,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/terms`,
      lastModified: TERMS_UPDATED,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
  ]
}
