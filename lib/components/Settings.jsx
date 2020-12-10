import React from 'react';
import PropTypes from 'prop-types';
import { List, ListItem } from 'material-ui/List';
import TextField from 'material-ui/TextField';
import Toggle from 'material-ui/Toggle';
import SelectField from 'material-ui/SelectField';
import MenuItem from 'material-ui/MenuItem';
import RaisedButton from 'material-ui/RaisedButton';
import clone from 'clone';
import Logger from '../Logger';
import TransitionAppear from './TransitionAppear';
import Slider from 'material-ui/Slider';

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
          <SelectField
            floatingLabelText='audioinput'
            value={settings.audioinputkey}
            fullWidth
            onChange={this.handleChangeAudioinput.bind(this)}
          >
            {audioinput.map(d => {
              return (<MenuItem value={d.deviceId} key={d.deviceId} primaryText={d.label} />)
            })}
          </SelectField></div>);

      audiooutputSelector = (
        <div className='item'>
          <SelectField
            floatingLabelText='audiooutput'
            value={settings.audiooutputkey}
            fullWidth
            onChange={this.handleChangeAudiooutput.bind(this)}
          >
            {audiooutput.map(d => {
              return (<MenuItem value={d.deviceId} key={d.deviceId} primaryText={d.label} />)
            })}
          </SelectField></div>);
      videoinputSelector = (
        <div className='item'>
          <SelectField
            floatingLabelText='videoinput'
            value={settings.videoinputkey}
            fullWidth
            onChange={this.handleChangeVideoinput.bind(this)}
          >
            {videoinput.map(d => {
              return (<MenuItem value={d.deviceId} key={d.deviceId} primaryText={d.label} />)
            })}
          </SelectField></div>);
    // }
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
            <SelectField
              floatingLabelText='Via transport'
              value={settings.socket.via_transport || 'auto'}
              fullWidth
              onChange={this.handleChangeViaTransport.bind(this)}
            >
              <MenuItem value='auto' primaryText='auto' />
              <MenuItem value='tcp' primaryText='TCP' />
              <MenuItem value='tls' primaryText='TLS' />
              <MenuItem value='ws' primaryText='WS' />
              <MenuItem value='wss' primaryText='WSS' />
            </SelectField>
          </div>


          {audioinputSelector}
          {audiooutputSelector}
          {videoinputSelector}

          <div className='item'>
            <SelectField
              floatingLabelText='resolution'
              value={settings.resolution || 'HD'}
              fullWidth
              onChange={this.handleChangeResolution.bind(this)}
            >
              <MenuItem value='QVGA' primaryText='QVGA' />
              <MenuItem value='VGA' primaryText='VGA' />
              <MenuItem value='HD' primaryText='HD' />
              <MenuItem value='FULLHD' primaryText='FULL HD' />
              <MenuItem value='FOURK' primaryText='4K' />
              <MenuItem value='EIGHTK' primaryText='8K' />
            </SelectField>
          </div>

          <div className='item'>
            <SelectField
              floatingLabelText='audio codec'
              value={settings.audioCodec || 'opus'}
              fullWidth
              onChange={this.handleChangeAudioCodec.bind(this)}
            >
              <MenuItem value='opus' primaryText='OPUS' />
              <MenuItem value='PCMU' primaryText='PCMU' />
              <MenuItem value='PCMA' primaryText='PCMA' />
              <MenuItem value='G722' primaryText='G722' />
            </SelectField>
          </div>

          <div className='item'>
            <SelectField
              floatingLabelText='video codec'
              value={settings.videoCodec || 'H264'}
              fullWidth
              onChange={this.handleChangeVideoCodec.bind(this)}
            >
              <MenuItem value='H264' primaryText='H264' />
              <MenuItem value='VP8' primaryText='VP8' />
              <MenuItem value='VP9' primaryText='VP9' />
            </SelectField>
          </div>
          <div className='item'>
            <SelectField
              floatingLabelText='bandwidth'
              value={settings.bandwidth || '1024'}
              fullWidth
              onChange={this.handleChangeBandwidth.bind(this)}
            >
              <MenuItem value='128' primaryText='128 kbps' />
              <MenuItem value='256' primaryText='256 kbps' />
              <MenuItem value='512' primaryText='512 kbps' />
              <MenuItem value='768' primaryText='768 kbps' />
              <MenuItem value='1024' primaryText='1024 kbps' />
              <MenuItem value='2048' primaryText='2048 kbps' />
              <MenuItem value='4096' primaryText='4096 kbps' />
              <MenuItem value='8192' primaryText='8192 kbps' />
            </SelectField>
          </div>
          <div className='item'>
            <label>framerate: </label>
            <span>{settings.framerateMin}</span>
            <span>~</span>
            <span>{settings.framerateMax}</span>
            <Slider
              value={settings.framerateMin}
              onChange={this.handleChangeFramerateMin.bind(this)}
              min={0}
              max={60}
              step={5}
            />
            <Slider
              value={settings.framerateMax}
              onChange={this.handleChangeFramerateMax.bind(this)}
              min={0}
              max={60}
              step={5}
            />
          </div>

          <div className='separator' />

          <List>
            <ListItem
              primaryText='Session Timers'
              secondaryText='Enable Session Timers as per RFC 4028'
              secondaryTextLines={1}
              rightToggle={
                <Toggle
                  defaultToggled={settings.session_timers}
                  onToggle={this.handleToogleSessionTimers.bind(this)}
                />
              }
            />

            <ListItem
              primaryText='Preloaded Route'
              secondaryText='Add a Route header with the server URI'
              secondaryTextLines={1}
              rightToggle={
                <Toggle
                  defaultToggled={settings.use_preloaded_route}
                  onToggle={this.handleToogleUsePreloadedRoute.bind(this)}
                />
              }
            />
          </List>

          <div className='separator' />

          <div className='buttons'>
            <RaisedButton
              label='Cancel'
              secondary
              style={{ display: 'block' }}
              onClick={this.handleCancel.bind(this)}
            />

            <RaisedButton
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

    settings.videooutputkey = value;
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

  handleChangeFramerateMin(event, value) {
    const settings = this.state.settings;
    if (settings.framerateMax <= value) {
      settings.framerateMax = value
    }
    settings.framerateMin = value;

    this.setState({ settings });
  }

  handleChangeBandwidth(event, key, value) {
    const settings = this.state.settings;

    settings.bandwidth = value;
    this.setState({ settings });
  }

  handleChangeFramerateMax(event, value) {
    const settings = this.state.settings;
    if (value <= settings.framerateMin) {
      settings.framerateMin = value;
    }
    settings.framerateMax = value;

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
