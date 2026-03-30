import { createApp } from './app';
import { appConfig } from './config/app.config';

async function bootstrap() {
  const app = createApp();
  app.listen(appConfig.port, () => {
    console.log(`Server started on port ${appConfig.port}`);
  });
}

bootstrap().catch((error) => {
  console.error('Failed to start service', error);
  process.exit(1);
});
