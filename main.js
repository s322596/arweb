import { bootstrapCameraKit } from '@snap/camera-kit';

(async function () {
  const cameraKit = await bootstrapCameraKit({
    apiToken: 'eyJhbGciOiJIUzI1NiIsImtpZCI6IkNhbnZhc1MyU0hNQUNQcm9kIiwidHlwIjoiSldUIn0.eyJhdWQiOiJjYW52YXMtY2FudmFzYXBpIiwiaXNzIjoiY2FudmFzLXMyc3Rva2VuIiwibmJmIjoxNzI0NzM4NzEzLCJzdWIiOiI2NDYwYjg5Ni1hNzIwLTRhMjMtOGMyZi1hZTVlZDg2MTI4YTJ-U1RBR0lOR34zM2JhZjRiNC1hMTE0LTRhMTUtYmQxZi02YzE3OWI5YWI3MzIifQ.yNIU2DJUtajP3UEq8yN1_qcfYmRUOBUot32MQGDJcjw',
  });
  const liveRenderTarget = document.getElementById('canvas');
  const session = await cameraKit.createSession({ liveRenderTarget });
  const mediaStream = await navigator.mediaDevices.getUserMedia({
    video: true,
  });

  await session.setSource(mediaStream);
  await session.play();

  const lens = await cameraKit.lensRepository.loadLens(
    'a91e3dad-8929-4ed4-967f-6b28019aa088',
    'a29e3bd4-6725-431f-b2c9-fa1a64e59abc'
  );

  await session.applyLens(lens);
})();