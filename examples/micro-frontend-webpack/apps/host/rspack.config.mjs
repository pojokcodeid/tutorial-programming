import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { rspack } from '@rspack/core';
import { ModuleFederationPlugin } from '@module-federation/enhanced/rspack';
import { federationRemote, HOST_ORIGIN } from '../../lib/lab-config.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Varian Rspack untuk host.
 *
 * Perbedaan utama dengan webpack.config.mjs:
 * - engine-nya Rust (@rspack/core), bukan JavaScript (webpack)
 * - ModuleFederationPlugin berasal dari @module-federation/enhanced/rspack
 * - HtmlRspackPlugin sudah bawaan @rspack/core
 * - TypeScript/TSX ditangani SWC bawaan, jadi tidak perlu ts-loader
 *
 * Dependensi Rspack bersifat opsional: kalau kamu hanya ingin jalur Webpack,
 * cukup jalankan `npm run build` dan abaikan berkas ini.
 */
export default {
  mode: 'production',
  target: 'web',
  entry: './src/index.ts',
  devtool: 'source-map',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].[contenthash].js',
    chunkFilename: '[name].[contenthash].js',
    publicPath: `${HOST_ORIGIN}/`,
    clean: true,
    uniqueName: 'host',
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.jsx', '.js'],
  },
  module: {
    rules: [
      {
        // Rspack tidak menebak TSX secara otomatis di konfigurasi ini.
        // builtin:swc-loader adalah loader SWC bawaan Rspack (tanpa paket tambahan).
        test: /\.(?:js|mjs|jsx|ts|tsx)$/,
        exclude: /node_modules/,
        use: {
          loader: 'builtin:swc-loader',
          options: {
            detectSyntax: 'auto',
            jsc: {
              transform: {
                react: { runtime: 'automatic', development: false },
              },
            },
          },
        },
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
    ],
  },
  plugins: [
    new ModuleFederationPlugin({
      name: 'host',
      remotes: {
        remote: federationRemote(),
      },
      shared: {
        react: { singleton: true, requiredVersion: '^18.2.0' },
        'react-dom': { singleton: true, requiredVersion: '^18.2.0' },
        'react/jsx-runtime': { singleton: true, requiredVersion: '^18.2.0' },
      },
    }),
    new rspack.HtmlRspackPlugin({
      template: './public/index.html',
    }),
  ],
  optimization: {
    runtimeChunk: false,
  },
};
