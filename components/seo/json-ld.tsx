export function JsonLd() {
  const schema = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebApplication',
        '@id': 'https://finance.rauell.systems/#webapp',
        name: 'FinTrack',
        url: 'https://finance.rauell.systems',
        description:
          'Personal finance tracker built for East Africa — track M-Pesa, bank, and cash transactions in real-time.',
        applicationCategory: 'FinanceApplication',
        operatingSystem: 'Web',
        browserRequirements: 'Requires JavaScript',
        inLanguage: 'en-KE',
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'KES',
          availability: 'https://schema.org/InStock',
        },
        author: {
          '@type': 'Person',
          '@id': 'https://rauell.systems/#person',
          name: 'Rauell',
          url: 'https://rauell.systems',
          address: {
            '@type': 'PostalAddress',
            addressLocality: 'Nakuru',
            addressRegion: 'Nakuru County',
            addressCountry: 'KE',
          },
        },
      },
      {
        '@type': 'Person',
        '@id': 'https://rauell.systems/#person',
        name: 'Rauell',
        url: 'https://rauell.systems',
        sameAs: [
          'https://github.com/rauell1',
        ],
        address: {
          '@type': 'PostalAddress',
          addressLocality: 'Nakuru',
          addressCountry: 'KE',
        },
      },
      {
        '@type': 'WebSite',
        '@id': 'https://finance.rauell.systems/#website',
        url: 'https://finance.rauell.systems',
        name: 'FinTrack',
        description: 'Personal finance dashboard for East Africa',
        publisher: {
          '@id': 'https://rauell.systems/#person',
        },
        potentialAction: {
          '@type': 'SearchAction',
          target: {
            '@type': 'EntryPoint',
            urlTemplate: 'https://finance.rauell.systems/transactions?q={search_term_string}',
          },
          'query-input': 'required name=search_term_string',
        },
      },
      {
        '@type': 'BreadcrumbList',
        '@id': 'https://finance.rauell.systems/#breadcrumb',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'Home',
            item: 'https://finance.rauell.systems',
          },
        ],
      },
    ],
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}
