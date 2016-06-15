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

const path = require('path')
const webpack = require('webpack')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const cssnext = require('postcss-cssnext')

module.exports = {
  context: path.join(__dirname, 'app'),
  entry: './index.js',
  devtool: 'cheap-module-eval-source-map',

  devServer: {
    proxy: {
      /*
       2016-06-01 -- This accounts for the way connect-history-api-fallback treats URIs
       containing dots (.) as file requests.  No easy way to solve that problem without
       making CHAF's file detection logic smarter, THEN propagating whatever required
       configuration changes are needed to the webpack-dev-server project. ¯\_(ツ)_/¯
       */
      '/create-job/*': {bypass: () => '/index.html'}
    }
  },

  resolve: {
    alias: {openlayers$: 'openlayers/dist/ol-debug.js'},
    extensions: ['', '.js', '.jsx']
  },

  output: {
    path: path.join(__dirname, 'dist'),
    filename: 'bundle.js'
  },

  module: {
    noParse: /\bol(-debug)?\.js$/,
    preLoaders: [
      {test: /\.jsx?$/, loader: 'eslint', exclude: /node_modules/}
    ],
    loaders: [
      {test: /\.jsx?$/, loader: 'babel', exclude: /node_modules/},
      {test: /\.css$/, loader: 'style!css', include: /node_modules/},
      {test: /\.css$/, loader: 'style!css?module&localIdentName=[name]__[local]&importLoaders=1!postcss', exclude: /node_modules/},
      {test: /\.(png|jpg|gif)$/, loader: 'file'},
      {test: /\.(otf|eot|svg|ttf|woff)[^/]*$/, loader: 'file'}
    ]
  },

  postcss: () => [cssnext({browsers: 'Firefox >= 38, Chrome >= 40'})],

  plugins: [
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
      'process.env.CATALOG': JSON.stringify(process.env.CATALOG || 'http://localhost:3001'),
      'process.env.GATEWAY': JSON.stringify(process.env.GATEWAY || 'http://localhost:3000')
    }),
    new HtmlWebpackPlugin({
      template: 'index.ejs',
      favicon: 'images/favicon.png',
      hash: true,
      xhtml: true
    }),
    new webpack.ProvidePlugin({fetch:'isomorphic-fetch'})
  ]
}

if (process.env.NODE_ENV === 'production') {
  module.exports.devtool = 'source-map'
  module.exports.plugins.push(new webpack.optimize.UglifyJsPlugin())
}
