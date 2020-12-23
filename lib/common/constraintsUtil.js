import {qvgaConstraints, vgaConstraints, hdConstraints, fullHdConstraints, fourKConstraints, eightKConstraints} from './resolution';

function defineDeviceInput(constraints, deviceId) {
  return { ...constraints, deviceId: deviceId };
}

function defineResolution(constraints, wantedResolution) {
  switch (wantedResolution) {
    case 'QVGA':
      return { ...constraints, ...qvgaConstraints };
    case 'VGA':
      return { ...constraints, ...vgaConstraints };
    case 'HD':
      return { ...constraints, ...hdConstraints };
    case 'FULLHD':
      return { ...constraints, ...fullHdConstraints };
    case 'FOURK':
      return { ...constraints, ...fourKConstraints };
    case 'EIGHTK':
      return { ...constraints, ...eightKConstraints };
    default:
      return { ...constraints, ...hdConstraints };
  }
}

function defineFramerate(constraints, framerateMin, framerateMax) {
  const minMax = {}
  if (framerateMin != 0) {
    minMax.min = framerateMin;
  }
  if (framerateMax != 0) {
    minMax.max = framerateMax;
  }

  if (Object.keys(minMax).length === 0 && minMax.constructor === Object) {
    return { ...constraints }
  } else {
    return { ...constraints, frameRate: minMax }
  }
}

export function defineVideoConstraints({ resolution, framerateMin, framerateMax, videoinputkey }) {
  let videoConstraints = {}
  videoConstraints = defineDeviceInput(videoConstraints, videoinputkey);
  videoConstraints = defineResolution(videoConstraints, resolution);
  videoConstraints = defineFramerate(videoConstraints, framerateMin, framerateMax);
  return videoConstraints;
}

export function defineAudioConstraints({ audioinputkey }) {
  let audioConstraints = {}
  return defineDeviceInput(audioConstraints, audioinputkey);
}
