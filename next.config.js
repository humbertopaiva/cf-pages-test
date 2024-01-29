/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  images: {
    loader: "custom",
    loaderFile: "./image-loader.js",
    unoptimized: false,
  },
  trailingSlash: true,
};

module.exports = nextConfig;
