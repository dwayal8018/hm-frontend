import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { appConfig } from './app/app.config';
import { environment } from './environments/environment';

// Demo mode: seed a valid session BEFORE the app bootstraps so guards pass
// and the user lands straight on the app without logging in.
if (environment.demoMode) {
  // Dynamic import keeps demo code out of production/dev bundles.
  import('./app/core/demo/demo-bootstrap').then(({ seedDemoSession }) => {
    seedDemoSession();
    bootstrapApplication(AppComponent, appConfig).catch((err) => console.error(err));
  });
} else {
  bootstrapApplication(AppComponent, appConfig).catch((err) => console.error(err));
}
