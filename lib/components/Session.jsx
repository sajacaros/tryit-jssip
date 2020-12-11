import React from 'react';
import PropTypes from 'prop-types';
import HangUpIcon from 'material-ui/svg-icons/communication/call-end';
import PauseIcon from 'material-ui/svg-icons/av/pause-circle-outline';
import ResumeIcon from 'material-ui/svg-icons/av/play-circle-outline';
import MicOnIcon from 'material-ui/svg-icons/av/mic';
import MicOffIcon from 'material-ui/svg-icons/av/mic-off';
import CamIcon from 'material-ui/svg-icons/av/videocam';
import CamOffIcon from 'material-ui/svg-icons/av/videocam-off';
import classnames from 'classnames';
import JsSIP from 'jssip';
import Logger from '../Logger';
import TransitionAppear from './TransitionAppear';

const logger = new Logger('Session');

function changeBandwidth(connection) {
  connection.getSenders()
    .filter(sender => sender.track.kind==='video')
    .forEach(sender => {
      logger.debug('sender bandwidth setting, sender : ', sender);
      const parameters = sender.getParameters();
      if (!parameters.encodings) {
        parameters.encodings = [{}];
      }
      parameters.encodings[0].maxBitrate = bandwidth * 1000;
      sender.setParameters(parameters)
        .then(() => logger.debug('bandwidth setting complete, bandwidth : ', bandwidth * 1000))
        .catch(e => console.error(e));

      this._handleRemoteStream(event.streams[0], audiooutputkey);
      this.setState({sender: sender});
  });
}

export default class Session extends React.Component {
  constructor(props) {
    super(props);

    this.state =
    {
      localHasVideo: false,
      remoteHasVideo: false,
      localHold: false,
      remoteHold: false,
      audioMuted: false,
      videoMuted: false,
      canHold: false,
      ringing: false
    };

    // Mounted flag
    this._mounted = false;
    // Local cloned stream
    this._localClonedStream = null;
  }

  render() {
    const state = this.state;
    const props = this.props;
    let noRemoteVideo;

    if (props.session.isInProgress() && !state.ringing)
      noRemoteVideo = <div className='message'>connecting ...</div>;
    else if (state.ringing)
      noRemoteVideo = <div className='message'>ringing ...</div>;
    else if (state.localHold && state.remoteHold)
      noRemoteVideo = <div className='message'>both hold</div>;
    else if (state.localHold)
      noRemoteVideo = <div className='message'>local hold</div>;
    else if (state.remoteHold)
      noRemoteVideo = <div className='message'>remote hold</div>;
    else if (!state.remoteHasVideo)
      noRemoteVideo = <div className='message'>no remote video</div>;

    return (
      <TransitionAppear duration={1000}>
        <div data-component='Session'>
          <video
            ref='localVideo'
            className={classnames('local-video', { hidden: !state.localHasVideo })}
            autoPlay
            muted
          />

          <video
            ref='remoteVideo'
            className={classnames('remote-video', { hidden: noRemoteVideo })}
            autoPlay
            controls
          />

          <If condition={noRemoteVideo}>
            <div className='no-remote-video-info'>
              {noRemoteVideo}
            </div>
          </If>

          <div className='controls-container'>
            <div className='controls'>
              <HangUpIcon
                className='control'
                color={'#fff'}
                onClick={this.handleHangUp.bind(this)}
              />

              <Choose>
                <When condition={!state.localHold}>
                  <PauseIcon
                    className='control'
                    color={'#fff'}
                    onClick={this.handleHold.bind(this)}
                  />
                </When>

                <Otherwise>
                  <ResumeIcon
                    className='control'
                    color={'#fff'}
                    onClick={this.handleResume.bind(this)}
                  />
                </Otherwise>
              </Choose>
              <Choose>
                <When condition={!state.audioMuted}>
                  <MicOnIcon
                    className='control'
                    color={'#fff'}
                    onClick={this.handleAudioMute.bind(this)}
                  />
                </When>

                <Otherwise>
                  <MicOffIcon
                    className='control'
                    color={'#fff'}
                    onClick={this.handleAudioUnMute.bind(this)}
                  />
                </Otherwise>
              </Choose>
              <Choose>
                <When condition={!state.videoMuted}>
                  <CamIcon
                    className='control'
                    color={'#fff'}
                    onClick={this.handleVideoMute.bind(this)}
                  />
                </When>

                <Otherwise>
                  <CamOffIcon
                    className='control'
                    color={'#fff'}
                    onClick={this.handleVideoUnMute.bind(this)}
                  />
                </Otherwise>
              </Choose>
            </div>
          </div>
        </div>
      </TransitionAppear>
    );
  }

