import {
  bootstrapCameraKit,
  createMediaStreamSource,
  Transform2D,
} from '@snap/camera-kit';

const liveRenderTarget = document.getElementById('canvas');
const flipCamera = document.getElementById('flip');
const cameraSelect = document.getElementById('cameras');
const lensSelect = document.getElementById('lenses');
const videoContainer = document.getElementById('video-container');
const videoTarget = document.getElementById('video');
const startRecordingButton = document.getElementById('start');
const stopRecordingButton = document.getElementById('stop');
const downloadButton = document.getElementById('download');

let isBackFacing = true;
let mediaStream;
let session;
let mediaRecorder;
let downloadUrl;

(async function () {
  try {
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

    // Bind recording functionality
    bindRecorder();

  } catch (err) {
    console.error('Error initializing camera kit:', err);
    alert('Unable to access camera. Please allow camera permissions.');
  }
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

  try {
    mediaStream = await navigator.mediaDevices.getUserMedia({
      video: {
        deviceId: deviceId || undefined,
        facingMode: isBackFacing ? 'environment' : 'user',
        width: { ideal: 1280 }, // Mobile-friendly resolution
        height: { ideal: 720 },
      },
      audio: true, // Enable audio recording
    });

    const source = createMediaStreamSource(mediaStream, {
      cameraType: isBackFacing ? 'back' : 'front',
    });

    await session.setSource(source);

    if (!isBackFacing) {
      source.setTransform(Transform2D.MirrorX);  // Mirror the front camera for better user experience
    }

    session.play();
  } catch (err) {
    console.error('Error updating camera:', err);
    alert('Error accessing camera. Please try again.');
  }
}

async function attachCamerasToSelect(session) {
  try {
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
  } catch (err) {
    console.error('Error fetching cameras:', err);
    alert('Error fetching cameras. Please try again.');
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

function bindRecorder() {
  startRecordingButton.addEventListener('click', () => {
    startRecordingButton.disabled = true;
    stopRecordingButton.disabled = false;
    downloadButton.disabled = true;
    videoContainer.style.display = 'none';

    const mediaStream = liveRenderTarget.captureStream(30);

    mediaRecorder = new MediaRecorder(mediaStream);
    mediaRecorder.addEventListener('dataavailable', (event) => {
      if (!event.data.size) {
        console.warn('No recorded data available');
        return;
      }

      const blob = new Blob([event.data]);

      downloadUrl = window.URL.createObjectURL(blob);
      downloadButton.disabled = false;

      videoTarget.src = downloadUrl;
      videoContainer.style.display = 'block';

      // Ensure video playback is user-triggered on mobile
      videoTarget.addEventListener('click', () => {
        videoTarget.play();
      });
    });

    mediaRecorder.start();
  });

  stopRecordingButton.addEventListener('click', () => {
    startRecordingButton.disabled = false;
    stopRecordingButton.disabled = true;

    mediaRecorder?.stop();
  });

  downloadButton.addEventListener('click', () => {
    const link = document.createElement('a');

    link.setAttribute('style', 'display: none');
    link.href = downloadUrl;
    link.download = 'camera-kit-web-recording.mp4';
    link.click();
    link.remove();
  });
}
