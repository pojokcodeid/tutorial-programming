import path from 'node:path';
import { fileURLToPath } from 'node:url';
import webpack from 'webpack';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import { federationRemote, HOST_ORIGIN } from '../../lib/lab-config.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const { ModuleFederationPlugin } = webpack.container;

/**
 * Host = pemilik URL dan layout.
 * Host TIDAK membundel kode remote; ia hanya menyimpan URL remoteEntry.js
 * lalu memuatnya saat runtime.
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
      name: 'host',
      // remote@URL — host akan mengunduh remoteEntry.js dari port 4182.
      remotes: {
        remote: federationRemote(),
      },
      // Satu instance React untuk host + remote. Tanpa singleton, hook dan
      // context bisa gagal karena ada dua salinan React di halaman.
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
