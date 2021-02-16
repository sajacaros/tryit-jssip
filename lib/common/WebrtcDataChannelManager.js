const chunkSize = 16384;
let fileReader;
let downloadAnchor = document.querySelector('a#download');

const readSlice = (file, currentOffset) => {
  console.log('readSlice ', currentOffset);
  const slice = file.slice(currentOffset, currentOffset + chunkSize);
  fileReader.readAsArrayBuffer(slice);
};

let downloadInProgress = false;
let receiveBuffer = [];
let incomingFileInfo;
let receivedSize = 0;

const onReceiveFileCallback = ({data}) => {
  if(downloadInProgress=== false) {
    incomingFileInfo = JSON.parse( data.toString() );
    console.log('incoming data : ', incomingFileInfo);
    // console.log(`${incomingFileInfo.fileName} : ${incomingFileInfo.fileSize}`);
    downloadInProgress = true;
  } else {
    console.log(`Received Message ${data.byteLength}`);
    receiveBuffer.push(data);
    receivedSize += data.byteLength;

    if (receivedSize === incomingFileInfo.fileSize) {
      const received = new Blob(receiveBuffer);
      receiveBuffer = [];

      downloadAnchor.href = URL.createObjectURL(received);
      downloadAnchor.download = incomingFileInfo.fileName;
      downloadAnchor.textContent =
        `Click to download '${incomingFileInfo.fileName}' (${incomingFileInfo.fileSize} bytes)`;
      downloadAnchor.style.display = 'block';

      fileRecvEnd();
    }
  }
}

async function onReceiveChannelStateChange(e) {
  console.log('Receive channel state is: ', e);
}

function fileRecvEnd() {
  console.log('complete to receive file, file : ', );

  downloadInProgress = false;
  receiveBuffer = [];
  receivedSize = 0;
}

const init = (anchor) => {
  downloadAnchor = anchor;
}

const sendFile = (channel, file) => {
  return new Promise((resolve, reject) => {
    console.log(`File is ${[file.name, file.size, file.type, file.lastModified].join(' ')}`);

    if (file.size === 0) {
      reject('File is empty');
      return;
    }
    
    channel.send(JSON.stringify({
      fileName: file.name,
      fileSize: file.size
    }));
    
    fileReader = new FileReader();
    let offset = 0;
    fileReader.addEventListener('error', error => console.error('Error reading file:', error));
    fileReader.addEventListener('abort', event => console.log('File reading aborted:', event));
    fileReader.addEventListener('load', chunk => {
      console.log('FileRead.onload ', chunk);
      channel.send(chunk.target.result);
      offset += chunk.target.result.byteLength;
      if (offset < file.size) {
        readSlice(file, offset);
      } else {
        resolve();
      }
    });
    readSlice(file, 0);
  });
}

function receiveChannelCallback(event) {
  console.log('Receive Channel Callback, event : ', event);
  const receiveChannel = event.channel;
  if(event.channel.label === 'sendDataChannel'){
    // receiveChannel.binaryType = 'arraybuffer';
    receiveChannel.onmessage = onReceiveFileCallback;
    receiveChannel.onopen = onReceiveChannelStateChange;
    receiveChannel.onclose = onReceiveChannelStateChange;

    receivedSize = 0;
    downloadAnchor.textContent = '';
    downloadAnchor.removeAttribute('download');
    if (downloadAnchor.href) {
      URL.revokeObjectURL(downloadAnchor.href);
      downloadAnchor.removeAttribute('href');
    }
  } 
}

export {init, receiveChannelCallback, sendFile};