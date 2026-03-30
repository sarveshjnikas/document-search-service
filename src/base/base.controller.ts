import { AppBase } from './app.base';

export abstract class BaseController extends AppBase {
  protected resolveTenant(headerTenant?: string, queryTenant?: string): string {
    return (headerTenant || queryTenant || '').trim();
  }
}
