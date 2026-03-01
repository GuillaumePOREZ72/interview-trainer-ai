interface Window {
  SpeechRecognition: any;
  webkitSpeechRecognition: any;
  AudioContext: typeof AudioContext;
  webkitAudioContext: typeof AudioContext;
}

interface Navigator {
  brave?: {
    isBrave: () => Promise<boolean>;
  };
}
