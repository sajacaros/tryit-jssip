import React from 'react';
import PropTypes from 'prop-types';
import HangUpIcon from 'material-ui/svg-icons/communication/call-end';
import PauseIcon from 'material-ui/svg-icons/av/pause-circle-outline';
import ResumeIcon from 'material-ui/svg-icons/av/play-circle-outline';
import MicOnIcon from 'material-ui/svg-icons/av/mic';
import MicOffIcon from 'material-ui/svg-icons/av/mic-off';
import CamIcon from 'material-ui/svg-icons/av/videocam';
import CamOffIcon from 'material-ui/svg-icons/av/videocam-off';
import CamIcon2 from 'material-ui/svg-icons/av/video-label';
import ScreenShare from 'material-ui/svg-icons/communication/screen-share'
import RecvOnly from 'material-ui/svg-icons/navigation/arrow-back'
import SendOnly from 'material-ui/svg-icons/navigation/arrow-forward'
import SendRecv from 'material-ui/svg-icons/action/settings-ethernet';
import classnames from 'classnames';
import JsSIP from 'jssip';
import Logger from '../Logger';
import TransitionAppear from './TransitionAppear';
import Slider from 'material-ui/Slider';
import {init, sendFile, receiveChannelCallback} from '../common/WebrtcDataChannelManager';

const logger = new Logger('Session');

function changeDirection(connection, direction) {
  connection.getTransceivers().forEach(transceiver =>{
    if( transceiver.currentDirection !== 'inactive') {
      console.log(`transceiver(${transceiver.mid}) change direction - ${transceiver.currentDirection} => ${direction}`);
      transceiver.direction = direction;
    }
  });
}

