// Demo environment — used for the Netlify single-link demo build.
// No backend required. The demo HTTP interceptor serves seeded data entirely
// in the browser and persists changes to localStorage.
//
// IMPORTANT: this file only affects the `demo` build configuration
// (ng build --configuration demo). Production and development builds are
// completely unchanged.
export const environment = {
  production: true,
  demoMode: true,
  // These URLs are never actually hit in demo mode — the interceptor short-circuits
  // every request. They only need to be non-empty strings so existing services build.
  localApiUrl: '/api',
  cloudApiUrl: '/api',
  subscriptionCheckInterval: 3600000,
  upiId:   '7391818018@yescred',
  upiName: 'Hotel Manager',
  currencySymbol: '₹',
  currencyCode:   'INR',
  locale:         'en-IN'
};
