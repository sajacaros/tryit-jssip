import React from 'react';
import PropTypes from 'prop-types';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemSecondaryAction from '@material-ui/core/ListItemSecondaryAction';
import ListItemText from '@material-ui/core/ListItemText';
import Switch from '@material-ui/core/Switch';
import TextField from '@material-ui/core/TextField';

import InputLabel from '@material-ui/core/InputLabel';
import FormControl from '@material-ui/core/FormControl';
import Select from '@material-ui/core/Select';
import MenuItem from '@material-ui/core/MenuItem';

import Button from '@material-ui/core/Button';
import clone from 'clone';
import Logger from '../Logger';
import TransitionAppear from './TransitionAppear';
import Slider from '@material-ui/core/Slider';
import Typography from '@material-ui/core/Typography';7

const logger = new Logger('Settings');

function groupingConnectedDevices(callback) {  
  (async() => {
    let devicesGroupByKind;
    try {
      await navigator.mediaDevices.getUserMedia({audio:true,video:true});
      const devices = await navigator.mediaDevices.enumerateDevices();
      devicesGroupByKind = devices.reduce(
        (group, device) => {
          (group[device['kind']] = group[device['kind']] || []).push(device);
          return group;
        }, {});
      } catch(e) {
        logger.debug(e);
      return;
    }
    callback(devicesGroupByKind);
  })();
}

export default class Settings extends React.Component {
  constructor(props) {
    super(props);

    const settings = props.settings;

    this.state =
    {
      settings: clone(settings, false),
      deviceInit: false
    };
    this.initDevice = this.initDevice.bind(this);
    groupingConnectedDevices(this.initDevice);
  }

  initDevice(group) {
    logger.debug('device init, devices : ', group);
    const settings = this.state.settings;
    if (!settings.audioinputkey) {
      settings.audioinputkey = group.audioinput[0].deviceId;
    }

    if (!settings.audiooutputkey) {
      settings.audiooutputkey = group.audiooutput[0].deviceId;
    }

    if (!settings.videoinputkey) {
      settings.videoinputkey = group.videoinput[0].deviceId;
    }

    this.setState({
      ...settings,
      audioinput: group.audioinput,
      audiooutput: group.audiooutput,
      videoinput: group.videoinput,
      deviceInit: true
    });
  }

