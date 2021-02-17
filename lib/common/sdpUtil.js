import * as sdpTransform from 'sdp-transform';

function preferCodec(rtpList, codecName) {
  return rtpList.filter(rtp => rtp.codec === codecName);
}

export function transformSdp(sdp, { audioCodec, videoCodec }) {
  for (const media of sdp.media) {
    let rtpCodecs = media.rtp;
    if (media.type === 'audio') {
      rtpCodecs = preferCodec(media.rtp, audioCodec);
    } else if (media.type === 'video') {
      rtpCodecs = preferCodec(media.rtp, videoCodec);
      // if( !media.bandwidth ) {
      // 	media.bandwidth = [];
      // }
      // media.bandwidth.push({type:"AS", limit: bandwidth});
    }

    if (media.type !== 'application') {
      media.rtp = rtpCodecs;
      let rtpIndexes = rtpCodecs.map(rtp => rtp.payload);
      media.payloads = rtpIndexes.join(' ');
      media.fmtp = media.fmtp.filter(m => rtpIndexes.includes(m.payload));
      media.rtcpFb = media.rtcpFb.filter(m => rtpIndexes.includes(m.payload));
      delete media.ext;
    }
    // media.protocol = 'RTP/AVP'
  }
}

export function parse(sdp) {
  return sdpTransform.parse(sdp);
}

export function write(sdpObj) {
  return sdpTransform.write(sdpObj);
}