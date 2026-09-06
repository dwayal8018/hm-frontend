// Seeds a valid demo session into localStorage so the app skips login entirely
// and all route guards (auth / subscription / role) pass as an OWNER.
// Called from main.ts ONLY when environment.demoMode === true.
import { DEMO_TOKEN, DEMO_USER, DEMO_RESTAURANT, DEMO_SUBSCRIPTION } from './demo-seed';

const TOKEN_KEY = 'hm_token';
const USER_KEY  = 'hm_user';
const REST_KEY  = 'hm_restaurant';
const SUB_KEY   = 'hm_subscription';

export function seedDemoSession(): void {
  // Always refresh the token so its `exp` stays in the future across visits.
  localStorage.setItem(TOKEN_KEY, DEMO_TOKEN);
  localStorage.setItem(USER_KEY,  JSON.stringify(DEMO_USER));
  localStorage.setItem(REST_KEY,  JSON.stringify(DEMO_RESTAURANT));
  localStorage.setItem(SUB_KEY,   JSON.stringify(DEMO_SUBSCRIPTION));
}
