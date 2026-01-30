const HtmlWebpackPlugin = require('html-webpack-plugin');
const { ModuleFederationPlugin } = require('webpack').container;
const path = require('path');

module.exports = {
  mode: 'development',
  entry: path.resolve(__dirname, './src/index.js'),
  devServer: {
    port: 3001,
    historyApiFallback: true,
  },
  output: {
    publicPath: 'auto'
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.jsx']
  },
  module: {
    rules: [
      { test: /\.(ts|tsx|js|jsx)$/, loader: 'babel-loader', exclude: /node_modules/ },
      { 
        test: /\.css$/, 
        use: [
          'style-loader', 
          'css-loader',
          'postcss-loader'
        ]
      },
      { 
        test: /\.(png|jpe?g|gif|svg)$/i,
        type: 'asset/resource'
      }
    ]
  },
  plugins: [
    new ModuleFederationPlugin({
      name: 'date_calculator',
      filename: 'remoteEntry.js',
      exposes: {
        './create_view': './src/CreateView.tsx',
        './edit_view': './src/EditView.tsx',
        './detail_view': './src/DetailView.tsx',
        './getData_view': './src/GetDataView.tsx',
        './postData_view': './src/PostDataView.tsx',
        './izin_form_view': './src/IzinFormView.tsx',
        './izin_with_file_form_view': './src/IzinWithFileFormView.tsx',
        './izin_form_pg_view': './src/IzinFormPGView.tsx',
      },
      shared: {
        react: { singleton: true, },
        'react-dom': { singleton: true,  },
        'react-hook-form': { singleton: true },
        leaflet: { singleton: true },
        'react-leaflet': { singleton: true },  // ⭐ INI PENTING!
  
      }
    }),
    new HtmlWebpackPlugin({ template: './public/index.html' })
  ]
};