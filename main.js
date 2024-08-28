import { bootstrapCameraKit } from '@snap/camera-kit';

let session, cameraKit, liveRenderTarget;

async function initCamera(cameraFacingMode) {
  const constraints = {
    video: {
      facingMode: cameraFacingMode,
    },
  };
  
  const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
  
  await session.setSource(mediaStream);
  await session.play();
}

(async function () {
  cameraKit = await bootstrapCameraKit({
    apiToken: 'eyJhbGciOiJIUzI1NiIsImtpZCI6IkNhbnZhc1MyU0hNQUNQcm9kIiwidHlwIjoiSldUIn0.eyJhdWQiOiJjYW52YXMtY2FudmFzYXBpIiwiaXNzIjoiY2FudmFzLXMyc3Rva2VuIiwibmJmIjoxNzI0NzM4NzEzLCJzdWIiOiI2NDYwYjg5Ni1hNzIwLTRhMjMtOGMyZi1hZTVlZDg2MTI4YTJ-U1RBR0lOR34zM2JhZjRiNC1hMTE0LTRhMTUtYmQxZi02YzE3OWI5YWI3MzIifQ.yNIU2DJUtajP3UEq8yN1_qcfYmRUOBUot32MQGDJcjw',
  });

  liveRenderTarget = document.getElementById('canvas');
  session = await cameraKit.createSession({ liveRenderTarget });

  // Initialize with the front camera mirrored
  await initCamera('user'); // 'user' is the front camera

  const lens = await cameraKit.lensRepository.loadLens(
    'a91e3dad-8929-4ed4-967f-6b28019aa088',
    'a29e3bd4-6725-431f-b2c9-fa1a64e59abc'
  );

  await session.applyLens(lens);
})();

// Function to switch between front and back cameras
window.switchCamera = async function (cameraFacingMode) {
  await session.stop(); // Stop the current camera session
  
  if (cameraFacingMode === 'front') {
    document.getElementById('canvas').style.transform = 'scaleX(-1)'; // Mirror the front camera
    await initCamera('user'); // 'user' is the front camera
  } else {
    document.getElementById('canvas').style.transform = 'scaleX(1)'; // Do not mirror the back camera
    await initCamera('environment'); // 'environment' is the back camera
  }
};
