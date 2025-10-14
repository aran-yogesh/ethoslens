import { defineConfig } from '@inkeep/agents-cli/config';
import { ethosLensProject } from './ethoslens/index.js';

const config = defineConfig({
  tenantId: "default",
  agentsManageApiUrl: 'http://localhost:3002',
  agentsRunApiUrl: 'http://localhost:3003',
});

export default config;
export { ethosLensProject as project };
