import { type NextConfig } from "next";

const nextConfig: NextConfig = {
  /**
   * Output 'standalone' is recommended for Docker/container deployments,
   * significantly reducing the build size by including only necessary files.
   */
  output: "standalone",

  /**
   * Enable React Strict Mode to help identify potential issues in components during development.
   */
  reactStrictMode: true,

  /**
   * Configuration options related to the build environment.
   */
  // env: {
  //   // Custom environment variables accessible in the browser
  // },

  /**
   * TypeScript configuration. Ensure building fails on type errors.
   */
  typescript: {
    // Setting this explicitly confirms that we rely on type safety during the build.
    ignoreBuildErrors: false,
  },
};

export default nextConfig;