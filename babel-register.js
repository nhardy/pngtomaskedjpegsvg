/**
 * This file needs to Vanilla JavaScript that can be executed in the current Node environment as Babel cannot know what
 * transformations it would need to apply before reading this file
 */

const { addPath } = require('app-module-path');

require('@babel/register')({
  extensions: ['.js', '.ts'],
});

addPath(__dirname);
