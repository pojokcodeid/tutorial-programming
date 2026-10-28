import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { rspack } from '@rspack/core';
import { ModuleFederationPlugin } from '@module-federation/enhanced/rspack';
import { REMOTE_ORIGIN } from '../../lib/lab-config.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Varian Rspack untuk remote.
 * Kontrak federasinya sama persis dengan versi Webpack: name, filename,
 * exposes, dan shared. Hanya engine + sumber plugin yang berbeda.
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
    publicPath: `${REMOTE_ORIGIN}/`,
    clean: true,
    uniqueName: 'remote',
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
      name: 'remote',
      filename: 'remoteEntry.js',
      exposes: {
        './App': './src/App.tsx',
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
