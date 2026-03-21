import { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './apps/web/src/**/*.{ts,tsx}',
    // Add other paths as needed
  ],
  theme: {
    extend: {
      fontSize: {
        base: '1.125rem', // Sets default font size to "large" (18px)
      },
    },
  },
  plugins: [],
};

export default config;
