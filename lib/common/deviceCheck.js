export function groupingConnectedDevices(callback) {  
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
