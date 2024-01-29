/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  images: {
    loader: "custom",
    loaderFile: "./image-loader.js",
    unoptimized: false,
  },
};

module.exports = nextConfig;
