/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable no-undef */

const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const webpack = require('webpack');

module.exports = {
  entry: "./src/index.tsx",
  output: { path: path.join(__dirname, "build"), filename: "index.bundle.js" },
  mode: process.env.NODE_ENV || "development",
  resolve: {
    extensions: [".tsx", ".ts", ".js"],
    fallback: { 
                "fs": false,
                "http": false,
                "https": false,
                "net": false,
                "crypto": false,
                "os": false,
                "stream": false,
                "zlib": false,
                "assert": false,
                "buffer": false,
                "querystring": false,
                "url": false,
              }
  },
  devServer: {
    static: path.join(__dirname, "src"),
    host: '192.168.1.120',
    port: 8080,
    server: {
      type: 'https',
    },
  },
  devtool: "eval-cheap-source-map",
  module: {
    rules: [
      {
        test: /\.(ts|tsx)$/,
        exclude: /node_modules/,
        use: ["ts-loader"],
      },
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: ["babel-loader"],
      },
      {
        test: /\.(css|scss)$/,
        use: [
          'style-loader',
          'css-modules-typescript-loader',
          {
            loader: 'css-loader',
            options: {
              modules: true
            }
          }
        ]
      },
      {
        test: /\.(jpg|jpeg|png|gif|mp3|svg)$/,
        use: ["file-loader"],
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: path.join(__dirname, "src", "index.html"),
    }),
    new webpack.ProvidePlugin({
      process: 'process/browser',
      Buffer: ['buffer', 'Buffer'],
    }),
  ],
};
