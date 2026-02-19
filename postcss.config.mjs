import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const config = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
  // S'assurer que PostCSS résout depuis le bon répertoire
  from: undefined,
  to: undefined,
};

export default config;
