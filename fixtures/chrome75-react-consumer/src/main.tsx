import { Webcam } from "@cp949/react-webcam";
import { createElement } from "react";

export const consumerEntry = createElement(Webcam, {
  disabled: true,
  webcamOptions: { audioEnabled: false },
});
