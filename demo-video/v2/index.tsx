import React from 'react';
import {Composition,registerRoot} from 'remotion';
import {Film} from './film';
const Root=()=> <Composition id="Oathline150" component={Film} durationInFrames={4500} fps={30} width={1920} height={1080}/>;
registerRoot(Root);
