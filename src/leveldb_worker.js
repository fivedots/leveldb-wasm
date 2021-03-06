// Switch to false if your browser doesn't support IOFS
var enableIOFS = false;

// Switch to false if your browser doesn't support NativeIOFS
var enableNativeIOFS = true;

// Switch to false if your setup doesn't support Asyncify and AsyncFS.
var enableAsyncIOFS = false;

function leveldbOptionsCreate() {
  return Module.leveldb_options_create();
}

function leveldbReadOptionsCreate() {
  return Module.leveldb_readoptions_create();
}

function leveldbWriteOptionsCreate() {
  return Module.leveldb_writeoptions_create();
}

function leveldbOpen(options, name) {
  return Module.leveldb_open(options, name);
}

function leveldbClose(database) {
  return Module.leveldb_close(database);
}

function handler(port, data) {
  switch (data.command) {
    case 'leveldbOptionsCreate':
      leveldbOptionsCreate()
        .then(connection => port.postMessage({connection: connection}))
        .catch(err => port.postMessage({error: err}));
      break;
    case 'leveldbReadOptionsCreate':
      leveldbReadOptionsCreate()
        .then(connection => port.postMessage({connection: connection}))
        .catch(err => port.postMessage({error: err}));
      break;
    case 'leveldbWriteOptionsCreate':
      leveldbWriteOptionsCreate()
        .then(connection => port.postMessage({connection: connection}))
        .catch(err => port.postMessage({error: err}));
      break;
    case 'leveldbOpen':
      leveldbOpen(data.request.options, data.request.name)
        .then(connection => port.postMessage({connection: connection}))
        .catch(err => port.postMessage({error: err}));
      break;
    case 'fsUnlink':
      try {
        FS.unlink(data.request.file);
        port.postMessage({});
      } catch (e) {
        port.postMessage({error: {
          errno: e.errno,
          code: e.code,
          message: e.message,
        }});
      }
      break;
    case 'profile':
      console.log('Profile', CHROMEFS.profileData);
      if(enableIOFS) {
        console.log('Profile', IOFS.profileData);
      }
      break;
    default:
      port.postMessage({error: 'Unknown command ', data});
      break;
  }
}

function handlerInitialized(port, data) {
  if (ready) {
    handler(port, data);
  } else {
    closures.push(function() { handler(port, data); });
  }
}

// Channel for Web worker.
onmessage = function(event) {
  handlerInitialized(event.ports[0], event.data);
};

// Channel for Shared worker.
onconnect = function(e) {
  e.ports.forEach(function(port) {
    port.onmessage = function(event) {
      handlerInitialized(event.ports[0], event.data);
    };
  });
}

var ready = false;
var closures = [];

Module.onRuntimeInitialized = function() {
  console.log('LevelDB worker on runtime initialized');
  FS.mkdir('/chrome');
  FS.mount(CHROMEFS, { root: '.' }, '/chrome');

  if (enableIOFS) {
    FS.mkdir('/io');
    FS.mount(IOFS, { root: '.' }, '/io');
  }

  if (enableNativeIOFS) {
    FS.mkdir('/nativeio');
    FS.mount(NATIVEIOFS, { root: '.' }, '/nativeio');
  }

  if (enableAsyncIOFS) {
    FS.mkdir('/async_io');
    FS.mount(AsyncFSImpl, { root: '.' }, '/async_io');
  }

  var callbacks = closures;
  closures = null;
  ready = true;
  callbacks.forEach(callback => callback());
}
