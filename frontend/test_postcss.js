import fs from 'fs';
import postcss from 'postcss';
import tailwindcss from 'tailwindcss';

const css = fs.readFileSync('src/index.css', 'utf8');
postcss([tailwindcss])
  .process(css, { from: 'src/index.css' })
  .then(result => console.log('SUCCESS'))
  .catch(err => { console.log('ERROR_MESSAGE:', err.message); });
