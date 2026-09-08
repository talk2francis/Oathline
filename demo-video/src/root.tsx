import React from 'react';
import {Composition} from 'remotion';
import {OathlineDemo} from './video';

export const OathlineRoot: React.FC = () => (
  <Composition
    id="OathlineDemo"
    component={OathlineDemo}
    durationInFrames={2700}
    fps={30}
    width={1920}
    height={1080}
  />
);
