import { BrowserMediaDevices } from "./utils/media-devices.js";

/** Returns every media input device visible to the current browser context. */
export async function listMediaDevices(): Promise<MediaDeviceInfo[]> {
  return await BrowserMediaDevices.listDevices();
}

/** Returns the available video input devices. */
export async function listVideoInputDevices(): Promise<MediaDeviceInfo[]> {
  return await BrowserMediaDevices.listVideoDevices();
}

/** Returns the available audio input devices. */
export async function listAudioInputDevices(): Promise<MediaDeviceInfo[]> {
  return await BrowserMediaDevices.listAudioDevices();
}