  render() {
    const settings = this.state.settings;
    let audioinput;
    let audiooutput;
    let videoinput;
    let audioinputSelector;
    let audiooutputSelector;
    let videoinputSelector;
    // if (this.state.deviceInit) {
      audioinput = this.state.audioinput || [];
      audiooutput = this.state.audiooutput || [];
      videoinput = this.state.videoinput || [];

      audioinputSelector = (
        <div className='item'>
          <InputLabel shrink id="audioinput-label">
            audioinput
          </InputLabel>
          <Select
            labelId="audioinput-label"
            id="audioinput-select"
            defaultValue={settings.audioinputkey}
            value={settings.audioinputkey}
            onChange={this.handleChangeAudioinput.bind(this)}
            fullWidth
          >
            {audioinput.map(d => {
              return (<MenuItem value={d.deviceId} key={d.deviceId}>{d.label}</MenuItem>)
            })}
          </Select>
        </div>);

      audiooutputSelector = (
        <div className='item'>
          <InputLabel shrink id="audiooutput-label">
            audiooutput
          </InputLabel>
          <Select
            labelId="audiooutput-label"
            id="audiooutput-select"
            defaultValue={settings.audiooutputkey}
            value={settings.audiooutputkey}
            onChange={this.handleChangeAudiooutput.bind(this)}
            fullWidth
          >
            {audiooutput.map(d => {
              return (<MenuItem value={d.deviceId} key={d.deviceId}>{d.label}</MenuItem>)
            })}
          </Select>
        </div>);

      videoinputSelector = (
        <div className='item'>
          <InputLabel shrink id="videoinput-label">
            videoinput
          </InputLabel>
          <Select
            labelId="videoinput-label"
            id="videoinput-selector"
            defaultValue={settings.videoinputkey}
            value={settings.videoinputkey}
            onChange={this.handleChangeVideoinput.bind(this)}
            fullWidth
          >
            {videoinput.map(d => {
              return (<MenuItem value={d.deviceId} key={d.deviceId}>{d.label}</MenuItem>)
            })}
          </Select>
        </div>);
    return (
      <TransitionAppear duration={250}>
        <div data-component='Settings'>
          <h1>JsSIP UA settings</h1>

          <div className='item'>
            <TextField
              floatingLabelText='SIP URI'
              value={settings.uri || ''}
              floatingLabelFixed
              fullWidth
              onChange={this.handleChangeSipUri.bind(this)}
            />
          </div>

          <div className='item'>
            <TextField
              floatingLabelText='SIP password'
              value={settings.password || ''}
              floatingLabelFixed
              fullWidth
              type='password'
              onChange={this.handleChangePassword.bind(this)}
            />
          </div>

          <div className='item'>
            <TextField
              floatingLabelText='WebSocket URI'
              value={settings.socket.uri || ''}
              floatingLabelFixed
              fullWidth
              onChange={this.handleChangeWebSocketUri.bind(this)}
            />
          </div>

          <div className='item'>
            <InputLabel shrink id="transport-label">
              Via transport
            </InputLabel>
            <Select
              labelId="transport-label"
              id="transport-selecor"
              value={settings.socket.via_transport || 'auto'}
              fullWidth
              onChange={this.handleChangeViaTransport.bind(this)}
            >
              <MenuItem value='auto'>auto</MenuItem>
              <MenuItem value='tcp'>TCP</MenuItem>
              <MenuItem value='tls'>TLS</MenuItem>
              <MenuItem value='ws'>WS</MenuItem>
              <MenuItem value='wss'>WSS</MenuItem>
            </Select>
          </div>

          {audioinputSelector}
          {audiooutputSelector}
          {videoinputSelector}

          <div className='item'>
            <InputLabel shrink id="resolution-label">
              Resolution
            </InputLabel>
            <Select
              labelId="resolution-label"
              id="resolution-selecor"
              value={settings.resolution || 'HD'}
              fullWidth
              onChange={this.handleChangeResolution.bind(this)}
            >
              <MenuItem value='QVGA'>QVGA</MenuItem>
              <MenuItem value='VGA'>VGA</MenuItem>
              <MenuItem value='HD'>HD</MenuItem>
              <MenuItem value='FULLHD'>FULL HD</MenuItem>
              <MenuItem value='FOURK'>4K</MenuItem>
              <MenuItem value='EIGHTK'>8K</MenuItem>
            </Select>
          </div>

          <div className='item'>
            <InputLabel shrink id="audio-codec-label">
              Audio Codec
            </InputLabel>
            <Select
              labelId="audio-codec-label"
              id="audio-codec-selecor"
              value={settings.audioCodec || 'opus'}
              fullWidth
              onChange={this.handleChangeAudioCodec.bind(this)}
            >
              <MenuItem value='opus'>OPUS</MenuItem>
              <MenuItem value='PCMU'>PCMU</MenuItem>
              <MenuItem value='PCMA'>PCMA</MenuItem>
              <MenuItem value='G722'>G722</MenuItem>
            </Select>
          </div>

          <div className='item'>
            <InputLabel shrink id="video-codec-label">
              Video Codec
            </InputLabel>
            <Select
              labelId="video-codec-label"
              id="video-codec-selecor"
              value={settings.videoCodec || 'H264'}
              fullWidth
              onChange={this.handleChangeVideoCodec.bind(this)}
            >
              <MenuItem value='H264'>H264</MenuItem>
              <MenuItem value='VP8'>VP8</MenuItem>
              <MenuItem value='VP9'>VP9</MenuItem>
            </Select>
          </div>

          <div className='item'>
            <InputLabel shrink id="bandwidth-label">
              Bandwidth
            </InputLabel>
            <Select
              labelId="bandwidth-label"
              id="bandwidth-selecor"
              value={settings.bandwidth || '1024'}
              fullWidth
              onChange={this.handleChangeBandwidth.bind(this)}
            >
              <MenuItem value='128'>128 kbps</MenuItem>
              <MenuItem value='256'>256 kbps</MenuItem>
              <MenuItem value='512'>512 kbps</MenuItem>
              <MenuItem value='768'>786 kbps</MenuItem>
              <MenuItem value='1024'>1024 kbps</MenuItem>
              <MenuItem value='2048'>2048 kbps</MenuItem>
              <MenuItem value='4096'>4096 kbps</MenuItem>
              <MenuItem value='8192'>8192 kbps</MenuItem>
            </Select>
          </div>

          <div className='item'>
            <Typography id="framerate-slider">
              Framerate : {settings.framerateMin} ~ {settings.framerateMax}
            </Typography>
            <Slider
              value={[settings.framerateMin, settings.framerateMax]}
              onChange={this.handleChangeFramerate.bind(this)}
              valueLabelDisplay="auto"
              aria-labelledby="framerate-slider"
              getAriaValueText={r=>`${r} bps`}
              min={0}
              max={60}
              step={5}
              valueLabelDisplay="on"
            />
          </div>

          <div className='separator' />

          <List>
            <ListItem>
              <ListItemText 
                primary='Session Timers'
                secondary='Enable Session Timers as per RFC 4028'
                id='switch-session-timer'
              >
              </ListItemText>
              <ListItemSecondaryAction>
                <Switch
                  edge="end"
                  onChange={this.handleToogleSessionTimers.bind(this)}
                  checked={settings.session_timers}
                  inputProps={{ 'aria-labelledby': 'switch-session-timer' }}
                />
              </ListItemSecondaryAction>
            </ListItem>

            <ListItem>
              <ListItemText
                primary='Preloaded Route'
                secondary='Add a Route header with the server URI'
                id='switch-preleaded-route'
              />
              <ListItemSecondaryAction>
                <Switch
                  edge="end"
                  onChange={this.handleToogleUsePreloadedRoute.bind(this)}
                  checked={settings.use_preloaded_route}
                  inputProps={{ 'aria-labelledby': 'switch-session-timer' }}
                />
              </ListItemSecondaryAction>
            </ListItem>
          </List>

          <div className='separator' />

          <div className='buttons'>
            <Button
              label='Cancel'
              secondary
              style={{ display: 'block' }}
              onClick={this.handleCancel.bind(this)}
            />

            <Button
              label='OK'
              primary
              style={{ display: 'block' }}
              onClick={this.handleSubmit.bind(this)}
            />
          </div>
        </div>
      </TransitionAppear >
    );
  }

