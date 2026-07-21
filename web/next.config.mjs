/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  reactStrictMode: true,
  transpilePackages: ['@creit.tech/stellar-wallets-kit', '@stellar/freighter-api'],
};

export default nextConfig;
