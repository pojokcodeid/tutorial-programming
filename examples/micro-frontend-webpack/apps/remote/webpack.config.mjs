import path from 'node:path';
import { fileURLToPath } from 'node:url';
import webpack from 'webpack';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import { REMOTE_ORIGIN } from '../../lib/lab-config.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const { ModuleFederationPlugin } = webpack.container;

/**
 * Remote = pemilik komponen katalog.
 * `filename: 'remoteEntry.js'` adalah pintu masuk yang diunduh host.
 * `exposes` menentukan modul apa yang boleh diimpor host.
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
    // Chunk async remote harus diambil dari origin remote, bukan host.
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
        test: /\.tsx?$/,
        exclude: /node_modules/,
        use: {
          loader: 'ts-loader',
          options: { transpileOnly: true },
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
    new HtmlWebpackPlugin({
      template: './public/index.html',
    }),
  ],
  optimization: {
    runtimeChunk: false,
  },
};
