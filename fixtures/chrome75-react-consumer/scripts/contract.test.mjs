import assert from "node:assert/strict";
import test from "node:test";
import { Window } from "happy-dom";

const browser = new Window({ url: "https://fixture.test" });
Object.assign(globalThis, {
  Event: browser.Event,
  HTMLElement: browser.HTMLElement,
  HTMLMediaElement: browser.HTMLMediaElement,
  Node: browser.Node,
  document: browser.document,
  window: browser,
});
Object.defineProperty(globalThis, "navigator", {
  configurable: true,
  value: browser.navigator,
});
Object.defineProperty(browser, "isSecureContext", { configurable: true, value: true });
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

Object.defineProperty(browser.HTMLMediaElement.prototype, "play", {
  configurable: true,
  value: () => Promise.resolve(),
});
Object.defineProperty(browser.HTMLMediaElement.prototype, "srcObject", {
  configurable: true,
  get() {
    return this._fixtureSrcObject ?? null;
  },
  set(value) {
    this._fixtureSrcObject = value;
  },
});
Object.defineProperty(browser.HTMLElement.prototype, "getBoundingClientRect", {
  configurable: true,
  value() {
    return { bottom: 480, height: 480, left: 0, right: 640, top: 0, width: 640, x: 0, y: 0 };
  },
});

const React = await import("react");
const { act } = React;
const { createRoot } = await import("react-dom/client");
const { Webcam, listMediaDevices } = await import("@cp949/react-webcam");

function makeStream() {
  const track = { addEventListener() {}, removeEventListener() {}, stopCalls: 0, stop() { this.stopCalls += 1; } };
  return {
    getAudioTracks: () => [],
    getTracks: () => [track],
    getVideoTracks: () => [track],
    track,
  };
}

test("packed package mounts with React 19, forwards media constraints, enumerates devices, and stops tracks", async () => {
  const stream = makeStream();
  const requestedConstraints = [];
  Object.defineProperty(globalThis, "isSecureContext", { configurable: true, value: true });
  Object.defineProperty(navigator, "mediaDevices", {
    configurable: true,
    value: {
      enumerateDevices: async () => [{ deviceId: "camera-1", kind: "videoinput" }],
      getUserMedia: async (constraints) => {
        requestedConstraints.push(constraints);
        return stream;
      },
    },
  });

  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  await act(async () => {
    root.render(React.createElement(Webcam, { webcamOptions: { audioEnabled: false } }));
  });
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 150));
  });

  assert.equal(requestedConstraints.length, 1);
  assert.equal(requestedConstraints[0].audio, false);
  assert.equal(container.querySelector("video")?.srcObject, stream);
  assert.deepEqual(await listMediaDevices(), [{ deviceId: "camera-1", kind: "videoinput" }]);

  await act(async () => root.unmount());
  assert.equal(stream.track.stopCalls, 1);
  container.remove();
});
