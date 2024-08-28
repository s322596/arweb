import {
  bootstrapCameraKit,
  CameraKitSession,
  createMediaStreamSource,
  Transform2D,
} from '@snap/camera-kit';

const liveRenderTarget = document.getElementById('canvas');
const flipCamera = document.getElementById('flip');
const cameraSelect = document.getElementById('cameras');
const lensSelect = document.getElementById('lenses');

let isBackFacing = true;
let mediaStream;
let session;

(async function () {
  const cameraKit = await bootstrapCameraKit({
    apiToken: 'eyJhbGciOiJIUzI1NiIsImtpZCI6IkNhbnZhc1MyU0hNQUNQcm9kIiwidHlwIjoiSldUIn0.eyJhdWQiOiJjYW52YXMtY2FudmFzYXBpIiwiaXNzIjoiY2FudmFzLXMyc3Rva2VuIiwibmJmIjoxNzI0NzM4NzEzLCJzdWIiOiI2NDYwYjg5Ni1hNzIwLTRhMjMtOGMyZi1hZTVlZDg2MTI4YTJ-U1RBR0lOR34zM2JhZjRiNC1hMTE0LTRhMTUtYmQxZi02YzE3OWI5YWI3MzIifQ.yNIU2DJUtajP3UEq8yN1_qcfYmRUOBUot32MQGDJcjw',
  });

  session = await cameraKit.createSession({ liveRenderTarget });

  const { lenses } = await cameraKit.lensRepository.loadLensGroups(['a29e3bd4-6725-431f-b2c9-fa1a64e59abc']);
  
  // Populate the lenses dropdown
  attachLensesToSelect(lenses, session);

  // Set the initial lens
  await session.applyLens(lenses[0]);

  // Populate the camera dropdown and set the initial camera
  attachCamerasToSelect(session);

  // Bind flip camera functionality
  bindFlipCamera(session);
})();

function bindFlipCamera(session) {
  flipCamera.style.cursor = 'pointer';

  flipCamera.addEventListener('click', () => {
    updateCamera(session);
  });

  updateCamera(session);
}

async function updateCamera(session, deviceId) {
  isBackFacing = !isBackFacing;

  flipCamera.innerText = isBackFacing ? 'Switch to Front Camera' : 'Switch to Back Camera';

  if (mediaStream) {
    session.pause();
    mediaStream.getVideoTracks()[0].stop();
  }

  mediaStream = await navigator.mediaDevices.getUserMedia({
    video: {
      deviceId: deviceId || undefined,
      facingMode: isBackFacing ? 'environment' : 'user',
    },
  });

  const source = createMediaStreamSource(mediaStream, {
    cameraType: isBackFacing ? 'back' : 'front',
  });

  await session.setSource(source);

  if (!isBackFacing) {
    source.setTransform(Transform2D.MirrorX);  // Mirror the front camera
  }

  session.play();
}

async function attachCamerasToSelect(session) {
  const devices = await navigator.mediaDevices.enumerateDevices();
  const cameras = devices.filter(({ kind }) => kind === 'videoinput');

  cameraSelect.innerHTML = ''; // Clear previous options
  cameras.forEach((camera, index) => {
    const option = document.createElement('option');
    option.value = camera.deviceId;
    option.text = camera.label || `Camera ${index + 1}`;
    cameraSelect.appendChild(option);
  });

  cameraSelect.addEventListener('change', async (event) => {
    const deviceId = event.target.value;
    await updateCamera(session, deviceId);
  });

  // Set the initial camera
  if (cameras.length > 0) {
    await updateCamera(session, cameras[0].deviceId);
  }
}

async function attachLensesToSelect(lenses, session) {
  lensSelect.innerHTML = ''; // Clear previous options
  lenses.forEach((lens) => {
    const option = document.createElement('option');
    option.value = lens.id;
    option.text = lens.name;
    lensSelect.appendChild(option);
  });

  lensSelect.addEventListener('change', async (event) => {
    const lensId = event.target.value;
    const lens = lenses.find((lens) => lens.id === lensId);
    if (lens) await session.applyLens(lens);
  });
}

