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

// New elements for image capture and preview
const captureButton = document.getElementById('capture');
const imagePreviewSection = document.getElementById('image-preview-section');
const imagePreview = document.getElementById('image-preview');
const downloadImageButton = document.getElementById('download-image');

// Elements for timer functionality
const timerSelect = document.getElementById('timer-select');
const countdownDisplay = document.getElementById('countdown-display');
const countdownText = document.getElementById('countdown-text');

let isBackFacing = true;
let mediaStream;
let session;
let mediaRecorder;
let downloadUrl;

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

  // Bind recording functionality
  bindRecorder();

  // Bind capture functionality
  bindCapture();
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

// Capture a picture from the canvas with a timer
function bindCapture() {
  captureButton.addEventListener('click', () => {
    const canvas = document.getElementById('canvas');
    const timerValue = parseInt(timerSelect.value, 10);

    if (timerValue > 0) {
      // Display countdown
      countdownDisplay.style.display = 'block';
      let countdown = timerValue;

      const countdownInterval = setInterval(() => {
        countdownText.innerText = countdown;
        countdown--;

        if (countdown < 0) {
          clearInterval(countdownInterval);
          countdownDisplay.style.display = 'none';

          // Capture the image after the countdown
          captureImage(canvas);
        }
      }, 1000);
    } else {
      // No timer, capture the image immediately
      captureImage(canvas);
    }
  });
}

// Helper function to capture the image
function captureImage(canvas) {
  // Capture the current content of the canvas as an image
  const imageData = canvas.toDataURL('image/png');

  // Set the preview image source to the captured image data
  imagePreview.src = imageData;

  // Show the preview section
  imagePreviewSection.style.display = 'block';

  // Enable download functionality for the captured image
  downloadImageButton.addEventListener('click', () => {
    const link = document.createElement('a');
    link.href = imageData;
    link.download = 'ar-snapshot.png'; // File name for the downloaded image
    link.click();
  });
}

function bindRecorder() {
  startRecordingButton.addEventListener('click', () => {
    videoContainer.style.display = 'none';
    imagePreviewSection.style.display = 'none';
    startRecordingButton.disabled = true;
    stopRecordingButton.disabled = false;

    mediaRecorder = new MediaRecorder(mediaStream);

    const chunks = [];
    mediaRecorder.ondataavailable = function (event) {
      if (event.data.size > 0) {
        chunks.push(event.data);
      }
    };

    mediaRecorder.onstop = function () {
      const blob = new Blob(chunks, { type: 'video/mp4' });
      downloadUrl = URL.createObjectURL(blob);
      videoTarget.src = downloadUrl;

      videoContainer.style.display = 'block';
      downloadButton.addEventListener('click', () => {
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = 'ar-video.mp4';  // File name for the downloaded video
        link.click();
      });
    };

    mediaRecorder.start();
  });

  stopRecordingButton.addEventListener('click', () => {
    mediaRecorder.stop();
    startRecordingButton.disabled = false;
    stopRecordingButton.disabled = true;
  });
}