function changeBandwidth(connection, bandwidth) {
  connection.getSenders()
    .filter(sender => sender.track && sender.track.kind==='video')
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
      screen: false,
      canHold: false,
      ringing: false,
      direction: 'sendrecv'
    };

    // Mounted flag
    this._mounted = false;
    // Local cloned stream
    this._localClonedStream = null;

    this.audioCtx = null;
    this.gainNode = null;

    this.messageInput = React.createRef();
    this.chatBox = React.createRef();

    this.fileInput = React.createRef();
    this.sendFileButton= React.createRef();
    this.downloadAnchor = React.createRef();
  }

  render() {
    console.log('session render');
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
          />

          <If condition={noRemoteVideo}>
            <div className='no-remote-video-info'>
              {noRemoteVideo}
            </div>
          </If>

          <div style={{width:300, height:300, float: 'right', marginTop: '400px', marginRight:'5px', display: 'flex', flexDirection: 'column'}}>
            <div>
              <div >
                <input type="file" name="files" onChange={this.handleFileInputChange.bind(this)} ref={this.fileInput}/>
                <button style={{backgroundColor: '#4CAF50', color: 'white'}} ref={this.sendFileButton}>File Send</button>
              </div>
              <a ref={this.downloadAnchor} id="download"></a>
            </div>
            <div 
              style={{width:'100%', height:200, backgroundColor: 'white'}}
              ref={this.chatBox}
            ></div>
            
            <input 
              type="text" 
              name="message" 
              style={{width:'100%', backgroundColor: 'white', margin: '5px 0'}}
              ref={this.messageInput}
            />
            
            <button style={{backgroundColor:'#4CAF50', color: 'white'}} onClick={this.sendMessage.bind(this)}>Message Send</button>
          </div>

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
              <Choose>
                <When condition={!state.screen}>
                  <ScreenShare className='control' 
                    color={'#fff'} 
                    onClick={this.handleScreenShare.bind(this)}>
                  </ScreenShare>
                </When>
                <When condition={state.screen}>
                  <CamIcon2 className='control' 
                    color={'#fff'} 
                    onClick={this.handleCameraOn.bind(this)}>
                  </CamIcon2>
                </When>
              </Choose>
              <SendRecv className='control' 
                color={'#fff'} 
                onClick={this.handleDirectionSendRecv.bind(this)}>
              </SendRecv>
              <SendOnly className='control' 
                color={'#fff'} 
                onClick={this.handleDirectionSendOnly.bind(this)}>
              </SendOnly>
              <RecvOnly className='control' 
                color={'#fff'} 
                onClick={this.handleDirectionRecvOnly.bind(this)}>
              </RecvOnly>  
              <Slider
                className='control'
                value={state.micVolume||1}
                onChange={this.handleMicVolume.bind(this)}
                min={0}
                max={1}
                step={0.1}
              />
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

      this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      this.gainNode = this.configGainNode(); 

    }

    // If incoming all we already have the remote stream
    if (remoteStream) {
      logger.debug('already have a remote stream');

      changeBandwidth(peerconnection, bandwidth);
      
      this._handleRemoteStream(remoteStream, audiooutputkey);
    }

    if (session.isEstablished()) {
      setTimeout(() => {
        if (!this._mounted)
          return;

        this.setState({ canHold: true });
      });
    }

    this.props.ua.on('newMessage', (data)=>{
      if(!data || !data.originator || data.originator !== 'remote') {
        console.log('illigal message : ', data);
        return;
      }
      this.addChatMessage(this.chatBox.current, decodeURI(data.request.body), '->')
      console.log('message : ', data);
    });

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
      changeBandwidth(peerconnection, bandwidth);
      this._handleRemoteStream(event.streams[0], audiooutputkey);
    });

    peerconnection.addEventListener('negotiationneeded', (e) => {
      if (!this._mounted) {
        logger.error('_handleRemoteStream() | component not mounted');
        return;
      }
    
      logger.debug('Peerconnection negotiationneeded event: ', e);
      
      const options = {
        useUpdate: true,
        rtcOfferConstraints:
        {
          offerToReceiveAudio: 1,
          offerToReceiveVideo: 1
        }
      }
      
      session.renegotiate(options, ()=>{
        console.log("negotiation complete!!");
      });
      
    });
    
    init(this.downloadAnchor.current);
    peerconnection.addEventListener('datachannel', receiveChannelCallback);
  }

  componentWillUnmount() {
    logger.debug('componentWillUnmount()');
    this.stopStream(this.refs.localVideo.srcObject);

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

  configGainNode() {
    const audioSource = this.audioCtx.createMediaStreamSource(this._localClonedStream);
    const gainNode = this.audioCtx.createGain(); 
    const audioDestination = this.audioCtx.createMediaStreamDestination();
    const destinationStream = audioDestination.stream;
    audioSource.connect(gainNode);
    gainNode.connect(audioDestination);
    const filteredTrack = destinationStream.getAudioTracks()[0];
    this.changeStream(this._localClonedStream, filteredTrack, false, 'audio')
    .then(()=>logger.debug('audio change success'), (e)=>logger.debug('audio change failed, cause : ', e));
    return gainNode;
  }

  handleMicVolume(event, volume) {
    logger.debug(`handleMicVolume(${volume}), gainNode : `, this.gainNode);

    this.gainNode.gain.setValueAtTime(volume, this.audioCtx.currentTime);
  }

  stopStream(stream) {
    stream.getTracks().forEach(t=>t.stop());
  }

  addChatMessage(chatbox, message, direction){
    const el = document.createElement("p");
    const txtNode = document.createTextNode(direction +' '+ message);
  
    el.appendChild(txtNode);
    chatbox.appendChild(el);
  }

  sendMessage() {
    if( !this.messageInput.current.value || this.messageInput.current.value.length ===0) {
      console.warn('undefined or empty message');
      return;
    }
    this.addChatMessage(this.chatBox.current, this.messageInput.current.value, '<-');
    const eventHandlers = {
      'succeeded': function(data){ console.log('message send succeeded, data : ', data); },
      'failed':    function(data){console.log('message send failed, data : ', data);}
    }

    const targetUri = this.props.session.remote_identity.uri.scheme+':'+this.props.session.remote_identity.uri.user+'@'+this.props.session.remote_identity.uri.host;
    this.props.ua.sendMessage(targetUri, encodeURI(this.messageInput.current.value), {'eventHandlers': eventHandlers});
    this.messageInput.current.value = '';
  }

  fileSendInitialize() {
    console.log('init file send');
  
    this.fileInput.current.value = null;
  }

  handleFileInputChange() {
    const file = this.fileInput.current.files[0];
    if (!file) {
      console.log('No file chosen');
      return;
    } 
    this.sendFileButton.current.addEventListener('click', () => {
      const fileSendPromise = sendFile(this.props.fileChannel, file);
      fileSendPromise.then(
        ()=>this.fileSendInitialize(), 
        e=>console.error('file send failed, error : ', e)
      );
    }, {once:true});
  }

  async changeStream(originStream, newTrack, stopping=false , kind='video') {
    this.props.session.connection.getSenders()
    .filter(rtpSender=>rtpSender.track && rtpSender.track.kind === kind)
    .forEach(async rtpSender => {
      try {
        if(stopping && originStream) {
          this.stopStream(originStream);
        }
        await rtpSender.replaceTrack(newTrack);
        console.log(`Replaced track from ${originStream} to ${newTrack}`);
      } catch(e) {
        console.log("Could not replace track: " + e);
        throw e;
      }
    });
  }

  handleScreenShare() {
    logger.debug('handleScreenShare()');
    (async ()=> {
      let screenStream;
      try {
        screenStream = await navigator.mediaDevices.getDisplayMedia();
        const originStream = this.refs.localVideo.srcObject; 
        await this.changeStream(originStream, screenStream.getVideoTracks()[0]);
        this.refs.localVideo.srcObject = screenStream;
        this.setState({screen: true, originStream});
      } catch(e) {
        logger.debug('failed to change camera to screen, cause : ', e);
        return;
      }
    })();
  }

  handleDirectionSendRecv() {
    logger.debug('send recv');
    this.setState({direction:'sendrecv'});
    changeDirection(this.props.session.connection, 'sendrecv');
  }

  handleDirectionSendOnly() {
    logger.debug('send only');
    this.setState({direction:'sendonly'});
    changeDirection(this.props.session.connection, 'sendonly');
  }

  handleDirectionRecvOnly() {
    logger.debug('recv only');
    this.setState({direction:'recvonly'});
    changeDirection(this.props.session.connection, 'recvonly');
  }
  

  handleCameraOn() {
    logger.debug('handleCameraon()');

    this.changeStream(this.refs.localVideo.srcObject, this.state.originStream.getVideoTracks()[0], true)
    .then(
      ()=>{
        this.refs.localVideo.srcObject = this.state.originStream;
        this.setState({screen: false,originStream: undefined});
      }, 
      (e)=>logger.debug('failed to change screen->camera, cause : ', e)
    );
  }

  _handleRemoteStream(stream, audiooutputkey) {
    logger.debug('_handleRemoteStream() [stream:%o]', stream);

    const remoteVideo = this.refs.remoteVideo;

    // Display remote stream
    remoteVideo.srcObject = stream;
    logger.debug('selected audio output : ', audiooutputkey);
    if(remoteVideo.setSinkId && typeof remoteVideo.setSinkId === 'function') {
      remoteVideo.setSinkId(audiooutputkey)
        .then(() => logger.debug('complete to set audio output, deviceId : ', audiooutputkey));
    }
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

    if(stream && stream.getVideoTracks && stream.getVideoTracks instanceof Function){
      const videoTrack = stream.getVideoTracks()[0];
      this.setState({ remoteHasVideo: Boolean(videoTrack) });
    } else {
      logger.error('remote video is null');
    }
  }
}

Session.propTypes =
{
  session: PropTypes.object.isRequired,
  onNotify: PropTypes.func.isRequired,
  onHideNotification: PropTypes.func.isRequired,
  bandwidth: PropTypes.string.isRequired,
  audiooutputkey: PropTypes.string.isRequired,
  ua: PropTypes.object.isRequired,
  // fileChannel: PropTypes.object.isRequired
};
