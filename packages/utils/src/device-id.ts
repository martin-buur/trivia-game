export function generateDeviceId(): string {
  return crypto.randomUUID();
}

export function getDeviceId(): string {
  const storedId = localStorage.getItem('deviceId');
  if (storedId) {
    return storedId;
  }

  const newId = generateDeviceId();
  localStorage.setItem('deviceId', newId);
  return newId;
}