  handleChangeSipUri(event) {
    const settings = this.state.settings;

    settings.uri = event.target.value;
    this.setState({ settings });
  }

  handleChangePassword(event) {
    const settings = this.state.settings;

    settings.password = event.target.value;
    this.setState({ settings });
  }

  handleChangeWebSocketUri(event) {
    const settings = this.state.settings;

    settings.socket.uri = event.target.value;
    this.setState({ settings });
  }

  handleChangeViaTransport(event, key, value) {
    const settings = this.state.settings;

    settings.socket['via_transport'] = value;
    this.setState({ settings });
  }

  handleChangeAudioinput(event, key, value) {
    const settings = this.state.settings;

    settings.audioinputkey = value;
    this.setState({ settings });
  }

  handleChangeAudiooutput(event, key, value) {
    const settings = this.state.settings;

    settings.audiooutputkey = value;
    this.setState({ settings });
  }

  handleChangeVideoinput(event, key, value) {
    const settings = this.state.settings;

    settings.videoinputkey = value;
    this.setState({ settings });
  }

  handleChangeResolution(event, key, value) {
    const settings = this.state.settings;

    settings.resolution = value;
    this.setState({ settings });
  }



  handleChangeAudioCodec(event, key, value) {
    const settings = this.state.settings;

    settings.audioCodec = value;
    this.setState({ settings });
  }

  handleChangeFramerate(event, value) {
    const settings = this.state.settings;
    settings.framerateMin = value[0];
    settings.framerateMax = value[1];

    this.setState({ settings });
  }

  handleChangeBandwidth(event, key, value) {
    const settings = this.state.settings;

    settings.bandwidth = value;
    this.setState({ settings });
  }


  handleChangeVideoCodec(event, key, value) {
    const settings = this.state.settings;

    settings.videoCodec = value;
    this.setState({ settings });
  }

  handleChangeRegistrarServer(event) {
    const settings = this.state.settings;

    settings['registrar_server'] = event.target.value;
    this.setState({ settings });
  }

  handleChangeContactUri(event) {
    const settings = this.state.settings;

    settings['contact_uri'] = event.target.value;
    this.setState({ settings });
  }

  handleChangeAuthorizationUser(event) {
    const settings = this.state.settings;

    settings['authorization_user'] = event.target.value;
    this.setState({ settings });
  }

  handleToogleSessionTimers() {
    const settings = this.state.settings;

    settings['session_timers'] = !settings.session_timers;
    this.setState({ settings });
  }

  handleToogleUsePreloadedRoute() {
    const settings = this.state.settings;

    settings['use_preloaded_route'] = !settings.use_preloaded_route;
    this.setState({ settings });
  }

  handleSubmit() {
    logger.debug('handleSubmit()');

    const settings = this.state.settings;

    this.props.onSubmit(settings);
  }

  handleCancel() {
    logger.debug('handleCancel()');

    this.props.onCancel();
  }
}

Settings.propTypes =
{
  settings: PropTypes.object.isRequired,
  onSubmit: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired
};
