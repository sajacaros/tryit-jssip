import clone from 'clone';
import deepmerge from 'deepmerge';
import Logger from './Logger';

import storage from './storage';

const logger = new Logger('settingsManager');

const DEFAULT_SIP_DOMAIN = 'bts.smartseecloud.com';
const DEFAULT_SETTINGS =
{
	'display_name' : null,
	uri            : null,
	password       : null,
	socket         :
	{
		uri             : 'wss://bts.smartseecloud.com:6066',
		// uri             : 'ws://61.105.58.243:6060',
		'via_transport' : 'auto'
	},
	'registrar_server'    : null,
	'contact_uri'         : null,
	'authorization_user'  : null,
	'instance_id'         : null,
	'session_timers'      : true,
	'use_preloaded_route' : false,
	pcConfig              :
	{
		// rtcpMuxPolicy : 'negotiate',
		iceServers    :
		[
			{ urls: [ 'stun:stun.l.google.com:19302' ] },
		]
	},
	callstats :
	{
		enabled   : false,
		AppID     : null,
		AppSecret : null
	},
	resolution : 'VGA',
	audioCodec : 'opus',
	videoCodec : 'H264',
	framerateMin : 10,
	framerateMax : 30
};

let settings;

// First, read settings from local storage
settings = storage.get();

if (settings)
	logger.debug('settings found in local storage');

// Try to read settings from a global SETTINGS object
if (window.SETTINGS)
{
	logger.debug('window.SETTINGS found');

	settings = deepmerge(
		window.SETTINGS,
		settings || {},
		{ arrayMerge: (destinationArray, sourceArray) => sourceArray });
}

// If not settings are found, clone default ones
if (!settings)
{
	logger.debug('no settings found, using default ones');

	settings = clone(DEFAULT_SETTINGS, false);
}

module.exports =
{
	get()
	{
		return settings;
	},

	set(newSettings)
	{
		storage.set(newSettings);
		settings = newSettings;
	},

	clear()
	{
		storage.clear();
		settings = clone(DEFAULT_SETTINGS, false);
	},

	isReady()
	{
		return Boolean(settings.uri);
	},

	getDefaultDomain()
	{
		return DEFAULT_SIP_DOMAIN;
	}
};
