import {resolve} from 'path';
import aliasImporter from 'node-sass-alias-importer';
import handlebars from 'vite-plugin-handlebars';

console.log(process.env);

export default {
  root: resolve(__dirname, 'src'),
  build: {
    outDir: '../dist',
    target: 'es2015',
    emptyOutDir: true,
  },
  server: {
    port: 8080
  },
  css: {
    devSourcemap: true,
    preprocessorOptions: {
      scss: {
        importer: [
          aliasImporter({
            "~bootstrap": resolve(__dirname, 'node_modules/bootstrap'),
            "~flag-icons": resolve(__dirname, 'node_modules/flag-icons'),
          })
        ]
      }
    }
  },
  resolve: {
    alias: {
      '@scss': resolve(__dirname, 'src/scss'),
    }
  },
  plugins: [
    handlebars({
      context: {
        title: 'Casino template by Bootstrap 5 w/ Vite',
      },
      partialDirectory: resolve(__dirname, 'src/html/fragment'),
      reloadOnPartialChange: true
    })
  ],
}