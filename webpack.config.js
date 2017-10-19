/**
 * Copyright 2016, RadiantBlue Technologies, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 **/

'use strict'

const fs = require('fs')
const path = require('path')
const webpack = require('webpack')
const childProcess = require('child_process')
const CopyWebpackPlugin = require('copy-webpack-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const cssnext = require('postcss-cssnext')
const cssimport = require('postcss-import')
const pkg = require('./package')
const CheckerPlugin = require('awesome-typescript-loader').CheckerPlugin

const __environment__ = process.env.NODE_ENV || 'development'

module.exports = {
  devtool: '#cheap-module-eval-source-map',

  context: __dirname,
  entry: './src/index.ts',

  externals: {
    'openlayers': 'ol'
  },

  resolve: {
    extensions: ['', '.tsx', '.ts', '.js'],
    root: __dirname,
  },

  output: {
    path: path.join(__dirname, 'dist'),
    filename: 'bundle.js'
  },

  module: {
    preLoaders: [
      {
        test: /\.js$/,
        loader: 'source-map',
        exclude: /node_modules/
      },
      {
        test: /\.tsx?$/,
        loader: 'tslint',
        exclude: /node_modules/
      },
    ],
    loaders: [
      {
        test: /\.tsx?$/,
        loader: 'awesome-typescript-loader',
        exclude: /node_modules/
      },
      {
        test: /\.css$/,
        loader: 'style!css',
        include: /node_modules/
      },
      {
        test: /\.css$/,
        loader: 'style!css?module&localIdentName=[name]-[local]&importLoaders=1!postcss',
        exclude: /node_modules/
      },
      {
        test: /\.(png|jpg|gif)$/,
        loader: 'file'
      },
      {
        test: /\.(otf|eot|svg|ttf|woff)[^/]*$/,
        loader: 'file'
      },
    ]
  },

  postcss: (webpack_) => ([
    cssimport({ addDependencyTo: webpack_ }),
    cssnext({ browsers: 'Firefox >= 38, Chrome >= 40' }),
  ]),

  ts: {
    compilerOptions: {
      target: __environment__ === 'development' ? 'es6' : 'es5',
    },
  },

  devServer: {
    stats: 'error-only',
  },

  plugins: [
    new CheckerPlugin(),
    new CopyWebpackPlugin([{
      from: require.resolve('openlayers/dist/ol-debug.js'),
      to: 'ol.js',
    }]),
    new webpack.IgnorePlugin(/^\.\/locale$/, /moment$/),
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify(__environment__),
      'process.env.API_ROOT': process.env.API_ROOT ? JSON.stringify(process.env.API_ROOT) : (__environment__ === 'development') ? JSON.stringify('https://localhost:5000') : "'https://' + location.hostname.replace('beachfront', 'bf-api')",
      'process.env.CLASSIFICATION_BANNER_BACKGROUND': JSON.stringify(process.env.CLASSIFICATION_BANNER_BACKGROUND || 'green'),
      'process.env.CLASSIFICATION_BANNER_FOREGROUND': JSON.stringify(process.env.CLASSIFICATION_BANNER_FOREGROUND || 'white'),
      'process.env.CLASSIFICATION_BANNER_TEXT': JSON.stringify(process.env.CLASSIFICATION_BANNER_TEXT || 'UNCLASSIFIED // TESTING & DEVELOPMENT USE ONLY'),
      'process.env.CONSENT_BANNER_TEXT': JSON.stringify(process.env.CONSENT_BANNER_TEXT || '<p>Users must accept the terms and conditions of the User Agreement before signing in to Beachfront. Contact us for account help.</p>'),
      'process.env.OSM_BASE_URL': JSON.stringify(process.env.OSM_BASE_URL || 'osm.geointservices.io'),
      'process.env.PLANET_BASE_URL': JSON.stringify(process.env.PLANET_BASE_URL || 'planet.com'),
    }),
    new HtmlWebpackPlugin({
      template: 'src/index.html',
      favicon: __environment__ === 'production' ? 'src/images/favicon.png' : 'src/images/favicon-dev.png',
      hash: true,
      xhtml: true,
      build: [
        pkg.version,
        childProcess.execSync('git rev-parse HEAD').toString().trim(),
      ].join(':')
    }),
  ]
}

if (__environment__ === 'production') {
  module.exports.devtool = 'source-map'
  module.exports.plugins.push(new webpack.optimize.UglifyJsPlugin({ compress: { warnings: false } }))
}
