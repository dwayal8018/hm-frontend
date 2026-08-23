export const environment = {
  production: false,
  localApiUrl: 'http://localhost:8080/api',
  cloudApiUrl: 'http://localhost:8081/api',
  subscriptionCheckInterval: 3600000,
  // Payment UPI config — update before deploying to a new installation
  upiId:   '7391818018@yescred',
  upiName: 'Hotel Manager',
  // Locale — change for different countries
  // India: ₹, INR | Germany: €, EUR | US: $, USD
  currencySymbol: '₹',
  currencyCode:   'INR',
  locale:         'en-IN'
};