  componentDidMount() {
    logger.debug('componentDidMount()');

    this._mounted = true;

    const localVideo = this.refs.localVideo;
    const session = this.props.session;
    const peerconnection = session.connection;
    const localStream = peerconnection.getLocalStreams()[0];
    const remoteStream = peerconnection.getRemoteStreams()[0];
    const bandwidth = parseInt(this.props.bandwidth);
    const audiooutputkey = this.props.audiooutputkey;

    // Handle local stream
    if (localStream) {
      // Clone local stream
      this._localClonedStream = localStream.clone();

      // Display local stream
      localVideo.srcObject = this._localClonedStream;

      setTimeout(() => {
        if (!this._mounted)
          return;

        if (localStream.getVideoTracks()[0])
          this.setState({ localHasVideo: true });
      }, 1000);
    }

    // If incoming all we already have the remote stream
    if (remoteStream) {
      logger.debug('already have a remote stream');

      changeBandwidth(peerconnection);
      
      this._handleRemoteStream(remoteStream, audiooutputkey);
    }

    if (session.isEstablished()) {
      setTimeout(() => {
        if (!this._mounted)
          return;

        this.setState({ canHold: true });
      });
    }

    session.on('progress', (data) => {
      if (!this._mounted)
        return;

      logger.debug('session "progress" event [data:%o]', data);

      if (session.direction === 'outgoing')
        this.setState({ ringing: true });
    });

    session.on('accepted', (data) => {
      if (!this._mounted)
        return;

      logger.debug('session "accepted" event [data:%o]', data);

      if (session.direction === 'outgoing') {
        this.props.onNotify(
          {
            level: 'success',
            title: 'Call answered'
          });
      }

      this.setState({ canHold: true, ringing: false });


    });

    session.on('failed', (data) => {
      if (!this._mounted)
        return;

      logger.debug('session "failed" event [data:%o]', data);

      this.props.onNotify(
        {
          level: 'error',
          title: 'Call failed',
          message: `Cause: ${data.cause}`
        });

      if (session.direction === 'outgoing')
        this.setState({ ringing: false });
    });

    session.on('ended', (data) => {
      if (!this._mounted)
        return;

      logger.debug('session "ended" event [data:%o]', data);

      this.props.onNotify(
        {
          level: 'info',
          title: 'Call ended',
          message: `Cause: ${data.cause}`
        });

      if (session.direction === 'outgoing')
        this.setState({ ringing: false });
    });

    session.on('hold', (data) => {
      if (!this._mounted)
        return;

      const originator = data.originator;

      logger.debug('session "hold" event [originator:%s]', originator);

      switch (originator) {
        case 'local':
          this.setState({ localHold: true });
          break;
        case 'remote':
          this.setState({ remoteHold: true });
          break;
      }
    });

    session.on('unhold', (data) => {
      if (!this._mounted)
        return;

      const originator = data.originator;

      logger.debug('session "unhold" event [originator:%s]', originator);

      switch (originator) {
        case 'local':
          this.setState({ localHold: false });
          break;
        case 'remote':
          this.setState({ remoteHold: false });
          break;
      }
    });

    peerconnection.addEventListener('track', (event) => {
      if (!this._mounted) {
        logger.error('_handleRemoteStream() | component not mounted');
        return;
      }
      logger.debug('peerconnection : ', peerconnection);
      logger.debug('peerconnection "track" event, event : ', event);
      changeBandwidth(peerconnection);
      this._handleRemoteStream(event.stream, audiooutputkey);
    });
  }

  componentWillUnmount() {
    logger.debug('componentWillUnmount()');

    this._mounted = false;
    JsSIP.Utils.closeMediaStream(this._localClonedStream);
  }

  handleHangUp() {
    logger.debug('handleHangUp()');

    this.props.session.terminate();
  }

  handleHold() {
    logger.debug('handleHold()');

    this.props.session.hold({ useUpdate: true });
  }

  handleResume() {
    logger.debug('handleResume()');

    this.props.session.unhold({ useUpdate: true });
  }

  handleAudioMute() {
    logger.debug('handleAudioMute()');

    this.props.session.mute({ audio: true });
    this.setState({audioMuted: true});
  }

  handleAudioUnMute() {
    logger.debug('handleAudioUnMute()');

    this.props.session.unmute({ audio: true });
    this.setState({audioMuted: false});
  }


  handleVideoMute() {
    logger.debug('handleVideoMute()');

    this.props.session.mute({ video: true });
    this.setState({videoMuted: true});
  }

  handleVideoUnMute() {
    logger.debug('handleVideoUnMute()');

    this.props.session.unmute({ video: true });
    this.setState({videoMuted: false});
  }

  _handleRemoteStream(stream, audiooutputkey) {
    logger.debug('_handleRemoteStream() [stream:%o]', stream);

    const remoteVideo = this.refs.remoteVideo;

    // Display remote stream
    remoteVideo.srcObject = stream;
    logger.debug('selected audio output : ', audiooutputkey);
    remoteVideo.setSinkId(audiooutputkey)
      .then(() => logger.debug('complete to set audio output, deviceId : ', audiooutputkey));

    this._checkRemoteVideo(stream);

    stream.addEventListener('addtrack', (event) => {
      const track = event.track;

      if (remoteVideo.srcObject !== stream)
        return;

      logger.debug('remote stream "addtrack" event [track:%o]', track);

      // Refresh remote video
      remoteVideo.srcObject = stream;

      this._checkRemoteVideo(stream);

      track.addEventListener('ended', () => {
        logger.debug('remote track "ended" event [track:%o]', track);
      });
    });

    stream.addEventListener('removetrack', () => {
      if (remoteVideo.srcObject !== stream)
        return;

      logger.debug('remote stream "removetrack" event');

      // Refresh remote video
      remoteVideo.srcObject = stream;

      this._checkRemoteVideo(stream);
    });
  }

  _checkRemoteVideo(stream) {
    if (!this._mounted) {
      logger.error('_checkRemoteVideo() | component not mounted');

      return;
    }

    const videoTrack = stream.getVideoTracks()[0];

    this.setState({ remoteHasVideo: Boolean(videoTrack) });
  }
}

Session.propTypes =
{
  session: PropTypes.object.isRequired,
  onNotify: PropTypes.func.isRequired,
  onHideNotification: PropTypes.func.isRequired,
  bandwidth: PropTypes.string.isRequired,
  audiooutputkey: PropTypes.string.isRequired
};
